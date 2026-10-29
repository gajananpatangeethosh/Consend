import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataService } from "@/lib/storage/service";
import { hashToken } from "@/lib/crypto";
import {
  computeCanonicalTermsHash,
  computeDocumentCommitment,
  formatConsentIdToBytes32,
} from "@/lib/blockchain/contract";
import { blockchainService } from "@/lib/blockchain/service";

const GrantSchema = z.object({
  ownerWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address"),
  documentId: z.string().uuid("Invalid document ID"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const json = await req.json();
    const parsed = GrantSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { ownerWallet, documentId } = parsed.data;

    // Validate token
    const tokenHash = hashToken(token);
    const request = await dataService.getRequestByTokenHash(tokenHash);

    if (!request) {
      return NextResponse.json({ error: "Consent request not found or invalid token" }, { status: 404 });
    }

    // Verify request is pending and unexpired
    if (request.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot grant consent: request status is ${request.status}` },
        { status: 400 }
      );
    }

    const now = Date.now();
    const expiryTime = new Date(request.expires_at).getTime();
    if (expiryTime <= now) {
      await dataService.updateRequestStatus(request.id, "expired");
      return NextResponse.json({ error: "Request has expired" }, { status: 400 });
    }

    // Validate document ownership
    const document = await dataService.getDocumentById(documentId);
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.owner_wallet.toLowerCase() !== ownerWallet.toLowerCase()) {
      return NextResponse.json(
        { error: "Unauthorized: document does not belong to connected wallet" },
        { status: 403 }
      );
    }

    // Compute canonical terms hash
    const expiresAtSeconds = Math.floor(expiryTime / 1000);
    const termsHash = computeCanonicalTermsHash({
      requesterWallet: request.requester_wallet,
      purpose: request.purpose,
      requiredDocumentTypes: request.required_document_types,
      allowedActions: request.allowed_actions,
      expiresAtTimestamp: expiresAtSeconds,
    });

    // Compute document commitment
    const documentCommitment = computeDocumentCommitment(document.ciphertext_hash, ownerWallet);
    const consentIdHex = formatConsentIdToBytes32(request.id);

    // Create grant in database
    const grant = await dataService.createGrant({
      consent_id_hex: consentIdHex,
      request_id: request.id,
      owner_wallet: ownerWallet,
      requester_wallet: request.requester_wallet,
      document_id: document.id,
      terms_hash: termsHash,
      allowed_actions: request.allowed_actions,
      expires_at: request.expires_at,
    });

    // Update request status to granted
    await dataService.updateRequestStatus(request.id, "granted");

    // Submit grantConsent transaction to MST Blockchain
    const blockchainResult = await blockchainService.submitGrantConsent({
      consentId: request.id,
      grantId: grant.id,
      ownerWallet,
      documentCommitment,
    });

    // Record audit access event
    await dataService.recordAccessEvent({
      grant_id: grant.id,
      actor_wallet: ownerWallet,
      event_type: "CONSENT_GRANTED",
      metadata: {
        documentTitle: document.title,
        allowedActions: request.allowed_actions,
        expiresAt: request.expires_at,
      },
      blockchain_tx_hash: blockchainResult.txHash,
    });

    return NextResponse.json({
      success: true,
      grant,
      blockchain: blockchainResult,
      consentIdHex,
    });
  } catch (error: any) {
    console.error("Error granting consent:", error);
    return NextResponse.json({ error: "Internal server error", message: error?.message }, { status: 500 });
  }
}

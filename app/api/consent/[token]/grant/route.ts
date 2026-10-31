import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { dataService, parseRequestMetadata } from "@/lib/storage/service";
import { hashToken } from "@/lib/crypto";
import {
  computeCanonicalTermsHash,
  computeDocumentCommitment,
  formatConsentIdToBytes32,
} from "@/lib/blockchain/contract";
import { blockchainService } from "@/lib/blockchain/service";

const GrantSchema = z.object({
  ownerWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address"),
  documentId: z.string().optional().or(z.literal("")),
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

    // Validate token (supports plain token, token_hash, or request id)
    const tokenHash = hashToken(token);
    let request = await dataService.getRequestByTokenHash(tokenHash);

    if (!request) {
      request = await dataService.getRequestByTokenHash(token);
    }

    if (!request) {
      request = await dataService.getRequestById(token);
    }

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

    // Resolve document: use passed documentId, requester's attachedDocId, or create consent affirmation record
    const meta = parseRequestMetadata(request.purpose);
    const targetDocId = documentId || meta.attachedDocId;

    let document = targetDocId ? await dataService.getDocumentById(targetDocId) : null;

    if (!document) {
      const docHash = crypto.createHash("sha256").update(`${request.id}:${ownerWallet}`).digest("hex");
      document = await dataService.createDocument({
        owner_wallet: ownerWallet,
        title: request.title || "Consent Approval",
        doc_type: request.required_document_types?.[0] || "Consent Record",
        storage_path: `consent/${request.id}`,
        original_filename: "consent_approval.json",
        mime_type: "application/json",
        size_bytes: 64,
        ciphertext_hash: docHash,
        encrypted_payload: Buffer.from(
          JSON.stringify({
            approvedAt: new Date().toISOString(),
            approverWallet: ownerWallet,
            requestId: request.id,
          })
        ).toString("base64"),
      });
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

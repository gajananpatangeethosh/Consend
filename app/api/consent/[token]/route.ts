import { NextRequest, NextResponse } from "next/server";
import { dataService, parseRequestMetadata } from "@/lib/storage/service";
import { hashToken } from "@/lib/crypto";
import { computeCanonicalTermsHash, formatConsentIdToBytes32 } from "@/lib/blockchain/contract";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || token.length < 16) {
      return NextResponse.json({ error: "Invalid consent token" }, { status: 400 });
    }

    // Support plain token (32 bytes hex), token_hash (64 chars hex), or UUID id
    const tokenHash = hashToken(token);
    let request = await dataService.getRequestByTokenHash(tokenHash);

    if (!request) {
      // Fallback 1: Token passed in URL may already be the token_hash itself
      request = await dataService.getRequestByTokenHash(token);
    }

    if (!request) {
      // Fallback 2: Token passed in URL may be the request UUID
      request = await dataService.getRequestById(token);
    }

    if (!request) {
      return NextResponse.json({ error: "Consent request not found or invalid token" }, { status: 404 });
    }

    // Server-enforced expiry check
    const now = Date.now();
    const expiryTime = new Date(request.expires_at).getTime();
    const isExpired = expiryTime <= now;

    if (isExpired && request.status === "pending") {
      await dataService.updateRequestStatus(request.id, "expired");
      request.status = "expired";
    }

    // Requester profile details
    const requesterProfile = await dataService.getProfile(request.requester_wallet);

    const meta = parseRequestMetadata(request.purpose);

    // Compute canonical terms hash
    const expiresAtSeconds = Math.floor(expiryTime / 1000);
    const termsHash = computeCanonicalTermsHash({
      requesterWallet: request.requester_wallet,
      purpose: meta.cleanPurpose || request.purpose,
      requiredDocumentTypes: request.required_document_types,
      allowedActions: request.allowed_actions,
      expiresAtTimestamp: expiresAtSeconds,
    });

    const consentIdHex = formatConsentIdToBytes32(request.id);
    const grant = await dataService.getGrantByConsentHex(consentIdHex);

    return NextResponse.json({
      success: true,
      request: {
        id: request.id,
        grantId: grant?.id || null,
        title: request.title,
        purpose: meta.cleanPurpose || request.purpose,
        targetWallet: meta.targetWallet,
        attachedDocId: meta.attachedDocId,
        attachedDocTitle: meta.attachedDocTitle,
        requiredDocumentTypes: request.required_document_types,
        allowedActions: request.allowed_actions,
        expiresAt: request.expires_at,
        status: request.status,
        requesterWallet: request.requester_wallet,
        requesterName: requesterProfile?.display_name || "Authorized Requester",
        requesterOrg: requesterProfile?.organization_name || "Consend Verifier",
        termsHash,
        consentIdHex,
        isExpired,
      },
    });
  } catch (error: any) {
    console.error("Error fetching consent notice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

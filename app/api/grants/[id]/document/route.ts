import { NextRequest, NextResponse } from "next/server";
import { dataService } from "@/lib/storage/service";
import { blockchainService } from "@/lib/blockchain/service";
import { decryptDocumentPayload } from "@/lib/crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Requester wallet passed via header or parameter
    const requesterWallet =
      req.headers.get("x-wallet-address") ||
      searchParams.get("wallet") ||
      "";

    if (!requesterWallet) {
      return NextResponse.json(
        { error: "Access Denied: Requester wallet authentication is required" },
        { status: 401 }
      );
    }

    const grant = await dataService.getGrantById(id);
    if (!grant) {
      return NextResponse.json(
        { error: "Access Denied: Grant record does not exist" },
        { status: 404 }
      );
    }

    // 1. Identity Check: Must match authorized requester
    if (grant.requester_wallet.toLowerCase() !== requesterWallet.toLowerCase()) {
      await dataService.recordAccessEvent({
        grant_id: grant.id,
        actor_wallet: requesterWallet,
        event_type: "ACCESS_DENIED",
        metadata: {
          reason: "UNAUTHORIZED_REQUESTER",
          attemptedBy: requesterWallet,
          expectedRequester: grant.requester_wallet,
        },
      });

      return NextResponse.json(
        {
          error: "Access Denied: You are not the authorized recipient of this document grant",
        },
        { status: 403 }
      );
    }

    // 2. Revocation Check: Instant blockage
    if (grant.status === "revoked" || grant.revoked_at !== null) {
      await dataService.recordAccessEvent({
        grant_id: grant.id,
        actor_wallet: requesterWallet,
        event_type: "ACCESS_DENIED",
        metadata: {
          reason: "REVOKED_CONSENT",
          revokedAt: grant.revoked_at,
        },
      });

      return NextResponse.json(
        {
          error: "Access Denied: Consent for this document has been revoked by the owner",
          status: "revoked",
          revokedAt: grant.revoked_at,
        },
        { status: 410 }
      );
    }

    // 3. Expiry Check: Server-time enforced
    const now = Date.now();
    const expiryTime = new Date(grant.expires_at).getTime();
    if (expiryTime <= now) {
      await dataService.recordAccessEvent({
        grant_id: grant.id,
        actor_wallet: requesterWallet,
        event_type: "ACCESS_DENIED",
        metadata: {
          reason: "EXPIRED_CONSENT",
          expiredAt: grant.expires_at,
        },
      });

      return NextResponse.json(
        {
          error: "Access Denied: The time-limited consent window has expired",
          status: "expired",
          expiredAt: grant.expires_at,
        },
        { status: 410 }
      );
    }

    // 4. Fetch the document
    const document = await dataService.getDocumentById(grant.document_id);
    if (!document) {
      return NextResponse.json(
        { error: "Document payload not found in storage" },
        { status: 404 }
      );
    }

    // 5. Audit Logging & Blockchain recording
    const accessEvent = await dataService.recordAccessEvent({
      grant_id: grant.id,
      actor_wallet: requesterWallet,
      event_type: "ACCESS_ALLOWED",
      metadata: {
        action: "VIEW",
        documentTitle: document.title,
        allowedActions: grant.allowed_actions,
      },
    });

    // Asynchronously submit on-chain recordAccess to MST Blockchain
    blockchainService
      .submitRecordAccess({
        consentId: grant.request_id,
        grantId: grant.id,
        actionType: "VIEW",
      })
      .catch((err) => console.warn("Background recordAccess error:", err));

    // Dynamic watermark payload
    const watermark = {
      authorizedRequester: requesterWallet,
      ownerWallet: grant.owner_wallet,
      accessedAt: new Date().toISOString(),
      expiresAt: grant.expires_at,
      grantId: grant.id,
      consentTermsHash: grant.terms_hash,
      disclaimer: "TEMPORARY PERMISSIONED VIEW — COPYING OR REDISTRIBUTION PROHIBITED",
    };

    // Decrypt in-memory using AES-256-GCM vault key
    let decryptedPayload = document.encrypted_payload || "";
    if (document.encrypted_payload && document.encryption_iv) {
      decryptedPayload = decryptDocumentPayload(
        document.encrypted_payload,
        document.encryption_iv
      );
    }

    // Ensure valid Data URI for web browser preview (img src / iframe src)
    const mime = document.mime_type || "application/octet-stream";
    let formattedPayload = decryptedPayload;
    if (decryptedPayload && !decryptedPayload.startsWith("data:")) {
      formattedPayload = `data:${mime};base64,${decryptedPayload}`;
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        doc_type: document.doc_type,
        mime_type: document.mime_type,
        original_filename: document.original_filename,
        size_bytes: document.size_bytes,
        ciphertext_hash: document.ciphertext_hash,
        payload: formattedPayload, // Formatted Data URI
      },
      permissions: {
        allowedActions: grant.allowed_actions,
        expiresAt: grant.expires_at,
        remainingSeconds: Math.max(0, Math.floor((expiryTime - now) / 1000)),
      },
      watermark,
      accessEventId: accessEvent.id,
    });
  } catch (error: any) {
    console.error("Error accessing protected document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

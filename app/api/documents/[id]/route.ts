import { NextRequest, NextResponse } from "next/server";
import { dataService, parseRequestMetadata } from "@/lib/storage/service";
import { decryptDocumentPayload, hashToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet") || req.headers.get("x-wallet-address");
    const token = searchParams.get("token");

    if (!wallet && !token) {
      return NextResponse.json(
        { error: "Authentication required: Wallet address or token is required" },
        { status: 401 }
      );
    }

    const document = await dataService.getDocumentById(id);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if document is attached to a valid consent request
    let isAttachedToToken = false;
    if (token) {
      const tokenHash = hashToken(token);
      let request = await dataService.getRequestByTokenHash(tokenHash);
      if (!request) request = await dataService.getRequestByTokenHash(token);
      if (!request) request = await dataService.getRequestById(token);
      if (request) {
        const meta = parseRequestMetadata(request.purpose);
        if (meta.attachedDocId === id) {
          isAttachedToToken = true;
        }
      }
    }

    // Authorization: Requester must be document owner, have an active grant, or hold valid consent notice token
    const isOwner = Boolean(wallet && document.owner_wallet.toLowerCase() === wallet.toLowerCase());
    if (!isOwner && !isAttachedToToken) {
      // Check if this wallet is an authorized grant participant (requester, document owner, or target recipient)
      const grants = wallet ? await dataService.listGrantsForWallet(wallet) : [];
      let hasActiveGrant = false;

      if (wallet) {
        const cleanWallet = wallet.toLowerCase();
        for (const g of grants) {
          if (g.document_id === id && g.status === "active" && new Date(g.expires_at).getTime() > Date.now()) {
            if (
              g.requester_wallet.toLowerCase() === cleanWallet ||
              g.owner_wallet.toLowerCase() === cleanWallet
            ) {
              hasActiveGrant = true;
              break;
            }
            // Check targetWallet of associated request
            const reqItem = await dataService.getRequestById(g.request_id);
            if (reqItem) {
              const meta = parseRequestMetadata(reqItem.purpose);
              const target = ((reqItem as any)?.target_wallet || meta.targetWallet || "").toLowerCase();
              if (target === cleanWallet) {
                hasActiveGrant = true;
                break;
              }
            }
          }
        }
      }

      if (!hasActiveGrant) {
        return NextResponse.json(
          { error: "Access denied: You are not authorized to view this document" },
          { status: 403 }
        );
      }
    }

    // Decrypt payload in memory using vault master key
    let decryptedPayload = document.encrypted_payload || "";
    if (document.encrypted_payload && document.encryption_iv) {
      decryptedPayload = decryptDocumentPayload(
        document.encrypted_payload,
        document.encryption_iv
      );
    }

    // Ensure valid Data URI for web preview
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
        payload: formattedPayload,
        created_at: document.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error fetching document details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

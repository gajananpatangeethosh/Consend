import { NextRequest, NextResponse } from "next/server";
import { dataService, parseRequestMetadata } from "@/lib/storage/service";
import { encryptDocumentPayload, decryptDocumentPayload, hashToken } from "@/lib/crypto";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet =
      searchParams.get("wallet") ||
      req.headers.get("x-wallet-address");
    const docId = searchParams.get("id");
    const token = searchParams.get("token");

    if (!wallet && !token) {
      return NextResponse.json(
        { success: false, error: "wallet address or consent token is required" },
        { status: 400 }
      );
    }

    // Single document fetch with decrypted payload
    if (docId) {
      const doc = await dataService.getDocumentById(docId);
      if (!doc) {
        return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
      }

      let isAttachedToToken = false;
      if (token) {
        const tokenHash = hashToken(token);
        let request = await dataService.getRequestByTokenHash(tokenHash);
        if (!request) request = await dataService.getRequestByTokenHash(token);
        if (!request) request = await dataService.getRequestById(token);
        if (request) {
          const meta = parseRequestMetadata(request.purpose);
          if (meta.attachedDocId === docId) {
            isAttachedToToken = true;
          }
        }
      }

      const isOwner = wallet && doc.owner_wallet.toLowerCase() === wallet.toLowerCase();
      let hasActiveGrant = false;
      if (!isOwner && wallet) {
        const grants = await dataService.listGrantsForWallet(wallet);
        hasActiveGrant = grants.some(
          (g) =>
            g.document_id === docId &&
            g.status === "active" &&
            new Date(g.expires_at).getTime() > Date.now()
        );
      }

      if (!isOwner && !isAttachedToToken && !hasActiveGrant) {
        return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
      }

      let decryptedPayload = doc.encrypted_payload || "";
      if (doc.encrypted_payload && doc.encryption_iv) {
        decryptedPayload = decryptDocumentPayload(doc.encrypted_payload, doc.encryption_iv);
      }

      const mime = doc.mime_type || "application/octet-stream";
      let formattedPayload = decryptedPayload;
      if (decryptedPayload && !decryptedPayload.startsWith("data:")) {
        formattedPayload = `data:${mime};base64,${decryptedPayload}`;
      }

      return NextResponse.json({
        success: true,
        document: {
          id: doc.id,
          title: doc.title,
          doc_type: doc.doc_type,
          original_filename: doc.original_filename,
          mime_type: doc.mime_type,
          size_bytes: doc.size_bytes,
          ciphertext_hash: doc.ciphertext_hash,
          payload: formattedPayload,
          created_at: doc.created_at,
        },
      });
    }

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "wallet address is required to list vault documents" },
        { status: 400 }
      );
    }

    const docs = await dataService.listDocumentsByOwner(wallet);

    return NextResponse.json({
      success: true,
      documents: docs.map((d) => ({
        id: d.id,
        title: d.title,
        doc_type: d.doc_type,
        original_filename: d.original_filename,
        mime_type: d.mime_type,
        size_bytes: d.size_bytes,
        ciphertext_hash: d.ciphertext_hash,
        created_at: d.created_at,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ownerWallet,
      title,
      docType,
      filename,
      mimeType,
      rawContentBase64,
    } = body;

    if (!ownerWallet || !title || !docType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!rawContentBase64) {
      return NextResponse.json({ error: "Document content is required" }, { status: 400 });
    }

    // Standardize content: extract clean base64 string
    const cleanContent = rawContentBase64.includes(",")
      ? rawContentBase64.split(",")[1]
      : rawContentBase64;

    // Encrypt document with AES-256-GCM using persistent vault key and combined IV:AuthTag
    const { encryptedPayload, combinedIv, ciphertextHash } = encryptDocumentPayload(cleanContent);
    const storagePath = `vault/${ownerWallet}/${Date.now()}_${filename || "document.bin"}`;

    // Optionally backup encrypted bytes to Supabase Storage bucket 'vault'
    const supabase = createServerSupabase();
    if (supabase) {
      try {
        const cleanPath = `${ownerWallet}/${Date.now()}_${filename || "document.bin"}`;
        const buffer = Buffer.from(encryptedPayload, "utf-8");
        await supabase.storage.from("vault").upload(cleanPath, buffer, {
          contentType: "application/octet-stream",
          upsert: true,
        });
      } catch (storageErr) {
        console.warn("Supabase storage upload note:", storageErr);
      }
    }

    const doc = await dataService.createDocument({
      owner_wallet: ownerWallet,
      title,
      doc_type: docType,
      storage_path: storagePath,
      original_filename: filename || `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      mime_type: mimeType || "application/pdf",
      size_bytes: cleanContent.length,
      ciphertext_hash: ciphertextHash,
      encrypted_payload: encryptedPayload,
      encryption_iv: combinedIv,
    });

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        title: doc.title,
        doc_type: doc.doc_type,
        original_filename: doc.original_filename,
        ciphertext_hash: doc.ciphertext_hash,
        size_bytes: doc.size_bytes,
        created_at: doc.created_at,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

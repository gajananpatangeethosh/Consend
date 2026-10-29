import { NextRequest, NextResponse } from "next/server";
import { dataService } from "@/lib/storage/service";
import { encryptAES256GCM } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet =
      searchParams.get("wallet") ||
      req.headers.get("x-wallet-address") ||
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Priya Sharma demo fallback

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

    // Encrypt document with AES-256-GCM
    const content = rawContentBase64 || Buffer.from(`[SAMPLE ENCRYPTED DOCUMENT] ${title} - ${new Date().toISOString()}`).toString("base64");
    const { ciphertextBase64, hashSha256, ivHex } = encryptAES256GCM(content);

    const doc = await dataService.createDocument({
      owner_wallet: ownerWallet,
      title,
      doc_type: docType,
      storage_path: `vault/${ownerWallet}/${Date.now()}_${filename || "document.bin"}`,
      original_filename: filename || `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      mime_type: mimeType || "application/pdf",
      size_bytes: content.length,
      ciphertext_hash: hashSha256,
      encrypted_payload: ciphertextBase64,
      encryption_iv: ivHex,
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

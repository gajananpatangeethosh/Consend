import { NextRequest, NextResponse } from "next/server";
import { dataService } from "@/lib/storage/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const grant = await dataService.getGrantById(id);

    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    // Server-enforced expiry check
    const now = Date.now();
    const isExpired = new Date(grant.expires_at).getTime() <= now;

    const document = await dataService.getDocumentById(grant.document_id);
    const request = await dataService.getRequestById(grant.request_id);

    return NextResponse.json({
      success: true,
      grant: {
        ...grant,
        isExpired,
      },
      document: document
        ? {
            id: document.id,
            title: document.title,
            doc_type: document.doc_type,
            size_bytes: document.size_bytes,
            mime_type: document.mime_type,
            ciphertext_hash: document.ciphertext_hash,
          }
        : null,
      request: request
        ? {
            id: request.id,
            title: request.title,
            purpose: request.purpose,
            allowed_actions: request.allowed_actions,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error fetching grant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

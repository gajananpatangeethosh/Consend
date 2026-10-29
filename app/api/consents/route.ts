import { NextRequest, NextResponse } from "next/server";
import { dataService } from "@/lib/storage/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet") || req.headers.get("x-wallet-address");

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    const grants = await dataService.listGrantsForWallet(wallet);

    // Enhance with document title and expiry status
    const enhanced = await Promise.all(
      grants.map(async (g) => {
        const doc = await dataService.getDocumentById(g.document_id);
        const reqItem = await dataService.getRequestById(g.request_id);
        const isExpired = new Date(g.expires_at).getTime() <= Date.now();

        return {
          ...g,
          documentTitle: doc?.title || "Encrypted Document",
          docType: doc?.doc_type || "General",
          requestTitle: reqItem?.title || "Consent Request",
          purpose: reqItem?.purpose || "Document Verification",
          isExpired,
        };
      })
    );

    return NextResponse.json({ success: true, grants: enhanced });
  } catch (error: any) {
    console.error("Error fetching consents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

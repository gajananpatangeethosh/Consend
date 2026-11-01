import { NextRequest, NextResponse } from "next/server";
import { dataService, parseRequestMetadata } from "@/lib/storage/service";
import {
  CONSENT_REGISTRY_ADDRESS,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "@/lib/blockchain/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet") || req.headers.get("x-wallet-address");

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    const grants = await dataService.listGrantsForWallet(wallet);

    // Enhance with document title, clean purpose, target wallet, expiry status, and blockchain transaction trace
    const enhanced = await Promise.all(
      grants.map(async (g) => {
        const [doc, reqItem, tx] = await Promise.all([
          dataService.getDocumentById(g.document_id),
          dataService.getRequestById(g.request_id),
          dataService.getBlockchainTxByGrantId(g.id),
        ]);

        const isExpired = new Date(g.expires_at).getTime() <= Date.now();
        const txHash = tx?.transaction_hash || null;
        const contractAddress = tx?.contract_address || CONSENT_REGISTRY_ADDRESS;

        const meta = parseRequestMetadata(reqItem?.purpose || "");
        const cleanPurpose = meta.cleanPurpose || reqItem?.purpose || "Document Verification";
        const targetWallet = meta.targetWallet || (reqItem as any)?.target_wallet || null;

        return {
          ...g,
          documentTitle: doc?.title || "Encrypted Document",
          docType: doc?.doc_type || "General",
          requestTitle: reqItem?.title || "Consent Request",
          purpose: cleanPurpose,
          targetWallet: targetWallet,
          attachedDocId: meta.attachedDocId || null,
          attachedDocTitle: meta.attachedDocTitle || null,
          isExpired,
          contractAddress,
          transactionHash: txHash,
          txStatus: tx?.status || "confirmed",
          explorerTxUrl: txHash ? getExplorerTxUrl(txHash) : null,
          explorerContractUrl: getExplorerAddressUrl(contractAddress),
        };
      })
    );

    return NextResponse.json({ success: true, grants: enhanced });
  } catch (error: any) {
    console.error("Error fetching consents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

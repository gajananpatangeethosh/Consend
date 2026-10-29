import { NextRequest, NextResponse } from "next/server";
import { dataService } from "@/lib/storage/service";
import { getExplorerTxUrl } from "@/lib/blockchain/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all"; // 'all', 'blockchain', 'access', 'grants'
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const [accessEvents, blockchainTxs] = await Promise.all([
      dataService.listAccessEvents(limit),
      dataService.listBlockchainTxs(limit),
    ]);

    // Format audit items with explorer links and metadata
    const formattedTxs = blockchainTxs.map((tx) => ({
      id: tx.id,
      category: "BLOCKCHAIN" as const,
      type: `TX_${tx.action.toUpperCase()}`,
      title: `MST Blockchain: ${tx.action}`,
      consentIdHex: tx.consent_id_hex,
      status: tx.status,
      chainId: tx.chain_id,
      contractAddress: tx.contract_address,
      transactionHash: tx.transaction_hash,
      explorerUrl: tx.transaction_hash ? getExplorerTxUrl(tx.transaction_hash) : null,
      timestamp: tx.created_at,
    }));

    const formattedEvents = accessEvents.map((evt) => ({
      id: evt.id,
      category: "ACCESS" as const,
      type: evt.event_type,
      title: evt.event_type.replace(/_/g, " "),
      actorWallet: evt.actor_wallet,
      grantId: evt.grant_id,
      status: evt.status,
      metadata: evt.metadata,
      blockchainTxHash: evt.blockchain_tx_hash,
      explorerUrl: evt.blockchain_tx_hash ? getExplorerTxUrl(evt.blockchain_tx_hash) : null,
      timestamp: evt.occurred_at,
    }));

    let allItems = [...formattedTxs, ...formattedEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (filter === "blockchain") {
      allItems = allItems.filter((i) => i.category === "BLOCKCHAIN" || i.blockchainTxHash);
    } else if (filter === "access") {
      allItems = allItems.filter((i) => i.category === "ACCESS");
    }

    return NextResponse.json({
      success: true,
      items: allItems.slice(0, limit),
      counts: {
        total: allItems.length,
        blockchain: formattedTxs.length,
        access: formattedEvents.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching audit trail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { dataService } from "@/lib/storage/service";
import { blockchainService } from "@/lib/blockchain/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const callerWallet = body.callerWallet || req.headers.get("x-wallet-address");

    const grant = await dataService.getGrantById(id);
    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    if (callerWallet && grant.owner_wallet.toLowerCase() !== callerWallet.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized: only document owner can revoke" }, { status: 403 });
    }

    if (grant.status === "revoked") {
      return NextResponse.json({ error: "Grant is already revoked" }, { status: 400 });
    }

    // Revoke in database immediately
    const updated = await dataService.revokeGrant(id);

    // Submit revokeConsent on MST Blockchain
    const blockchainResult = await blockchainService.submitRevokeConsent({
      consentId: grant.request_id,
      grantId: grant.id,
    });

    // Record audit access event
    await dataService.recordAccessEvent({
      grant_id: grant.id,
      actor_wallet: grant.owner_wallet,
      event_type: "CONSENT_REVOKED",
      metadata: {
        revokedAt: new Date().toISOString(),
      },
      blockchain_tx_hash: blockchainResult.txHash,
    });

    return NextResponse.json({
      success: true,
      grant: updated,
      blockchain: blockchainResult,
    });
  } catch (error: any) {
    console.error("Error revoking consent:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

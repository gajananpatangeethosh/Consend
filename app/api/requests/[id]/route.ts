import { NextRequest, NextResponse } from "next/server";
import { dataService } from "@/lib/storage/service";
import { formatConsentIdToBytes32 } from "@/lib/blockchain/contract";
import {
  CONSENT_REGISTRY_ADDRESS,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from "@/lib/blockchain/config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const request = await dataService.getRequestById(id);

    if (!request) {
      return NextResponse.json(
        { error: "Consent request not found" },
        { status: 404 }
      );
    }

    // Check if expired based on server time
    const isExpired = new Date(request.expires_at).getTime() <= Date.now();
    if (isExpired && request.status === "pending") {
      await dataService.updateRequestStatus(id, "expired");
      request.status = "expired";
    }

    // Find associated grant if granted
    const consentIdHex = formatConsentIdToBytes32(request.id);
    const [grant, blockchainTx] = await Promise.all([
      dataService.getGrantByConsentHex(consentIdHex),
      dataService.getBlockchainTxByConsentHex(consentIdHex),
    ]);

    const contractAddress = blockchainTx?.contract_address || CONSENT_REGISTRY_ADDRESS;
    const txHash = blockchainTx?.transaction_hash || null;

    return NextResponse.json({
      success: true,
      request,
      grant: grant || null,
      consentIdHex,
      contractAddress,
      transactionHash: txHash,
      txStatus: blockchainTx?.status || (request.status === "pending" ? "pending" : "confirmed"),
      explorerTxUrl: txHash ? getExplorerTxUrl(txHash) : null,
      explorerContractUrl: getExplorerAddressUrl(contractAddress),
    });
  } catch (error: any) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

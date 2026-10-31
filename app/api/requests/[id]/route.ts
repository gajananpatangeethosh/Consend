import { NextRequest, NextResponse } from "next/server";
import {
  dataService,
  parseRequestMetadata,
  formatRequestPurpose,
} from "@/lib/storage/service";
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

    const meta = parseRequestMetadata(request.purpose);
    const cleanedRequest = {
      ...request,
      purpose: meta.cleanPurpose,
      targetWallet: meta.targetWallet,
      plainToken: meta.plainToken,
      attachedDocId: meta.attachedDocId,
      attachedDocTitle: meta.attachedDocTitle,
    };

    return NextResponse.json({
      success: true,
      request: cleanedRequest,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const { wallet, attachedDocId, attachedDocTitle } = json;

    if (!wallet) {
      return NextResponse.json({ error: "Requester wallet address required" }, { status: 401 });
    }

    const request = await dataService.getRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Consent request not found" }, { status: 404 });
    }

    if (request.requester_wallet.toLowerCase() !== wallet.toLowerCase()) {
      return NextResponse.json(
        { error: "Unauthorized: only the requester can update this request" },
        { status: 403 }
      );
    }

    if (request.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot attach document: request status is ${request.status}` },
        { status: 400 }
      );
    }

    const meta = parseRequestMetadata(request.purpose);
    const updatedPurpose = formatRequestPurpose(
      meta.cleanPurpose,
      meta.targetWallet,
      meta.plainToken,
      attachedDocId || null,
      attachedDocTitle || null
    );

    const updated = await dataService.updateRequestPurpose(id, updatedPurpose);

    return NextResponse.json({
      success: true,
      request: {
        ...updated,
        purpose: meta.cleanPurpose,
        targetWallet: meta.targetWallet,
        plainToken: meta.plainToken,
        attachedDocId: attachedDocId || null,
        attachedDocTitle: attachedDocTitle || null,
      },
    });
  } catch (error: any) {
    console.error("Error updating consent request attachment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

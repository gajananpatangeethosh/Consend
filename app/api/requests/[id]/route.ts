import { NextRequest, NextResponse } from "next/server";
import { dataService } from "@/lib/storage/service";
import { formatConsentIdToBytes32 } from "@/lib/blockchain/contract";

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
    const grant = await dataService.getGrantByConsentHex(consentIdHex);

    return NextResponse.json({
      success: true,
      request,
      grant: grant || null,
      consentIdHex,
    });
  } catch (error: any) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataService } from "@/lib/storage/service";
import { hashToken } from "@/lib/crypto";

const DenySchema = z.object({
  ownerWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address"),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const json = await req.json().catch(() => ({}));
    const parsed = DenySchema.safeParse(json);

    const tokenHash = hashToken(token);
    const request = await dataService.getRequestByTokenHash(tokenHash);

    if (!request) {
      return NextResponse.json({ error: "Consent request not found or invalid token" }, { status: 404 });
    }

    if (request.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot deny request with status ${request.status}` },
        { status: 400 }
      );
    }

    await dataService.updateRequestStatus(request.id, "denied");

    return NextResponse.json({
      success: true,
      message: "Consent request denied",
      status: "denied",
    });
  } catch (error: any) {
    console.error("Error denying consent:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

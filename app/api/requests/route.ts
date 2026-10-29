import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataService } from "@/lib/storage/service";
import { generateSecureToken } from "@/lib/crypto";
import { generateQrDataUrl } from "@/lib/qr";
import { computeCanonicalTermsHash, formatConsentIdToBytes32 } from "@/lib/blockchain/contract";
import { blockchainService } from "@/lib/blockchain/service";

export const dynamic = "force-dynamic";

const CreateRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  purpose: z.string().min(5, "Purpose must be at least 5 characters"),
  requiredDocumentTypes: z.array(z.string()).min(1, "Select at least one document type"),
  allowedActions: z.array(z.enum(["VIEW", "PRINT"])).min(1, "Select at least one action"),
  durationMinutes: z.number().int().min(1).max(10080), // 1 min to 7 days
  requesterWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address"),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = CreateRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      purpose,
      requiredDocumentTypes,
      allowedActions,
      durationMinutes,
      requesterWallet,
    } = parsed.data;

    // Cryptographically secure token for public URL
    const { plainToken, tokenHash } = generateSecureToken();

    // Server-enforced expiry timestamp
    const expiresAtDate = new Date(Date.now() + durationMinutes * 60 * 1000);
    const expiresAt = expiresAtDate.toISOString();
    const expiresAtSeconds = Math.floor(expiresAtDate.getTime() / 1000);

    // Compute canonical terms hash
    const termsHash = computeCanonicalTermsHash({
      requesterWallet,
      purpose,
      requiredDocumentTypes,
      allowedActions,
      expiresAtTimestamp: expiresAtSeconds,
    });

    // Save request to database
    const request = await dataService.createRequest({
      requester_wallet: requesterWallet,
      title,
      purpose,
      required_document_types: requiredDocumentTypes,
      allowed_actions: allowedActions,
      expires_at: expiresAt,
      token_hash: tokenHash,
    });

    // Compute consent URL & QR code
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const consentUrl = `${protocol}://${host}/consent/${plainToken}`;

    const qrCodeDataUrl = await generateQrDataUrl(consentUrl);

    // Submit on-chain createConsent transaction (via relayer if available)
    const consentIdHex = formatConsentIdToBytes32(request.id);
    const onChainResult = await blockchainService.submitCreateConsent({
      consentId: request.id,
      requesterWallet,
      termsHash,
      expiresAtTimestamp: expiresAtSeconds,
    });

    return NextResponse.json(
      {
        success: true,
        request: {
          ...request,
          plainToken,
          consentUrl,
          qrCodeDataUrl,
          termsHash,
          consentIdHex,
        },
        blockchain: onChainResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating consent request:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet") || req.headers.get("x-wallet-address");

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address parameter is required" },
        { status: 400 }
      );
    }

    const requests = await dataService.listRequestsByRequester(wallet);
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("Error listing requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

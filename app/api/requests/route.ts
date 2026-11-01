import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  dataService,
  formatRequestPurpose,
  parseRequestMetadata,
} from "@/lib/storage/service";
import { generateSecureToken } from "@/lib/crypto";
import { generateQrDataUrl } from "@/lib/qr";
import { computeCanonicalTermsHash, formatConsentIdToBytes32 } from "@/lib/blockchain/contract";
import { blockchainService } from "@/lib/blockchain/service";

export const dynamic = "force-dynamic";

const CreateRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  purpose: z.string().min(3, "Purpose must be at least 3 characters"),
  requiredDocumentTypes: z.array(z.string()).min(1, "Select at least one document type"),
  allowedActions: z.array(z.enum(["VIEW", "PRINT", "DOWNLOAD"])).min(1, "Select at least one action"),
  durationMinutes: z.number().int().min(1).max(10080), // 1 min to 7 days
  requesterWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address"),
  targetWallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid recipient EVM wallet address")
    .optional()
    .or(z.literal("")),
  attachedDocId: z.string().optional().or(z.literal("")),
  attachedDocTitle: z.string().optional().or(z.literal("")),
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
      targetWallet,
      attachedDocId,
      attachedDocTitle,
    } = parsed.data;

    // Cryptographically secure token for public URL
    const { plainToken, tokenHash } = generateSecureToken();

    // Clean target recipient wallet if provided
    const cleanTargetWallet =
      targetWallet && targetWallet.trim() ? targetWallet.trim().toLowerCase() : null;

    // Embed metadata tag safely in purpose
    const encodedPurpose = formatRequestPurpose(
      purpose,
      cleanTargetWallet,
      plainToken,
      attachedDocId || null,
      attachedDocTitle || null
    );

    // Server-enforced expiry timestamp
    const expiresAtDate = new Date(Date.now() + durationMinutes * 60 * 1000);
    const expiresAt = expiresAtDate.toISOString();
    const expiresAtSeconds = Math.floor(expiresAtDate.getTime() / 1000);

    // Compute canonical terms hash
    const termsHash = computeCanonicalTermsHash({
      requesterWallet,
      purpose: purpose.trim(),
      requiredDocumentTypes,
      allowedActions,
      expiresAtTimestamp: expiresAtSeconds,
    });

    // Save request to database
    const request = await dataService.createRequest({
      requester_wallet: requesterWallet,
      title,
      purpose: encodedPurpose,
      required_document_types: requiredDocumentTypes,
      allowed_actions: allowedActions,
      expires_at: expiresAt,
      token_hash: tokenHash,
      target_wallet: cleanTargetWallet,
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
          purpose: purpose.trim(),
          targetWallet: cleanTargetWallet,
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

    const [sentRequests, incomingRequests] = await Promise.all([
      dataService.listRequestsByRequester(wallet),
      dataService.listIncomingRequestsForWallet(wallet),
    ]);

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

    const enhanceRequest = (r: any) => {
      const meta = parseRequestMetadata(r.purpose);
      const tokenToUse = meta.plainToken || r.token_hash;
      const isExpired = new Date(r.expires_at).getTime() <= Date.now();
      return {
        ...r,
        purpose: meta.cleanPurpose,
        targetWallet: meta.targetWallet,
        plainToken: meta.plainToken,
        attachedDocId: meta.attachedDocId,
        attachedDocTitle: meta.attachedDocTitle,
        consentUrl: `${protocol}://${host}/consent/${tokenToUse}`,
        isExpired,
      };
    };

    return NextResponse.json({
      success: true,
      requests: sentRequests.map(enhanceRequest),
      incomingRequests: incomingRequests.map(enhanceRequest),
    });
  } catch (error: any) {
    console.error("Error listing requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

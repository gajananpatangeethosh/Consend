import { NextRequest, NextResponse } from "next/server";
import { dataService } from "@/lib/storage/service";
import { DEMO_PERSONAS } from "@/components/wallet/WalletContext";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet") || req.headers.get("x-wallet-address");

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    const cleanWallet = wallet.toLowerCase();

    // 1. Check database profile
    const profile = await dataService.getProfile(cleanWallet);
    if (profile && profile.display_name) {
      return NextResponse.json({ success: true, profile });
    }

    // 2. Check DEMO_PERSONAS fallback
    const matchedPersona = DEMO_PERSONAS.find(
      (p) => p.address.toLowerCase() === cleanWallet
    );

    if (matchedPersona) {
      return NextResponse.json({
        success: true,
        profile: {
          wallet_address: matchedPersona.address,
          display_name: matchedPersona.name,
          organization_name: matchedPersona.institution || matchedPersona.role,
          role: matchedPersona.role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        wallet_address: wallet,
        display_name: null,
        organization_name: null,
      },
    });
  } catch (err: any) {
    console.error("Error fetching wallet profile:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { wallet, displayName, organizationName } = json;

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
      return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 });
    }

    const updated = await dataService.upsertProfile({
      wallet_address: wallet,
      display_name: displayName?.trim() || undefined,
      organization_name: organizationName?.trim() || undefined,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    console.error("Error updating profile:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

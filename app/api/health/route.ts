import { NextResponse } from "next/server";
import { ACTIVE_NETWORK, CONSENT_REGISTRY_ADDRESS } from "@/lib/blockchain/config";

export async function GET() {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const isRelayerConfigured = Boolean(process.env.MST_RELAYER_PRIVATE_KEY);

  return NextResponse.json({
    status: "ok",
    product: "Consend",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    blockchain: {
      network: ACTIVE_NETWORK.name,
      chainId: ACTIVE_NETWORK.chainId,
      rpcUrl: ACTIVE_NETWORK.rpcUrl,
      explorerUrl: ACTIVE_NETWORK.explorerUrl,
      contractAddress: CONSENT_REGISTRY_ADDRESS,
      isRelayerConfigured,
    },
    backend: {
      isSupabaseConfigured,
      storageEngine: isSupabaseConfigured ? "Supabase PostgreSQL + Storage" : "Local Resilient Vault Store",
    },
  });
}

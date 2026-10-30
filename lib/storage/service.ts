import { createServerSupabase } from "../supabase/server";
import type { Database } from "../database.types";
import crypto from "crypto";

// Unified types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ConsentRequest = Database["public"]["Tables"]["consent_requests"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type ConsentGrant = Database["public"]["Tables"]["consent_grants"]["Row"];
export type AccessEvent = Database["public"]["Tables"]["access_events"]["Row"];
export type BlockchainTx = Database["public"]["Tables"]["blockchain_transactions"]["Row"];

// In-Memory resilient fallback state (for development, tests, or when Supabase keys are pending)
const globalStore = global as unknown as {
  __consentProfiles?: Map<string, Profile>;
  __consentRequests?: Map<string, ConsentRequest>;
  __tokenToRequestId?: Map<string, string>;
  __consentDocuments?: Map<string, Document>;
  __consentGrants?: Map<string, ConsentGrant>;
  __consentAccessEvents?: AccessEvent[];
  __consentBlockchainTxs?: Map<string, BlockchainTx>;
  __storeInitialized?: boolean;
};

if (!globalStore.__consentProfiles) globalStore.__consentProfiles = new Map();
if (!globalStore.__consentRequests) globalStore.__consentRequests = new Map();
if (!globalStore.__tokenToRequestId) globalStore.__tokenToRequestId = new Map();
if (!globalStore.__consentDocuments) globalStore.__consentDocuments = new Map();
if (!globalStore.__consentGrants) globalStore.__consentGrants = new Map();
if (!globalStore.__consentAccessEvents) globalStore.__consentAccessEvents = [];
if (!globalStore.__consentBlockchainTxs) globalStore.__consentBlockchainTxs = new Map();


export const dataService = {
  // --- Profiles ---
  async getProfile(walletAddress: string): Promise<Profile | null> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .ilike("wallet_address", walletAddress)
        .maybeSingle();
      if (data) return data as Profile;
    }
    return globalStore.__consentProfiles?.get(walletAddress.toLowerCase()) || null;
  },

  async upsertProfile(profile: {
    wallet_address: string;
    display_name?: string;
    organization_name?: string;
  }): Promise<Profile> {
    const supabase: any = createServerSupabase();
    const cleanAddress = profile.wallet_address.toLowerCase();

    if (supabase) {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            wallet_address: profile.wallet_address,
            display_name: profile.display_name || null,
            organization_name: profile.organization_name || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "wallet_address" }
        )
        .select()
        .single();
      if (!error && data) return data as Profile;
    }

    const existing = globalStore.__consentProfiles?.get(cleanAddress);
    const updated: Profile = {
      id: existing ? existing.id : crypto.randomUUID(),
      wallet_address: profile.wallet_address,
      display_name: profile.display_name || existing?.display_name || null,
      organization_name: profile.organization_name || existing?.organization_name || null,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalStore.__consentProfiles?.set(cleanAddress, updated);
    return updated;
  },

  // --- Requests ---
  async createRequest(req: {
    requester_wallet: string;
    title: string;
    purpose: string;
    required_document_types: string[];
    allowed_actions: ("VIEW" | "PRINT")[];
    expires_at: string;
    token_hash: string;
  }): Promise<ConsentRequest> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("consent_requests")
        .insert({
          requester_wallet: req.requester_wallet,
          title: req.title,
          purpose: req.purpose,
          required_document_types: req.required_document_types,
          allowed_actions: req.allowed_actions,
          expires_at: req.expires_at,
          token_hash: req.token_hash,
          status: "pending",
        })
        .select()
        .single();
      if (!error && data) return data as ConsentRequest;
    }

    const newReq: ConsentRequest = {
      id: crypto.randomUUID(),
      requester_wallet: req.requester_wallet,
      title: req.title,
      purpose: req.purpose,
      required_document_types: req.required_document_types,
      allowed_actions: req.allowed_actions,
      expires_at: req.expires_at,
      token_hash: req.token_hash,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalStore.__consentRequests?.set(newReq.id, newReq);
    globalStore.__tokenToRequestId?.set(req.token_hash, newReq.id);
    return newReq;
  },

  async getRequestById(id: string): Promise<ConsentRequest | null> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase.from("consent_requests").select("*").eq("id", id).maybeSingle();
      if (data) return data as ConsentRequest;
    }
    return globalStore.__consentRequests?.get(id) || null;
  },

  async getRequestByTokenHash(tokenHash: string): Promise<ConsentRequest | null> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("consent_requests")
        .select("*")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (data) return data as ConsentRequest;
    }
    const id = globalStore.__tokenToRequestId?.get(tokenHash);
    if (!id) return null;
    return globalStore.__consentRequests?.get(id) || null;
  },

  async updateRequestStatus(
    id: string,
    status: "pending" | "granted" | "denied" | "expired"
  ): Promise<ConsentRequest | null> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("consent_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (data) return data as ConsentRequest;
    }
    const existing = globalStore.__consentRequests?.get(id);
    if (!existing) return null;
    existing.status = status;
    existing.updated_at = new Date().toISOString();
    return existing;
  },

  async listRequestsByRequester(walletAddress: string): Promise<ConsentRequest[]> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("consent_requests")
        .select("*")
        .ilike("requester_wallet", walletAddress)
        .order("created_at", { ascending: false });
      if (data) return data as ConsentRequest[];
    }
    const list: ConsentRequest[] = [];
    globalStore.__consentRequests?.forEach((r) => {
      if (r.requester_wallet.toLowerCase() === walletAddress.toLowerCase()) {
        list.push(r);
      }
    });
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // --- Documents ---
  async createDocument(doc: {
    owner_wallet: string;
    title: string;
    doc_type: string;
    storage_path: string;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    ciphertext_hash: string;
    encrypted_payload?: string | null;
    encryption_iv?: string | null;
  }): Promise<Document> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          owner_wallet: doc.owner_wallet,
          title: doc.title,
          doc_type: doc.doc_type,
          storage_path: doc.storage_path,
          original_filename: doc.original_filename,
          mime_type: doc.mime_type,
          size_bytes: doc.size_bytes,
          ciphertext_hash: doc.ciphertext_hash,
          encrypted_payload: doc.encrypted_payload || null,
          encryption_iv: doc.encryption_iv || null,
        })
        .select()
        .single();
      if (!error && data) return data as Document;
    }

    const newDoc: Document = {
      id: crypto.randomUUID(),
      owner_wallet: doc.owner_wallet,
      title: doc.title,
      doc_type: doc.doc_type,
      storage_path: doc.storage_path,
      original_filename: doc.original_filename,
      mime_type: doc.mime_type,
      size_bytes: doc.size_bytes,
      ciphertext_hash: doc.ciphertext_hash,
      encrypted_payload: doc.encrypted_payload || null,
      encryption_iv: doc.encryption_iv || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalStore.__consentDocuments?.set(newDoc.id, newDoc);
    return newDoc;
  },

  async getDocumentById(id: string): Promise<Document | null> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
      if (data) return data as Document;
    }
    return globalStore.__consentDocuments?.get(id) || null;
  },

  async listDocumentsByOwner(walletAddress: string): Promise<Document[]> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .ilike("owner_wallet", walletAddress)
        .order("created_at", { ascending: false });
      if (data) return data as Document[];
    }
    const list: Document[] = [];
    globalStore.__consentDocuments?.forEach((d) => {
      if (d.owner_wallet.toLowerCase() === walletAddress.toLowerCase()) {
        list.push(d);
      }
    });
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // --- Consent Grants ---
  async createGrant(grant: {
    consent_id_hex: string;
    request_id: string;
    owner_wallet: string;
    requester_wallet: string;
    document_id: string;
    terms_hash: string;
    allowed_actions: ("VIEW" | "PRINT")[];
    expires_at: string;
  }): Promise<ConsentGrant> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("consent_grants")
        .insert({
          consent_id_hex: grant.consent_id_hex,
          request_id: grant.request_id,
          owner_wallet: grant.owner_wallet,
          requester_wallet: grant.requester_wallet,
          document_id: grant.document_id,
          terms_hash: grant.terms_hash,
          allowed_actions: grant.allowed_actions,
          expires_at: grant.expires_at,
          status: "active",
        })
        .select()
        .single();
      if (!error && data) return data as ConsentGrant;
    }

    const newGrant: ConsentGrant = {
      id: crypto.randomUUID(),
      consent_id_hex: grant.consent_id_hex,
      request_id: grant.request_id,
      owner_wallet: grant.owner_wallet,
      requester_wallet: grant.requester_wallet,
      document_id: grant.document_id,
      terms_hash: grant.terms_hash,
      allowed_actions: grant.allowed_actions,
      granted_at: new Date().toISOString(),
      expires_at: grant.expires_at,
      revoked_at: null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalStore.__consentGrants?.set(newGrant.id, newGrant);
    return newGrant;
  },

  async getGrantById(id: string): Promise<ConsentGrant | null> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase.from("consent_grants").select("*").eq("id", id).maybeSingle();
      if (data) return data as ConsentGrant;
    }
    return globalStore.__consentGrants?.get(id) || null;
  },

  async getGrantByConsentHex(hex: string): Promise<ConsentGrant | null> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("consent_grants")
        .select("*")
        .eq("consent_id_hex", hex)
        .maybeSingle();
      if (data) return data as ConsentGrant;
    }
    for (const g of globalStore.__consentGrants?.values() || []) {
      if (g.consent_id_hex.toLowerCase() === hex.toLowerCase()) return g;
    }
    return null;
  },

  async revokeGrant(id: string): Promise<ConsentGrant | null> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("consent_grants")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (data) return data as ConsentGrant;
    }
    const existing = globalStore.__consentGrants?.get(id);
    if (!existing) return null;
    existing.status = "revoked";
    existing.revoked_at = new Date().toISOString();
    return existing;
  },

  async listGrantsForWallet(walletAddress: string): Promise<ConsentGrant[]> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("consent_grants")
        .select("*")
        .or(`owner_wallet.ilike.${walletAddress},requester_wallet.ilike.${walletAddress}`)
        .order("created_at", { ascending: false });
      if (data) return data as ConsentGrant[];
    }
    const clean = walletAddress.toLowerCase();
    const list: ConsentGrant[] = [];
    globalStore.__consentGrants?.forEach((g) => {
      if (g.owner_wallet.toLowerCase() === clean || g.requester_wallet.toLowerCase() === clean) {
        list.push(g);
      }
    });
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // --- Access Events ---
  async recordAccessEvent(event: {
    grant_id: string;
    actor_wallet: string;
    event_type: string;
    metadata?: any;
    blockchain_tx_hash?: string | null;
  }): Promise<AccessEvent> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("access_events")
        .insert({
          grant_id: event.grant_id,
          actor_wallet: event.actor_wallet,
          event_type: event.event_type,
          metadata: event.metadata || {},
          blockchain_tx_hash: event.blockchain_tx_hash || null,
          status: "recorded",
        })
        .select()
        .single();
      if (!error && data) return data as AccessEvent;
    }

    const newEvt: AccessEvent = {
      id: crypto.randomUUID(),
      grant_id: event.grant_id,
      actor_wallet: event.actor_wallet,
      event_type: event.event_type,
      occurred_at: new Date().toISOString(),
      metadata: event.metadata || {},
      blockchain_tx_hash: event.blockchain_tx_hash || null,
      status: "recorded",
    };
    globalStore.__consentAccessEvents?.push(newEvt);
    return newEvt;
  },

  async listAccessEvents(limit = 100): Promise<AccessEvent[]> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("access_events")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (data) return data as AccessEvent[];
    }
    return [...(globalStore.__consentAccessEvents || [])]
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .slice(0, limit);
  },

  // --- Blockchain Transactions ---
  async recordBlockchainTx(tx: {
    grant_id?: string | null;
    consent_id_hex: string;
    action: string;
    chain_id: number;
    transaction_hash?: string | null;
    contract_address: string;
    status: "pending" | "submitted" | "confirmed" | "failed";
    error_code?: string | null;
  }): Promise<BlockchainTx> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("blockchain_transactions")
        .insert({
          grant_id: tx.grant_id || null,
          consent_id_hex: tx.consent_id_hex,
          action: tx.action,
          chain_id: tx.chain_id,
          transaction_hash: tx.transaction_hash || null,
          contract_address: tx.contract_address,
          status: tx.status,
          error_code: tx.error_code || null,
        })
        .select()
        .single();
      if (!error && data) return data as BlockchainTx;
    }

    const newTx: BlockchainTx = {
      id: crypto.randomUUID(),
      grant_id: tx.grant_id || null,
      consent_id_hex: tx.consent_id_hex,
      action: tx.action,
      chain_id: tx.chain_id,
      transaction_hash: tx.transaction_hash || null,
      contract_address: tx.contract_address,
      status: tx.status,
      error_code: tx.error_code || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalStore.__consentBlockchainTxs?.set(newTx.id, newTx);
    return newTx;
  },

  async updateBlockchainTx(
    id: string,
    updates: {
      status?: "pending" | "submitted" | "confirmed" | "failed";
      transaction_hash?: string;
      error_code?: string | null;
    }
  ): Promise<BlockchainTx | null> {
    const supabase: any = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("blockchain_transactions")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (data) return data as BlockchainTx;
    }
    const existing = globalStore.__consentBlockchainTxs?.get(id);
    if (!existing) return null;
    if (updates.status) existing.status = updates.status;
    if (updates.transaction_hash) existing.transaction_hash = updates.transaction_hash;
    if (updates.error_code !== undefined) existing.error_code = updates.error_code;
    existing.updated_at = new Date().toISOString();
    return existing;
  },

  async listBlockchainTxs(limit = 100): Promise<BlockchainTx[]> {
    const supabase = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("blockchain_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (data) return data as BlockchainTx[];
    }
    return Array.from(globalStore.__consentBlockchainTxs?.values() || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  async getBlockchainTxByConsentHex(consentIdHex: string): Promise<BlockchainTx | null> {
    const supabase = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("blockchain_transactions")
        .select("*")
        .eq("consent_id_hex", consentIdHex)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) return data as BlockchainTx;
    }
    const all = Array.from(globalStore.__consentBlockchainTxs?.values() || []);
    return (
      all
        .filter((t) => t.consent_id_hex === consentIdHex)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null
    );
  },

  async getBlockchainTxByGrantId(grantId: string): Promise<BlockchainTx | null> {
    const supabase = createServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from("blockchain_transactions")
        .select("*")
        .eq("grant_id", grantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) return data as BlockchainTx;
    }
    const all = Array.from(globalStore.__consentBlockchainTxs?.values() || []);
    return (
      all
        .filter((t) => t.grant_id === grantId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null
    );
  },
};

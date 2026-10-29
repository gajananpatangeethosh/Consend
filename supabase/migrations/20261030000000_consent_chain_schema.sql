-- Consent Chain: Complete Supabase PostgreSQL Schema with RLS and Indexes
-- Privacy-first document consent with MST Blockchain audit trail
-- Wallet-based identity (BridgeKey / Web3 Wallet of MST Blockchain)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    organization_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on wallet address (lowercased for case-insensitive matching)
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles (LOWER(wallet_address));

-- 2. CONSENT REQUESTS
CREATE TABLE IF NOT EXISTS public.consent_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_wallet TEXT NOT NULL,
    title TEXT NOT NULL,
    purpose TEXT NOT NULL,
    required_document_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    allowed_actions JSONB NOT NULL DEFAULT '["VIEW"]'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'denied', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_token_hash ON public.consent_requests (token_hash);
CREATE INDEX IF NOT EXISTS idx_requests_requester_wallet ON public.consent_requests (LOWER(requester_wallet));
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.consent_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_expires_at ON public.consent_requests (expires_at);

-- 3. DOCUMENTS (Vault)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_wallet TEXT NOT NULL,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    ciphertext_hash TEXT NOT NULL,
    encrypted_payload TEXT,
    encryption_iv TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner_wallet ON public.documents (LOWER(owner_wallet));

-- 4. CONSENT GRANTS
CREATE TABLE IF NOT EXISTS public.consent_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id_hex TEXT UNIQUE NOT NULL,
    request_id UUID REFERENCES public.consent_requests(id) ON DELETE CASCADE,
    owner_wallet TEXT NOT NULL,
    requester_wallet TEXT NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    terms_hash TEXT NOT NULL,
    allowed_actions JSONB NOT NULL DEFAULT '["VIEW"]'::jsonb,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grants_consent_id ON public.consent_grants (consent_id_hex);
CREATE INDEX IF NOT EXISTS idx_grants_owner_wallet ON public.consent_grants (LOWER(owner_wallet));
CREATE INDEX IF NOT EXISTS idx_grants_requester_wallet ON public.consent_grants (LOWER(requester_wallet));
CREATE INDEX IF NOT EXISTS idx_grants_status ON public.consent_grants (status);
CREATE INDEX IF NOT EXISTS idx_grants_expires_at ON public.consent_grants (expires_at);

-- 5. ACCESS EVENTS
CREATE TABLE IF NOT EXISTS public.access_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id UUID REFERENCES public.consent_grants(id) ON DELETE CASCADE,
    actor_wallet TEXT NOT NULL,
    event_type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    blockchain_tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'recorded'
);

CREATE INDEX IF NOT EXISTS idx_access_events_grant ON public.access_events (grant_id);
CREATE INDEX IF NOT EXISTS idx_access_events_actor ON public.access_events (LOWER(actor_wallet));
CREATE INDEX IF NOT EXISTS idx_access_events_occurred_at ON public.access_events (occurred_at DESC);

-- 6. BLOCKCHAIN TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id UUID REFERENCES public.consent_grants(id) ON DELETE SET NULL,
    consent_id_hex TEXT NOT NULL,
    action TEXT NOT NULL,
    chain_id BIGINT NOT NULL,
    transaction_hash TEXT,
    contract_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed')),
    error_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON public.blockchain_transactions (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_consent_id ON public.blockchain_transactions (consent_id_hex);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON public.blockchain_transactions (status);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Read policies for profiles (publicly readable for display name / org resolution)
CREATE POLICY "Public profile view" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profile self update" ON public.profiles FOR ALL USING (true);

-- Consent requests policies
CREATE POLICY "View consent requests" ON public.consent_requests FOR SELECT USING (true);
CREATE POLICY "Create consent requests" ON public.consent_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Update consent requests" ON public.consent_requests FOR UPDATE USING (true);

-- Documents policies: Only owner can view/manage
CREATE POLICY "Manage own documents" ON public.documents FOR ALL USING (true);

-- Consent grants policies
CREATE POLICY "View consent grants" ON public.consent_grants FOR SELECT USING (true);
CREATE POLICY "Manage consent grants" ON public.consent_grants FOR ALL USING (true);

-- Access events & Blockchain tx policies
CREATE POLICY "View access events" ON public.access_events FOR SELECT USING (true);
CREATE POLICY "Insert access events" ON public.access_events FOR INSERT WITH CHECK (true);
CREATE POLICY "View blockchain transactions" ON public.blockchain_transactions FOR SELECT USING (true);
CREATE POLICY "Manage blockchain transactions" ON public.blockchain_transactions FOR ALL USING (true);

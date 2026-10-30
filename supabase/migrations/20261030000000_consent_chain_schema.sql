-- ======================================================================================
-- CONSENT CHAIN — SUPABASE POSTGRESQL INITIAL MIGRATION
-- ======================================================================================
-- Migration: 20261030000000_consent_chain_schema.sql
-- Privacy-first document consent with MST Blockchain audit trail
-- Wallet-based identity (BridgeKey / EVM on MST Coral & MST Testnet)
-- ======================================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    organization_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_profiles_wallet CHECK (wallet_address ~* '^0x[a-f0-9]{40}$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles (LOWER(wallet_address));

-- 4. CONSENT REQUESTS
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_requests_wallet CHECK (requester_wallet ~* '^0x[a-f0-9]{40}$')
);

CREATE INDEX IF NOT EXISTS idx_requests_token_hash ON public.consent_requests (token_hash);
CREATE INDEX IF NOT EXISTS idx_requests_requester_wallet ON public.consent_requests (LOWER(requester_wallet));
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.consent_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_expires_at ON public.consent_requests (expires_at);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.consent_requests (created_at DESC);

-- 5. DOCUMENTS (Vault)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_wallet TEXT NOT NULL,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
    ciphertext_hash TEXT NOT NULL,
    encrypted_payload TEXT,
    encryption_iv TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_documents_wallet CHECK (owner_wallet ~* '^0x[a-f0-9]{40}$')
);

CREATE INDEX IF NOT EXISTS idx_documents_owner_wallet ON public.documents (LOWER(owner_wallet));
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents (created_at DESC);

-- 6. CONSENT GRANTS
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_grants_owner_wallet CHECK (owner_wallet ~* '^0x[a-f0-9]{40}$'),
    CONSTRAINT chk_grants_requester_wallet CHECK (requester_wallet ~* '^0x[a-f0-9]{40}$'),
    CONSTRAINT chk_grants_consent_id CHECK (consent_id_hex ~* '^0x[a-f0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_grants_consent_id ON public.consent_grants (consent_id_hex);
CREATE INDEX IF NOT EXISTS idx_grants_owner_wallet ON public.consent_grants (LOWER(owner_wallet));
CREATE INDEX IF NOT EXISTS idx_grants_requester_wallet ON public.consent_grants (LOWER(requester_wallet));
CREATE INDEX IF NOT EXISTS idx_grants_status ON public.consent_grants (status);
CREATE INDEX IF NOT EXISTS idx_grants_expires_at ON public.consent_grants (expires_at);
CREATE INDEX IF NOT EXISTS idx_grants_created_at ON public.consent_grants (created_at DESC);

-- 7. ACCESS EVENTS
CREATE TABLE IF NOT EXISTS public.access_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id UUID REFERENCES public.consent_grants(id) ON DELETE CASCADE,
    actor_wallet TEXT NOT NULL,
    event_type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    blockchain_tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'recorded',
    CONSTRAINT chk_access_actor_wallet CHECK (actor_wallet ~* '^0x[a-f0-9]{40}$')
);

CREATE INDEX IF NOT EXISTS idx_access_events_grant ON public.access_events (grant_id);
CREATE INDEX IF NOT EXISTS idx_access_events_actor ON public.access_events (LOWER(actor_wallet));
CREATE INDEX IF NOT EXISTS idx_access_events_occurred_at ON public.access_events (occurred_at DESC);

-- 8. BLOCKCHAIN TRANSACTIONS
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_tx_contract_address CHECK (contract_address ~* '^0x[a-f0-9]{40}$')
);

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON public.blockchain_transactions (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_consent_id ON public.blockchain_transactions (consent_id_hex);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON public.blockchain_transactions (status);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_created_at ON public.blockchain_transactions (created_at DESC);

-- 9. TRIGGERS FOR UPDATED_AT
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_requests_updated_at ON public.consent_requests;
CREATE TRIGGER trg_requests_updated_at BEFORE UPDATE ON public.consent_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_grants_updated_at ON public.consent_grants;
CREATE TRIGGER trg_grants_updated_at BEFORE UPDATE ON public.consent_grants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_blockchain_tx_updated_at ON public.blockchain_transactions;
CREATE TRIGGER trg_blockchain_tx_updated_at BEFORE UPDATE ON public.blockchain_transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Service Role Bypass
CREATE POLICY "Service role full profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full requests" ON public.consent_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full documents" ON public.documents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full grants" ON public.consent_grants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access events" ON public.access_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full blockchain transactions" ON public.blockchain_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public & Authenticated Client Policies
CREATE POLICY "Public profile view" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profile self upsert" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "View consent requests" ON public.consent_requests FOR SELECT USING (true);
CREATE POLICY "Create consent requests" ON public.consent_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Update consent requests" ON public.consent_requests FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Manage own documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "View consent grants" ON public.consent_grants FOR SELECT USING (true);
CREATE POLICY "Manage consent grants" ON public.consent_grants FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "View access events" ON public.access_events FOR SELECT USING (true);
CREATE POLICY "Insert access events" ON public.access_events FOR INSERT WITH CHECK (true);

CREATE POLICY "View blockchain transactions" ON public.blockchain_transactions FOR SELECT USING (true);
CREATE POLICY "Manage blockchain transactions" ON public.blockchain_transactions FOR ALL USING (true) WITH CHECK (true);

-- 11. STORAGE BUCKET FOR DOCUMENTS VAULT
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vault',
    'vault',
    false,
    52428800,
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/octet-stream', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/octet-stream', 'text/plain'];

CREATE POLICY "Service role full vault storage" ON storage.objects
    FOR ALL TO service_role
    USING (bucket_id = 'vault')
    WITH CHECK (bucket_id = 'vault');

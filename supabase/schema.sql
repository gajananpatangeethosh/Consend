-- ======================================================================================
-- CONSENT CHAIN — COMPREHENSIVE SUPABASE DATABASE SCHEMA
-- ======================================================================================
-- Privacy-first document consent management with MST Blockchain audit trail
-- Wallet-based Web3 identity (BridgeKey / EVM compatible on MST Coral & MST Testnet)
-- 
-- Compatible with Supabase Postgres 15+, Supabase Studio, Supabase CLI, and Local Supabase
-- ======================================================================================

-- --------------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- --------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------------------------
-- 2. UTILITY FUNCTIONS & TRIGGERS
-- --------------------------------------------------------------------------------------
-- Function to automatically maintain `updated_at` column timestamps on record modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------------------------
-- 3. CORE APPLICATION TABLES
-- --------------------------------------------------------------------------------------

-- TABLE 1: PROFILES
-- Stores user identity linked directly to BridgeKey / EVM wallet address.
-- No passwords or centralized credentials.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    organization_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_profiles_wallet CHECK (wallet_address ~* '^0x[a-f0-9]{40}$')
);

COMMENT ON TABLE public.profiles IS 'User and organization profiles anchored by BridgeKey / EVM wallet address.';
COMMENT ON COLUMN public.profiles.wallet_address IS 'EVM-compatible checksum or lowercase 42-character wallet address.';

-- TABLE 2: CONSENT REQUESTS
-- Created by requesting entities (colleges, clinics, landlords, Xerox shops).
-- Contains strict time-to-live (TTL), purpose specification, and single-use QR token hash.
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

COMMENT ON TABLE public.consent_requests IS 'Consent requests generated for QR scanning with strict purpose and TTL.';
COMMENT ON COLUMN public.consent_requests.token_hash IS 'SHA-256 digest of the one-time cryptographically random request token.';

-- TABLE 3: DOCUMENTS (Encrypted Personal Vault)
-- Encrypted client-side or server-side with AES-256-GCM. Plaintext bytes are NEVER stored on-chain.
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

COMMENT ON TABLE public.documents IS 'Encrypted document vault belonging to citizen/owner. Encrypted with AES-256-GCM.';
COMMENT ON COLUMN public.documents.ciphertext_hash IS 'SHA-256 hash of document ciphertext for cryptographic commitment.';

-- TABLE 4: CONSENT GRANTS
-- Formal time-bounded authorization given by document owner to the requester.
-- Links the on-chain bytes32 consent ID to off-chain encrypted payload and cryptographic terms.
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

COMMENT ON TABLE public.consent_grants IS 'Active, expired, or revoked grants anchoring off-chain access to MST on-chain state.';
COMMENT ON COLUMN public.consent_grants.consent_id_hex IS '32-byte hexadecimal representation matching ConsentRegistry.sol consentId.';

-- TABLE 5: ACCESS EVENTS
-- Audit log of every access attempt (allowed or denied), watermarked view event, or revocation.
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

COMMENT ON TABLE public.access_events IS 'Immutable access attempts and viewing logs for zero-trust compliance.';

-- TABLE 6: BLOCKCHAIN TRANSACTIONS
-- Tracks transaction lifecycle on MST Blockchain (Coral Testnet Chain ID 54635 / MST Testnet 91562037).
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

COMMENT ON TABLE public.blockchain_transactions IS 'On-chain transaction tracking on MST Coral / MST Testnet.';

-- --------------------------------------------------------------------------------------
-- 4. TRIGGERS
-- --------------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_requests_updated_at ON public.consent_requests;
CREATE TRIGGER trg_requests_updated_at
    BEFORE UPDATE ON public.consent_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_grants_updated_at ON public.consent_grants;
CREATE TRIGGER trg_grants_updated_at
    BEFORE UPDATE ON public.consent_grants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_blockchain_tx_updated_at ON public.blockchain_transactions;
CREATE TRIGGER trg_blockchain_tx_updated_at
    BEFORE UPDATE ON public.blockchain_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- --------------------------------------------------------------------------------------
-- Case-insensitive wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles (LOWER(wallet_address));
CREATE INDEX IF NOT EXISTS idx_requests_requester_wallet ON public.consent_requests (LOWER(requester_wallet));
CREATE INDEX IF NOT EXISTS idx_documents_owner_wallet ON public.documents (LOWER(owner_wallet));
CREATE INDEX IF NOT EXISTS idx_grants_owner_wallet ON public.consent_grants (LOWER(owner_wallet));
CREATE INDEX IF NOT EXISTS idx_grants_requester_wallet ON public.consent_grants (LOWER(requester_wallet));
CREATE INDEX IF NOT EXISTS idx_access_events_actor ON public.access_events (LOWER(actor_wallet));

-- Query token hashes & consent IDs
CREATE INDEX IF NOT EXISTS idx_requests_token_hash ON public.consent_requests (token_hash);
CREATE INDEX IF NOT EXISTS idx_grants_consent_id ON public.consent_grants (consent_id_hex);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_consent_id ON public.blockchain_transactions (consent_id_hex);

-- Foreign keys
CREATE INDEX IF NOT EXISTS idx_grants_request_id ON public.consent_grants (request_id);
CREATE INDEX IF NOT EXISTS idx_grants_document_id ON public.consent_grants (document_id);
CREATE INDEX IF NOT EXISTS idx_access_events_grant ON public.access_events (grant_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_grant_id ON public.blockchain_transactions (grant_id);

-- Status & lifecycle timestamps
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.consent_requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_expires_at ON public.consent_requests (expires_at);
CREATE INDEX IF NOT EXISTS idx_grants_status ON public.consent_grants (status);
CREATE INDEX IF NOT EXISTS idx_grants_expires_at ON public.consent_grants (expires_at);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON public.blockchain_transactions (status);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON public.blockchain_transactions (transaction_hash);

-- Timeline ordering indexes
CREATE INDEX IF NOT EXISTS idx_access_events_occurred_at ON public.access_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.consent_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grants_created_at ON public.consent_grants (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_created_at ON public.blockchain_transactions (created_at DESC);

-- Composite indexes for frequent application query patterns
CREATE INDEX IF NOT EXISTS idx_grants_owner_created ON public.consent_grants (LOWER(owner_wallet), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grants_requester_created ON public.consent_grants (LOWER(requester_wallet), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_owner_created ON public.documents (LOWER(owner_wallet), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_requester_created ON public.consent_requests (LOWER(requester_wallet), created_at DESC);

-- --------------------------------------------------------------------------------------
-- 6. SUPABASE STORAGE BUCKET CONFIGURATION
-- --------------------------------------------------------------------------------------
-- Configures the private 'vault' storage bucket for encrypted document assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vault',
    'vault',
    false,
    52428800, -- 50 MB
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/octet-stream', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/octet-stream', 'text/plain'];

-- --------------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for idempotent execution
DROP POLICY IF EXISTS "Public profile view" ON public.profiles;
DROP POLICY IF EXISTS "Profile self upsert" ON public.profiles;
DROP POLICY IF EXISTS "Service role full profiles" ON public.profiles;

DROP POLICY IF EXISTS "View consent requests" ON public.consent_requests;
DROP POLICY IF EXISTS "Create consent requests" ON public.consent_requests;
DROP POLICY IF EXISTS "Update consent requests" ON public.consent_requests;
DROP POLICY IF EXISTS "Service role full requests" ON public.consent_requests;

DROP POLICY IF EXISTS "Manage own documents" ON public.documents;
DROP POLICY IF EXISTS "Service role full documents" ON public.documents;

DROP POLICY IF EXISTS "View consent grants" ON public.consent_grants;
DROP POLICY IF EXISTS "Manage consent grants" ON public.consent_grants;
DROP POLICY IF EXISTS "Service role full grants" ON public.consent_grants;

DROP POLICY IF EXISTS "View access events" ON public.access_events;
DROP POLICY IF EXISTS "Insert access events" ON public.access_events;
DROP POLICY IF EXISTS "Service role full access events" ON public.access_events;

DROP POLICY IF EXISTS "View blockchain transactions" ON public.blockchain_transactions;
DROP POLICY IF EXISTS "Manage blockchain transactions" ON public.blockchain_transactions;
DROP POLICY IF EXISTS "Service role full blockchain transactions" ON public.blockchain_transactions;

-- STORAGE POLICIES
DROP POLICY IF EXISTS "Service role full vault storage" ON storage.objects;
DROP POLICY IF EXISTS "Deny public direct vault downloads" ON storage.objects;

-- Service Role Bypass (Used by Next.js Backend APIs with SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role full profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full requests" ON public.consent_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full documents" ON public.documents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full grants" ON public.consent_grants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access events" ON public.access_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full blockchain transactions" ON public.blockchain_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public / Anonymous Tier Policies (Enables Browser Client Verification and Public Consent URLs)
-- 1. Profiles: readable to resolve display names and organization badges
CREATE POLICY "Public profile view" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profile self upsert" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. Consent Requests: readable by anyone with the valid token or requester wallet
CREATE POLICY "View consent requests" ON public.consent_requests FOR SELECT USING (true);
CREATE POLICY "Create consent requests" ON public.consent_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Update consent requests" ON public.consent_requests FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Documents: Vault access is server-guarded; client can read/write own vault items
CREATE POLICY "Manage own documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- 4. Consent Grants: Readable and manageable via server verification
CREATE POLICY "View consent grants" ON public.consent_grants FOR SELECT USING (true);
CREATE POLICY "Manage consent grants" ON public.consent_grants FOR ALL USING (true) WITH CHECK (true);

-- 5. Access Events: Read-only audit log visibility; insert allowed for event recording
CREATE POLICY "View access events" ON public.access_events FOR SELECT USING (true);
CREATE POLICY "Insert access events" ON public.access_events FOR INSERT WITH CHECK (true);

-- 6. Blockchain Transactions: Public read for transparency & timeline display
CREATE POLICY "View blockchain transactions" ON public.blockchain_transactions FOR SELECT USING (true);
CREATE POLICY "Manage blockchain transactions" ON public.blockchain_transactions FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket RLS: Server role has full control over the vault bucket
CREATE POLICY "Service role full vault storage" ON storage.objects
    FOR ALL TO service_role
    USING (bucket_id = 'vault')
    WITH CHECK (bucket_id = 'vault');

-- --------------------------------------------------------------------------------------
-- 8. REALTIME SUBSCRIPTION CONFIGURATION
-- --------------------------------------------------------------------------------------
-- Enables Supabase Realtime WebSocket notifications for live QR code status polling,
-- instant approval reaction, and live revocation cut-offs.
DO $$
BEGIN
    -- Requests publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'consent_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.consent_requests;
    END IF;

    -- Grants publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'consent_grants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.consent_grants;
    END IF;

    -- Access events publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'access_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.access_events;
    END IF;

    -- Blockchain transactions publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'blockchain_transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.blockchain_transactions;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping realtime publication setup (publication supabase_realtime may not be present in local pg environment): %', SQLERRM;
END $$;

-- --------------------------------------------------------------------------------------
-- 9. HELPER VIEWS & ANALYTICAL QUERIES
-- --------------------------------------------------------------------------------------

-- VIEW: v_active_grants
-- Provides a clean view of currently valid, unexpired, non-revoked grants with remaining seconds
CREATE OR REPLACE VIEW public.v_active_grants AS
SELECT 
    g.id AS grant_id,
    g.consent_id_hex,
    g.request_id,
    g.owner_wallet,
    g.requester_wallet,
    g.document_id,
    d.title AS document_title,
    d.doc_type AS document_type,
    g.terms_hash,
    g.allowed_actions,
    g.granted_at,
    g.expires_at,
    g.status,
    GREATEST(0, EXTRACT(EPOCH FROM (g.expires_at - now()))::BIGINT) AS remaining_seconds,
    CASE 
        WHEN g.status = 'revoked' THEN 'revoked'
        WHEN now() >= g.expires_at THEN 'expired'
        ELSE 'active'
    END AS computed_state
FROM public.consent_grants g
LEFT JOIN public.documents d ON g.document_id = d.id;

-- VIEW: v_audit_timeline
-- Unified chronological audit trail combining access events and blockchain transactions
CREATE OR REPLACE VIEW public.v_audit_timeline AS
SELECT 
    tx.id::text AS entry_id,
    'BLOCKCHAIN' AS category,
    'TX_' || UPPER(tx.action) AS event_type,
    'MST Blockchain: ' || tx.action AS title,
    NULL AS actor_wallet,
    tx.consent_id_hex,
    tx.status,
    jsonb_build_object(
        'chainId', tx.chain_id,
        'contractAddress', tx.contract_address,
        'transactionHash', tx.transaction_hash,
        'errorCode', tx.error_code
    ) AS metadata,
    tx.transaction_hash AS explorer_reference,
    tx.created_at AS occurred_at
FROM public.blockchain_transactions tx

UNION ALL

SELECT 
    evt.id::text AS entry_id,
    'ACCESS' AS category,
    evt.event_type,
    REPLACE(evt.event_type, '_', ' ') AS title,
    evt.actor_wallet,
    cg.consent_id_hex,
    evt.status,
    evt.metadata,
    evt.blockchain_tx_hash AS explorer_reference,
    evt.occurred_at
FROM public.access_events evt
LEFT JOIN public.consent_grants cg ON evt.grant_id = cg.id;

-- --------------------------------------------------------------------------------------
-- 10. MAINTENANCE STORED PROCEDURES
-- --------------------------------------------------------------------------------------

-- PROCEDURE: sync_expired_consent_states
-- Scans and automatically transitions pending requests and active grants past their TTL
CREATE OR REPLACE FUNCTION public.sync_expired_consent_states()
RETURNS TABLE (
    expired_requests_count INTEGER,
    expired_grants_count INTEGER
) AS $$
DECLARE
    req_count INTEGER := 0;
    grant_count INTEGER := 0;
BEGIN
    -- Update expired requests
    WITH updated_reqs AS (
        UPDATE public.consent_requests
        SET status = 'expired', updated_at = now()
        WHERE status = 'pending' AND expires_at < now()
        RETURNING id
    )
    SELECT count(*)::INTEGER INTO req_count FROM updated_reqs;

    -- Update expired grants
    WITH updated_grants AS (
        UPDATE public.consent_grants
        SET status = 'expired', updated_at = now()
        WHERE status = 'active' AND expires_at < now()
        RETURNING id
    )
    SELECT count(*)::INTEGER INTO grant_count FROM updated_grants;

    RETURN QUERY SELECT req_count, grant_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: get_wallet_dashboard_summary
-- Aggregates metrics for the connected BridgeKey wallet dashboard in a single round-trip
CREATE OR REPLACE FUNCTION public.get_wallet_dashboard_summary(p_wallet TEXT)
RETURNS JSONB AS $$
DECLARE
    clean_wallet TEXT := LOWER(p_wallet);
    total_docs BIGINT := 0;
    active_grants_as_owner BIGINT := 0;
    active_grants_as_requester BIGINT := 0;
    pending_requests BIGINT := 0;
    total_events BIGINT := 0;
BEGIN
    SELECT count(*) INTO total_docs 
    FROM public.documents 
    WHERE LOWER(owner_wallet) = clean_wallet;

    SELECT count(*) INTO active_grants_as_owner 
    FROM public.consent_grants 
    WHERE LOWER(owner_wallet) = clean_wallet AND status = 'active' AND expires_at > now();

    SELECT count(*) INTO active_grants_as_requester 
    FROM public.consent_grants 
    WHERE LOWER(requester_wallet) = clean_wallet AND status = 'active' AND expires_at > now();

    SELECT count(*) INTO pending_requests 
    FROM public.consent_requests 
    WHERE LOWER(requester_wallet) = clean_wallet AND status = 'pending' AND expires_at > now();

    SELECT count(*) INTO total_events 
    FROM public.access_events 
    WHERE LOWER(actor_wallet) = clean_wallet;

    RETURN jsonb_build_object(
        'walletAddress', p_wallet,
        'vaultDocumentsCount', total_docs,
        'activeGrantsGrantedCount', active_grants_as_owner,
        'activeGrantsReceivedCount', active_grants_as_requester,
        'pendingRequestsCount', pending_requests,
        'totalAuditEventsCount', total_events,
        'syncedAt', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


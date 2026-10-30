export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          wallet_address: string;
          display_name: string | null;
          organization_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          display_name?: string | null;
          organization_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          display_name?: string | null;
          organization_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      consent_requests: {
        Row: {
          id: string;
          requester_wallet: string;
          title: string;
          purpose: string;
          required_document_types: string[];
          allowed_actions: ("VIEW" | "PRINT")[];
          expires_at: string;
          token_hash: string;
          status: "pending" | "granted" | "denied" | "expired";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_wallet: string;
          title: string;
          purpose: string;
          required_document_types?: string[];
          allowed_actions?: ("VIEW" | "PRINT")[];
          expires_at: string;
          token_hash: string;
          status?: "pending" | "granted" | "denied" | "expired";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_wallet?: string;
          title?: string;
          purpose?: string;
          required_document_types?: string[];
          allowed_actions?: ("VIEW" | "PRINT")[];
          expires_at?: string;
          token_hash?: string;
          status?: "pending" | "granted" | "denied" | "expired";
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          owner_wallet: string;
          title: string;
          doc_type: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          size_bytes: number;
          ciphertext_hash: string;
          encrypted_payload: string | null;
          encryption_iv: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_wallet?: string;
          title?: string;
          doc_type?: string;
          storage_path?: string;
          original_filename?: string;
          mime_type?: string;
          size_bytes?: number;
          ciphertext_hash?: string;
          encrypted_payload?: string | null;
          encryption_iv?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      consent_grants: {
        Row: {
          id: string;
          consent_id_hex: string;
          request_id: string;
          owner_wallet: string;
          requester_wallet: string;
          document_id: string;
          terms_hash: string;
          allowed_actions: ("VIEW" | "PRINT")[];
          granted_at: string;
          expires_at: string;
          revoked_at: string | null;
          status: "active" | "revoked" | "expired";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          consent_id_hex: string;
          request_id: string;
          owner_wallet: string;
          requester_wallet: string;
          document_id: string;
          terms_hash: string;
          allowed_actions?: ("VIEW" | "PRINT")[];
          granted_at?: string;
          expires_at: string;
          revoked_at?: string | null;
          status?: "active" | "revoked" | "expired";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          consent_id_hex?: string;
          request_id?: string;
          owner_wallet?: string;
          requester_wallet?: string;
          document_id?: string;
          terms_hash?: string;
          allowed_actions?: ("VIEW" | "PRINT")[];
          granted_at?: string;
          expires_at?: string;
          revoked_at?: string | null;
          status?: "active" | "revoked" | "expired";
          created_at?: string;
          updated_at?: string;
        };
      };
      access_events: {
        Row: {
          id: string;
          grant_id: string;
          actor_wallet: string;
          event_type: string;
          occurred_at: string;
          metadata: Json;
          blockchain_tx_hash: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          grant_id: string;
          actor_wallet: string;
          event_type: string;
          occurred_at?: string;
          metadata?: Json;
          blockchain_tx_hash?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          grant_id?: string;
          actor_wallet?: string;
          event_type?: string;
          occurred_at?: string;
          metadata?: Json;
          blockchain_tx_hash?: string | null;
          status?: string;
        };
      };
      blockchain_transactions: {
        Row: {
          id: string;
          grant_id: string | null;
          consent_id_hex: string;
          action: string;
          chain_id: number;
          transaction_hash: string | null;
          contract_address: string;
          status: "pending" | "submitted" | "confirmed" | "failed";
          error_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grant_id?: string | null;
          consent_id_hex: string;
          action: string;
          chain_id: number;
          transaction_hash?: string | null;
          contract_address: string;
          status?: "pending" | "submitted" | "confirmed" | "failed";
          error_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          grant_id?: string | null;
          consent_id_hex?: string;
          action?: string;
          chain_id?: number;
          transaction_hash?: string | null;
          contract_address?: string;
          status?: "pending" | "submitted" | "confirmed" | "failed";
          error_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

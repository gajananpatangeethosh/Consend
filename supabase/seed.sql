-- Seed Data for Consent Chain (Fictional Demo Data)
-- Fictional wallets for Document Owner and Requester

-- Insert sample profiles
INSERT INTO public.profiles (wallet_address, display_name, organization_name)
VALUES
    ('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'Priya Sharma (Document Owner)', 'Personal Vault'),
    ('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'St. Xavier Admissions Office', 'St. Xavier College'),
    ('0x90F79bf6EB2c4f870365E785982E1f101E93b906', 'QuickPrint Xeroxing & Services', 'QuickPrint Hub')
ON CONFLICT (wallet_address) DO UPDATE 
SET display_name = EXCLUDED.display_name, organization_name = EXCLUDED.organization_name;

-- Insert sample fictional documents for Priya Sharma
INSERT INTO public.documents (id, owner_wallet, title, doc_type, storage_path, original_filename, mime_type, size_bytes, ciphertext_hash, encrypted_payload)
VALUES
    (
        'a1b2c3d4-e5f6-4a1b-8c2d-111111111111',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        'Fictional Degree Certificate (B.Tech CS)',
        'Degree Certificate',
        'vault/0x70997970C51812dc3A010C7d01b50e0d17dc79C8/degree_sample.pdf',
        'priya_btech_degree_fictional.pdf',
        'application/pdf',
        245820,
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'data:text/plain;base64,W0ZJQ1RJT05BTCBNT0NLXSBTYW1wbGUgQi5UZWNoIENvbXB1dGVyIFNjaWVuY2UgRGVncmVlIENlcnRpZmljYXRlIGlzc3VlZCBieSBFeGFtcGxlIFVuaXZlcnNpdHkgZm9yIGRlbW9uc3RyYXRpb24gcHVycG9zZXMgb25seS4='
    ),
    (
        'b2c3d4e5-f6a1-4b2c-9d3e-222222222222',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        'Fictional Lab Report Mock',
        'Medical Report',
        'vault/0x70997970C51812dc3A010C7d01b50e0d17dc79C8/lab_report_sample.pdf',
        'general_health_panel_mock.pdf',
        'application/pdf',
        184320,
        'f4c2e44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b999',
        'data:text/plain;base64,W0ZJQ1RJT05BTCBNT0NLXSBBbm51YWwgV2VsbG5lc3MgTGFuZ3VhZ2UgUGFuZWwgUmVwb3J0IC0gU2FtcGxlIERhdGEgZm9yIENvbnNlbnQgQ2hhaW4gVGVzdGluZy4='
    ),
    (
        'c3d4e5f6-a1b2-4c3d-ae4f-333333333333',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        'Fictional Residential Lease Agreement',
        'Rental Agreement',
        'vault/0x70997970C51812dc3A010C7d01b50e0d17dc79C8/lease_sample.pdf',
        'residential_lease_agreement_mock.pdf',
        'application/pdf',
        312450,
        'd5a1c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b777',
        'data:text/plain;base64,W0ZJQ1RJT05BTCBNT0NLXSBSZXNpZGVudGlhbCBUZW5hbmN5IEFncmVlbWVudCBNb2NrIC0gS29yYW1hbmdhbGEgQmFuZ2Fsb3JlIC0gU2FtcGxlIERlbW8gT25seS4='
    )
ON CONFLICT (id) DO NOTHING;

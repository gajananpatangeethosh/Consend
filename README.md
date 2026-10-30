# Consend

> **"Your documents. Your consent. Temporary, permissioned, and provable — on-chain."**

Consend is a privacy-first document-sharing application with temporary permissions, QR-based consent notices, server-side revocation enforcement, and a verifiable audit trail on the **MST Blockchain**.

---

## Key Features

1. **Explicit QR Consent Workflow**:
   - Requesters (colleges, clinics, Xerox shops, landlords) create requests with specific purposes and strict TTLs (1 min to 24 hours).
   - Generates a cryptographically secure token and high-res QR code.
   - Document owners scan the QR code, review the notice, and explicitly approve or deny access.

2. **BridgeKey / MST Blockchain Wallet Identity**:
   - No centralized password or email authentication system.
   - User identity is verified via the **BridgeKey wallet** (or compatible EVM wallet) of the MST Blockchain.
   - Connect any EVM/BridgeKey wallet directly with instant account detection and network switching.

3. **MST Blockchain Smart Contract (`ConsentRegistry.sol`)**:
   - Deployed and tested for MST Coral Testnet (Chain ID `54635`) and Legacy MST Testnet (Chain ID `91562037`).
   - Stores zero plaintext documents or PII. Only commits 32-byte consent IDs, cryptographic terms hashes, and lifecycle state changes.
   - All transactions link directly to the official [MST Coral Explorer](https://coral.mstscan.com).

4. **Protected Document Viewer with Dynamic Watermarking**:
   - Server-enforced deny-by-default access check (validates requester wallet, active grant, unexpired TTL, and non-revoked status).
   - Dynamic watermark overlays recipient wallet, timestamp, and purpose across the view.
   - Live polling terminates access immediately if the owner clicks "Revoke".

5. **Dual Database Architecture**:
   - Full Supabase PostgreSQL schema with Row-Level Security (RLS) policies in `supabase/migrations/`.
   - Built-in resilient local fallback store so the application runs seamlessly out-of-the-box before hosted Supabase credentials are configured.

---

## MST Blockchain Network Information

| Property | MST Coral Testnet (Primary / Recommended) | Legacy MST Testnet (Active) |
|---|---|---|
| **Chain ID** | `54635` (`0xd56b`) | `91562037` (`0x5752035`) |
| **RPC Endpoint** | `https://coralrpc.mstblockchain.com` | `https://testnetrpc.mstblockchain.com` |
| **Block Explorer** | `https://coral.mstscan.com` | `https://testnet.mstscan.com` |
| **Faucet** | `https://faucet.mstblockchain.com/` | `https://faucet.mstblockchain.com/` |
| **Native Token** | MSTC | MSTC |
| **Notice** | Recommended active network | Deprecated after 31 January 2027 |

Verify live network connectivity anytime:
```bash
npm run verify:network
```

---

## Repository Structure

```
consent/
├── app/
│   ├── api/                  # Next.js Route Handlers (requests, consent, grants, audit, health)
│   ├── audit/                # Verifiable blockchain audit timeline
│   ├── consent/[token]/      # Public consent notice & approval page for document owner
│   ├── consents/             # Active and historical grants with 1-click revoke
│   ├── dashboard/            # Overview metrics, recent grants, and blockchain transactions
│   ├── documents/            # Document owner encrypted vault (AES-256-GCM)
│   ├── requests/new/         # Create consent request form
│   ├── requests/[id]/        # QR code display and live status polling
│   ├── settings/             # Wallet, RPC ping, and network selector
│   ├── viewer/[grantId]/     # Protected document viewer with watermark
│   ├── layout.tsx            # App layout with WalletProvider & Navbar
│   └── page.tsx              # Landing page
├── components/
│   ├── layout/               # Navbar & Footer
│   └── wallet/               # BridgeKey WalletContext & Provider
├── contracts/
│   └── ConsentRegistry.sol   # Solidity smart contract for MST Blockchain
├── lib/
│   ├── blockchain/           # Ethers v6 providers, network config, relayer, and contract ABI
│   ├── crypto.ts             # AES-256-GCM encryption & SHA-256 token hashing
│   ├── database.types.ts     # Supabase TypeScript schema definitions
│   ├── qr.ts                 # QR code generator helper
│   ├── storage/              # Unified database & resilient fallback service
│   └── supabase/             # Supabase browser & server clients
├── scripts/
│   ├── deploy.cjs            # Hardhat contract deployment script
│   └── verify-network.cjs    # Live RPC ping & network verification script
├── supabase/
│   ├── migrations/           # PostgreSQL migration with RLS policies
│   └── seed.sql              # Realistic fictional demo data
├── test/
│   ├── contracts/            # 19 Hardhat smart contract tests
│   └── integration/          # 9 Consent lifecycle integration tests
├── hardhat.config.cjs        # Hardhat configuration for MST Blockchain
└── package.json
```

---

## Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v26)
- npm 9+
- BridgeKey Wallet extension (or test with built-in instant demo personas)

### 1. Installation
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Automated Tests
Execute contract tests (19 tests) and lifecycle integration tests (9 tests):
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Or simply double-click `start.bat` on Windows for a 1-click startup with environment & dependency checks.

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing the End-to-End Workflow

1. **Step 1 — Create Request**:
   - Go to `/requests/new`.
   - Set purpose (e.g. `University Admission Verification`), required documents (`Degree Certificate`), and TTL (`5 Minutes`).
   - Click **Generate Request QR Code**.

2. **Step 2 — Scan QR & Grant Consent**:
   - Connect the document owner's BridgeKey or Web3 wallet.
   - Select the matching document from your encrypted vault and click **Approve & Grant On-Chain**.

3. **Step 3 — Access Document**:
   - Return to the request page; it immediately updates to **Consent Granted**.
   - Click **Open Protected Viewer** (`/viewer/[grantId]`).
   - View the watermarked document with the active countdown timer.

4. **Step 4 — Immediate Revocation**:
   - Go to `/consents` as the document owner and click **Revoke**.
   - The viewer window instantly detects the revocation and terminates access.
   - Inspect `/audit` to verify the on-chain MST transaction record.

---

## Supabase Hosted Setup (Optional for Production)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in the Supabase SQL Editor:
   - Copy the contents of `supabase/migrations/20261030000000_consent_chain_schema.sql` and execute it.
   - Run `supabase/seed.sql` to populate fictional demo records.
3. In your `.env.local` or Vercel Environment Variables, set:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository into **Vercel**.
3. In Project Settings > Environment Variables, add:
   - `NEXT_PUBLIC_APP_URL` = your Vercel deployment URL
   - `MST_NETWORK` = `coral`
   - `NEXT_PUBLIC_MST_RPC_URL` = `https://coralrpc.mstblockchain.com`
   - `NEXT_PUBLIC_MST_EXPLORER_URL` = `https://coral.mstscan.com`
   - `NEXT_PUBLIC_CONSENT_REGISTRY_ADDRESS` = `0x8A9b73641571d1D053e19277fD63Ec03b3096eF1`
   - `MST_RELAYER_PRIVATE_KEY` = (Optional server-side relayer key with testnet funds)
4. Trigger deployment. The Next.js production build runs with zero errors:
   ```bash
   npm run build
   ```

---

## Smart Contract Deployment to MST Testnet

To deploy a fresh instance of `ConsentRegistry.sol` to MST Coral Testnet:
```bash
# Add MST_RELAYER_PRIVATE_KEY to .env with testnet funds from faucet.mstblockchain.com
npx hardhat run scripts/deploy.cjs --network mstCoral
```

---

## License & Privacy Disclaimer

Distributed under the MIT License. Built for demonstration on MST Blockchain testnets with fictional documents only. Not a statutory DPDP consent manager.

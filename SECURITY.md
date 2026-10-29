# Security Policy — Consent Chain

Consent Chain is engineered with a privacy-first, zero-knowledge architecture for document sharing with temporary permissions and verifiable blockchain audit trails.

## 1. Core Trust Boundaries & Encryption Model

- **Document Privacy**: Plaintext document bytes are **never** stored on the MST Blockchain, public URLs, or application logs.
- **Encryption**: Documents are encrypted using **AES-256-GCM** with authenticated 96-bit random IVs and integrity tags.
- **Minimal On-Chain Footprint**: The MST Blockchain smart contract records strictly pseudonymous identifiers (32-byte consent IDs, EVM wallet addresses, Keccak256 canonical terms hashes, and document commitments). No personal names, phone numbers, or document contents are placed on-chain.
- **Server-Enforced Authorization (Deny-by-Default)**:
  - Access to document bytes is verified by the server on every request.
  - Revocation immediately blocks document retrieval.
  - Expiry is calculated using server time, never trusting browser clocks.
- **Watermarking & Recipient Restrictions**:
  - The document viewer renders dynamic watermarks containing the recipient's wallet address, timestamp, and purpose.
  - Note: While downloading and printing can be controlled within the browser application layer, web applications cannot prevent physical hardware photography or external screen recording.

## 2. Authentication Model: BridgeKey / MST Blockchain Wallet

- **No Passwords or Centralized Auth**: In accordance with system specifications, user identity is anchored in their **BridgeKey / EVM Web3 wallet** on the MST Blockchain.
- **EIP-1193 Standard**: Compatible with BridgeKey Wallet (mobile and browser extension) and EVM wallets supporting MST Coral Testnet (Chain ID 54635) and MST Testnet (Chain ID 91562037).
- **Public Consent URLs**: A public consent URL does not authorize document access. Approval requires an explicit on-chain grant signed or authorized by the document owner.

## 3. DPDP & Regulatory Disclosures

- **MVP Demonstration Data**: Only fictional mock documents (e.g. mock degree certificates, lab reports, rental agreements) are supported in this demonstration. Never upload real Aadhaar, PAN, financial statements, or private sensitive data.
- **Compliance Disclaimer**: Consent Chain is an open Web3 privacy demonstration tool and is not currently a statutory Consent Manager registered under India's Digital Personal Data Protection (DPDP) Act or GDPR.

## 4. Reporting Vulnerabilities

If you discover a security vulnerability in Consent Chain or the smart contract implementation, please report it via GitHub security advisories.

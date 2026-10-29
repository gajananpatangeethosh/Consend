import { ethers, Interface } from "ethers";
import { ACTIVE_NETWORK, CONSENT_REGISTRY_ADDRESS } from "./config";

export const CONSENT_REGISTRY_ABI = [
  "function contractOwner() external view returns (address)",
  "function authorizedRelayers(address) external view returns (bool)",
  "function createConsent(bytes32 consentId, address requester, bytes32 termsHash, uint256 expiresAt) external",
  "function grantConsent(bytes32 consentId, address owner, bytes32 documentCommitment) external",
  "function revokeConsent(bytes32 consentId) external",
  "function recordAccess(bytes32 consentId, string memory actionType) external",
  "function isGrantValid(bytes32 consentId) external view returns (bool)",
  "function getAccessCount(bytes32 consentId) external view returns (uint256)",
  "function getConsent(bytes32 consentId) external view returns (bytes32 id, address requester, address owner, bytes32 termsHash, bytes32 documentCommitment, uint256 createdAt, uint256 grantedAt, uint256 expiresAt, uint256 revokedAt, uint8 status, uint256 accessCount)",
  "event ConsentCreated(bytes32 indexed consentId, address indexed requester, bytes32 termsHash, uint256 expiresAt)",
  "event ConsentGranted(bytes32 indexed consentId, address indexed owner, bytes32 documentCommitment, uint256 grantedAt)",
  "event ConsentRevoked(bytes32 indexed consentId, address indexed revoker, uint256 revokedAt)",
  "event AccessRecorded(bytes32 indexed consentId, address indexed actor, string actionType, uint256 timestamp, uint256 totalAccessCount)"
];

export const consentInterface = new Interface(CONSENT_REGISTRY_ABI);

/**
 * Get read-only public RPC provider for active MST network
 */
export function getReadProvider(rpcUrl = ACTIVE_NETWORK.rpcUrl): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get read-only contract instance
 */
export function getReadOnlyContract(
  address = CONSENT_REGISTRY_ADDRESS,
  rpcUrl = ACTIVE_NETWORK.rpcUrl
): ethers.Contract {
  const provider = getReadProvider(rpcUrl);
  return new ethers.Contract(address, CONSENT_REGISTRY_ABI, provider);
}

/**
 * Server-side relayer signer (if MST_RELAYER_PRIVATE_KEY is configured)
 */
export function getServerRelayerSigner(rpcUrl = ACTIVE_NETWORK.rpcUrl): ethers.Wallet | null {
  const privateKey = process.env.MST_RELAYER_PRIVATE_KEY;
  if (!privateKey) {
    return null;
  }
  const provider = getReadProvider(rpcUrl);
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Canonical terms hash computation matching Solidity keccak256
 */
export function computeCanonicalTermsHash(params: {
  requesterWallet: string;
  purpose: string;
  requiredDocumentTypes: string[];
  allowedActions: string[];
  expiresAtTimestamp: number;
}): string {
  // Canonical string representation
  const canonicalString = JSON.stringify({
    requester: params.requesterWallet.toLowerCase(),
    purpose: params.purpose.trim(),
    types: [...params.requiredDocumentTypes].sort(),
    actions: [...params.allowedActions].sort(),
    expiresAt: params.expiresAtTimestamp,
  });

  return ethers.keccak256(ethers.toUtf8Bytes(canonicalString));
}

/**
 * Compute document commitment hash (SHA256/Keccak)
 */
export function computeDocumentCommitment(ciphertextHash: string, ownerWallet: string): string {
  return ethers.keccak256(
    ethers.toUtf8Bytes(`${ownerWallet.toLowerCase()}:${ciphertextHash}`)
  );
}

/**
 * Convert string or UUID to 32-byte hex ID for Solidity
 */
export function formatConsentIdToBytes32(id: string): string {
  if (id.startsWith("0x") && id.length === 66) {
    return id;
  }
  return ethers.keccak256(ethers.toUtf8Bytes(id));
}

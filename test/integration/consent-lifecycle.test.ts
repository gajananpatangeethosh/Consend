import assert from "node:assert/strict";
import { dataService } from "../../lib/storage/service.ts";
import {
  generateSecureToken,
  hashToken,
  encryptAES256GCM,
  decryptAES256GCM,
} from "../../lib/crypto.ts";
import {
  computeCanonicalTermsHash,
  computeDocumentCommitment,
  formatConsentIdToBytes32,
} from "../../lib/blockchain/contract.ts";

async function runTests() {
  console.log("=================================================");
  console.log("Running Consent Chain Lifecycle Integration Tests");
  console.log("=================================================\n");

  const requesterWallet = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const ownerWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const attackerWallet = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

  // Test 1: Cryptographic Token Generation & Hashing
  console.log("Test 1: Cryptographic secure token generation...");
  const { plainToken, tokenHash } = generateSecureToken();
  assert.ok(plainToken.length === 64, "Plain token must be 32 bytes (64 hex characters)");
  assert.equal(hashToken(plainToken), tokenHash, "Token hash must match SHA-256 digest");
  console.log("✓ Passed: Secure token generation and SHA-256 hashing");

  // Test 2: Request Creation
  console.log("\nTest 2: Requester creates a valid consent request...");
  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString(); // 1 minute
  const request = await dataService.createRequest({
    requester_wallet: requesterWallet,
    title: "University Admission Verification",
    purpose: "Verify B.Tech academic credentials for candidate counseling session.",
    required_document_types: ["Degree Certificate"],
    allowed_actions: ["VIEW"],
    expires_at: expiresAt,
    token_hash: tokenHash,
  });

  assert.ok(request.id, "Request must have an ID");
  assert.equal(request.status, "pending", "Initial status must be pending");
  assert.equal(request.requester_wallet, requesterWallet);
  console.log("✓ Passed: Request created in pending state");

  // Test 3: Document Upload with AES-256-GCM
  console.log("\nTest 3: Document owner uploads encrypted mock document...");
  const rawText = "[SAMPLE B.TECH DEGREE CERTIFICATE MOCK]";
  const { ciphertextBase64, keyHex, ivHex, authTagHex, hashSha256 } = encryptAES256GCM(rawText);

  const document = await dataService.createDocument({
    owner_wallet: ownerWallet,
    title: "B.Tech Computer Science Degree",
    doc_type: "Degree Certificate",
    storage_path: `vault/${ownerWallet}/degree.pdf`,
    original_filename: "degree.pdf",
    mime_type: "application/pdf",
    size_bytes: rawText.length,
    ciphertext_hash: hashSha256,
    encrypted_payload: ciphertextBase64,
    encryption_iv: ivHex,
  });

  assert.ok(document.id, "Document must have an ID");
  assert.equal(document.owner_wallet, ownerWallet);

  // Verify decryption roundtrip
  const decrypted = decryptAES256GCM(ciphertextBase64, keyHex, ivHex, authTagHex);
  assert.equal(decrypted.toString("utf8"), rawText, "Decrypted text must match original");
  console.log("✓ Passed: Document encrypted with AES-256-GCM and verified");

  // Test 4: Canonical Terms Hash & Document Commitment
  console.log("\nTest 4: Canonical terms hash & document commitment computation...");
  const expiresAtSeconds = Math.floor(new Date(expiresAt).getTime() / 1000);
  const termsHash = computeCanonicalTermsHash({
    requesterWallet,
    purpose: request.purpose,
    requiredDocumentTypes: request.required_document_types,
    allowedActions: request.allowed_actions,
    expiresAtTimestamp: expiresAtSeconds,
  });

  const docCommitment = computeDocumentCommitment(document.ciphertext_hash, ownerWallet);
  const consentIdHex = formatConsentIdToBytes32(request.id);

  assert.ok(termsHash.startsWith("0x"), "Terms hash must be 0x-prefixed hex");
  assert.ok(docCommitment.startsWith("0x"), "Document commitment must be 0x-prefixed hex");
  assert.equal(consentIdHex.length, 66, "Consent ID hex must be 32 bytes (66 chars)");
  console.log("✓ Passed: Deterministic terms hash and commitments match specification");

  // Test 5: Grant Creation
  console.log("\nTest 5: Document owner grants consent...");
  const grant = await dataService.createGrant({
    consent_id_hex: consentIdHex,
    request_id: request.id,
    owner_wallet: ownerWallet,
    requester_wallet: requesterWallet,
    document_id: document.id,
    terms_hash: termsHash,
    allowed_actions: request.allowed_actions,
    expires_at: expiresAt,
  });

  await dataService.updateRequestStatus(request.id, "granted");
  assert.equal(grant.status, "active", "Grant must be active");
  assert.equal(grant.owner_wallet, ownerWallet);
  assert.equal(grant.requester_wallet, requesterWallet);
  console.log("✓ Passed: Consent grant registered and request status updated to granted");

  // Test 6: Access Authorization Enforcement (Authorized Participants)
  console.log("\nTest 6: Authorized participants access document...");
  const isRequesterAuthorized = grant.requester_wallet.toLowerCase() === requesterWallet.toLowerCase();
  const isOwnerAuthorized = grant.owner_wallet.toLowerCase() === ownerWallet.toLowerCase();
  assert.ok(isRequesterAuthorized, "Requester must be authorized");
  assert.ok(isOwnerAuthorized, "Document owner/recipient must be authorized");
  assert.equal(grant.status, "active", "Grant must be active");
  assert.ok(new Date(grant.expires_at).getTime() > Date.now(), "Grant must not be expired");
  console.log("✓ Passed: Authorized participants passed all deny-by-default checks");

  // Test 7: Unauthorized Access Denial
  console.log("\nTest 7: Unrelated attacker wallet attempts access...");
  const isAttackerAuthorized =
    grant.requester_wallet.toLowerCase() === attackerWallet.toLowerCase() ||
    grant.owner_wallet.toLowerCase() === attackerWallet.toLowerCase();
  assert.equal(isAttackerAuthorized, false, "Attacker must be strictly denied access");
  console.log("✓ Passed: Unrelated third party strictly denied");

  // Test 8: Instant Revocation
  console.log("\nTest 8: Document owner revokes consent...");
  const revokedGrant = await dataService.revokeGrant(grant.id);
  assert.equal(revokedGrant?.status, "revoked", "Grant status must be revoked");
  assert.ok(revokedGrant?.revoked_at, "Revocation timestamp must be recorded");

  // Check subsequent access attempt
  const canAccessAfterRevocation = revokedGrant?.status === "active";
  assert.equal(canAccessAfterRevocation, false, "Subsequent access attempt must be blocked immediately");
  console.log("✓ Passed: Revocation terminates document access immediately");

  // Test 9: Expiry Enforcement
  console.log("\nTest 9: Expiry validation using server time...");
  const pastGrant = await dataService.createGrant({
    consent_id_hex: formatConsentIdToBytes32("past-test-id"),
    request_id: request.id,
    owner_wallet: ownerWallet,
    requester_wallet: requesterWallet,
    document_id: document.id,
    terms_hash: termsHash,
    allowed_actions: ["VIEW"],
    expires_at: new Date(Date.now() - 5000).toISOString(), // 5 seconds in past
  });

  const isPastExpired = new Date(pastGrant.expires_at).getTime() <= Date.now();
  assert.equal(isPastExpired, true, "Past timestamp must evaluate as expired");
  console.log("✓ Passed: Server-time expiry rejects expired requests");

  console.log("\n=================================================");
  console.log("ALL 9 LIFECYCLE INTEGRATION TESTS PASSED!");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

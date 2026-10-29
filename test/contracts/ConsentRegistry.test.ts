import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { time } from "@nomicfoundation/hardhat-network-helpers";
describe("ConsentRegistry Smart Contract", function () {
  let consentRegistry: any;
  let owner: any;
  let requester: any;
  let docOwner: any;
  let relayer: any;
  let attacker: any;

  const sampleConsentId = ethers.keccak256(ethers.toUtf8Bytes("consent-uuid-12345"));
  const sampleTermsHash = ethers.keccak256(ethers.toUtf8Bytes("purpose:academic_verification;duration:3600"));
  const sampleDocCommitment = ethers.keccak256(ethers.toUtf8Bytes("doc-sha256-abc123xyz"));

  beforeEach(async function () {
    [owner, requester, docOwner, relayer, attacker] = await ethers.getSigners();

    const ConsentRegistryFactory = await ethers.getContractFactory("ConsentRegistry");
    consentRegistry = await ConsentRegistryFactory.deploy();
    await consentRegistry.waitForDeployment();

    // Authorize relayer
    await consentRegistry.connect(owner).setRelayer(relayer.address, true);
  });

  describe("Deployment & Configuration", function () {
    it("should set deployer as contract owner and authorized relayer", async function () {
      expect(await consentRegistry.contractOwner()).to.equal(owner.address);
      expect(await consentRegistry.authorizedRelayers(owner.address)).to.be.true;
    });

    it("should allow contract owner to authorize/unauthorize relayers", async function () {
      expect(await consentRegistry.authorizedRelayers(relayer.address)).to.be.true;
      await consentRegistry.connect(owner).setRelayer(relayer.address, false);
      expect(await consentRegistry.authorizedRelayers(relayer.address)).to.be.false;
    });

    it("should reject non-owner trying to set relayer", async function () {
      await expect(
        consentRegistry.connect(attacker).setRelayer(attacker.address, true)
      ).to.be.revertedWith("ConsentRegistry: Caller is not owner");
    });
  });

  describe("Consent Request Creation", function () {
    it("should allow requester to create a consent request", async function () {
      const now = await time.latest();
      const expiresAt = now + 3600; // 1 hour

      await expect(
        consentRegistry
          .connect(requester)
          .createConsent(sampleConsentId, requester.address, sampleTermsHash, expiresAt)
      )
        .to.emit(consentRegistry, "ConsentCreated")
        .withArgs(sampleConsentId, requester.address, sampleTermsHash, expiresAt);

      const record = await consentRegistry.getConsent(sampleConsentId);
      expect(record.requester).to.equal(requester.address);
      expect(record.termsHash).to.equal(sampleTermsHash);
      expect(record.expiresAt).to.equal(expiresAt);
      expect(record.status).to.equal(1); // Created
    });

    it("should allow authorized relayer to create a consent request for requester", async function () {
      const now = await time.latest();
      const expiresAt = now + 3600;

      await expect(
        consentRegistry
          .connect(relayer)
          .createConsent(sampleConsentId, requester.address, sampleTermsHash, expiresAt)
      ).to.emit(consentRegistry, "ConsentCreated");
    });

    it("should reject duplicate consent IDs", async function () {
      const now = await time.latest();
      const expiresAt = now + 3600;

      await consentRegistry
        .connect(requester)
        .createConsent(sampleConsentId, requester.address, sampleTermsHash, expiresAt);

      await expect(
        consentRegistry
          .connect(requester)
          .createConsent(sampleConsentId, requester.address, sampleTermsHash, expiresAt)
      ).to.be.revertedWith("ConsentRegistry: Consent already exists");
    });

    it("should reject expiry in the past", async function () {
      const now = await time.latest();
      const pastExpiry = now - 100;

      await expect(
        consentRegistry
          .connect(requester)
          .createConsent(sampleConsentId, requester.address, sampleTermsHash, pastExpiry)
      ).to.be.revertedWith("ConsentRegistry: Expiry must be in future");
    });
  });

  describe("Consent Granting", function () {
    let expiresAt: number;

    beforeEach(async function () {
      const now = await time.latest();
      expiresAt = now + 3600;
      await consentRegistry
        .connect(requester)
        .createConsent(sampleConsentId, requester.address, sampleTermsHash, expiresAt);
    });

    it("should allow document owner to grant consent", async function () {
      await expect(
        consentRegistry
          .connect(docOwner)
          .grantConsent(sampleConsentId, docOwner.address, sampleDocCommitment)
      )
        .to.emit(consentRegistry, "ConsentGranted")
        .withArgs(sampleConsentId, docOwner.address, sampleDocCommitment, (val: any) => true);

      const record = await consentRegistry.getConsent(sampleConsentId);
      expect(record.owner).to.equal(docOwner.address);
      expect(record.documentCommitment).to.equal(sampleDocCommitment);
      expect(record.status).to.equal(2); // Granted
      expect(await consentRegistry.isGrantValid(sampleConsentId)).to.be.true;
    });

    it("should allow authorized relayer to record grant for owner", async function () {
      await expect(
        consentRegistry
          .connect(relayer)
          .grantConsent(sampleConsentId, docOwner.address, sampleDocCommitment)
      ).to.emit(consentRegistry, "ConsentGranted");
    });

    it("should reject unauthorized party attempting to grant with arbitrary owner", async function () {
      await expect(
        consentRegistry
          .connect(attacker)
          .grantConsent(sampleConsentId, docOwner.address, sampleDocCommitment)
      ).to.be.revertedWith("ConsentRegistry: Unauthorized grantor");
    });

    it("should reject granting an expired request", async function () {
      await time.increase(3601);
      await expect(
        consentRegistry
          .connect(docOwner)
          .grantConsent(sampleConsentId, docOwner.address, sampleDocCommitment)
      ).to.be.revertedWith("ConsentRegistry: Request expired");
    });
  });

  describe("Consent Revocation", function () {
    beforeEach(async function () {
      const now = await time.latest();
      const expiresAt = now + 3600;
      await consentRegistry
        .connect(requester)
        .createConsent(sampleConsentId, requester.address, sampleTermsHash, expiresAt);
      await consentRegistry
        .connect(docOwner)
        .grantConsent(sampleConsentId, docOwner.address, sampleDocCommitment);
    });

    it("should allow document owner to revoke consent immediately", async function () {
      await expect(consentRegistry.connect(docOwner).revokeConsent(sampleConsentId))
        .to.emit(consentRegistry, "ConsentRevoked")
        .withArgs(sampleConsentId, docOwner.address, (val: any) => true);

      const record = await consentRegistry.getConsent(sampleConsentId);
      expect(record.status).to.equal(3); // Revoked
      expect(record.revokedAt).to.be.greaterThan(0);
      expect(await consentRegistry.isGrantValid(sampleConsentId)).to.be.false;
    });

    it("should allow relayer to submit revocation for owner", async function () {
      await expect(consentRegistry.connect(relayer).revokeConsent(sampleConsentId)).to.emit(
        consentRegistry,
        "ConsentRevoked"
      );
    });

    it("should reject revocation by attacker", async function () {
      await expect(
        consentRegistry.connect(attacker).revokeConsent(sampleConsentId)
      ).to.be.revertedWith("ConsentRegistry: Unauthorized revoker");
    });

    it("should reject revoking already revoked consent", async function () {
      await consentRegistry.connect(docOwner).revokeConsent(sampleConsentId);
      await expect(
        consentRegistry.connect(docOwner).revokeConsent(sampleConsentId)
      ).to.be.revertedWith("ConsentRegistry: Consent is not active");
    });
  });

  describe("Access Recording & Verification", function () {
    beforeEach(async function () {
      const now = await time.latest();
      const expiresAt = now + 3600;
      await consentRegistry
        .connect(requester)
        .createConsent(sampleConsentId, requester.address, sampleTermsHash, expiresAt);
      await consentRegistry
        .connect(docOwner)
        .grantConsent(sampleConsentId, docOwner.address, sampleDocCommitment);
    });

    it("should record access events and increment count", async function () {
      await expect(
        consentRegistry.connect(requester).recordAccess(sampleConsentId, "VIEW")
      )
        .to.emit(consentRegistry, "AccessRecorded")
        .withArgs(sampleConsentId, requester.address, "VIEW", (ts: any) => true, 1);

      expect(await consentRegistry.getAccessCount(sampleConsentId)).to.equal(1);

      await consentRegistry.connect(requester).recordAccess(sampleConsentId, "PRINT");
      expect(await consentRegistry.getAccessCount(sampleConsentId)).to.equal(2);
    });

    it("should reject access recording when revoked", async function () {
      await consentRegistry.connect(docOwner).revokeConsent(sampleConsentId);
      await expect(
        consentRegistry.connect(requester).recordAccess(sampleConsentId, "VIEW")
      ).to.be.revertedWith("ConsentRegistry: Consent not granted");
    });

    it("should reject access recording when expired", async function () {
      await time.increase(3601);
      await expect(
        consentRegistry.connect(requester).recordAccess(sampleConsentId, "VIEW")
      ).to.be.revertedWith("ConsentRegistry: Consent expired");
    });

    it("should reject access recording by unauthorized third party", async function () {
      await expect(
        consentRegistry.connect(attacker).recordAccess(sampleConsentId, "VIEW")
      ).to.be.revertedWith("ConsentRegistry: Unauthorized access recorder");
    });
  });
});

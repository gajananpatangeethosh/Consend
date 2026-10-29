// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ConsentRegistry
 * @dev Privacy-first consent and access audit trail on the MST Blockchain.
 * Minimal on-chain data: pseudonymous identifiers, cryptographic terms hashes,
 * document commitments, and lifecycle state timestamps.
 */
contract ConsentRegistry {
    enum ConsentStatus {
        None,
        Created,
        Granted,
        Revoked
    }

    struct ConsentRecord {
        bytes32 consentId;
        address requester;
        address owner;
        bytes32 termsHash;
        bytes32 documentCommitment;
        uint256 createdAt;
        uint256 grantedAt;
        uint256 expiresAt;
        uint256 revokedAt;
        ConsentStatus status;
        uint256 accessCount;
    }

    // Mapping from consent ID to ConsentRecord
    mapping(bytes32 => ConsentRecord) private _consents;

    // Authorized relayers permitted to record verified operations on behalf of users
    mapping(address => bool) public authorizedRelayers;
    address public contractOwner;

    // Events
    event ConsentCreated(
        bytes32 indexed consentId,
        address indexed requester,
        bytes32 termsHash,
        uint256 expiresAt
    );

    event ConsentGranted(
        bytes32 indexed consentId,
        address indexed owner,
        bytes32 documentCommitment,
        uint256 grantedAt
    );

    event ConsentRevoked(
        bytes32 indexed consentId,
        address indexed revoker,
        uint256 revokedAt
    );

    event AccessRecorded(
        bytes32 indexed consentId,
        address indexed actor,
        string actionType,
        uint256 timestamp,
        uint256 totalAccessCount
    );

    event RelayerStatusUpdated(address indexed relayer, bool isAuthorized);

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "ConsentRegistry: Caller is not owner");
        _;
    }

    modifier onlyAuthorizedOrParty(bytes32 consentId, address expectedParty) {
        require(
            msg.sender == expectedParty ||
            msg.sender == contractOwner ||
            authorizedRelayers[msg.sender],
            "ConsentRegistry: Unauthorized caller"
        );
        _;
    }

    constructor() {
        contractOwner = msg.sender;
        authorizedRelayers[msg.sender] = true;
    }

    function setRelayer(address relayer, bool authorized) external onlyOwner {
        require(relayer != address(0), "ConsentRegistry: Zero address");
        authorizedRelayers[relayer] = authorized;
        emit RelayerStatusUpdated(relayer, authorized);
    }

    /**
     * @notice Create a consent request on-chain.
     * @param consentId Unique 32-byte identifier for the consent workflow.
     * @param requester Address of the party requesting document access.
     * @param termsHash Hash of the canonicalized request terms (purpose, duration, permissions).
     * @param expiresAt Expiry timestamp in seconds.
     */
    function createConsent(
        bytes32 consentId,
        address requester,
        bytes32 termsHash,
        uint256 expiresAt
    ) external {
        require(consentId != bytes32(0), "ConsentRegistry: Invalid consent ID");
        require(requester != address(0), "ConsentRegistry: Invalid requester");
        require(termsHash != bytes32(0), "ConsentRegistry: Invalid terms hash");
        require(expiresAt > block.timestamp, "ConsentRegistry: Expiry must be in future");
        require(_consents[consentId].status == ConsentStatus.None, "ConsentRegistry: Consent already exists");

        // Can be called by requester directly or an authorized relayer
        require(
            msg.sender == requester || msg.sender == contractOwner || authorizedRelayers[msg.sender],
            "ConsentRegistry: Unauthorized caller"
        );

        ConsentRecord storage record = _consents[consentId];
        record.consentId = consentId;
        record.requester = requester;
        record.termsHash = termsHash;
        record.createdAt = block.timestamp;
        record.expiresAt = expiresAt;
        record.status = ConsentStatus.Created;
        record.accessCount = 0;

        emit ConsentCreated(consentId, requester, termsHash, expiresAt);
    }

    /**
     * @notice Grant consent to access a document.
     * @param consentId The consent ID.
     * @param owner Address of the document owner granting access.
     * @param documentCommitment Cryptographic commitment/hash of the document being shared.
     */
    function grantConsent(
        bytes32 consentId,
        address owner,
        bytes32 documentCommitment
    ) external {
        require(owner != address(0), "ConsentRegistry: Invalid owner");
        require(documentCommitment != bytes32(0), "ConsentRegistry: Invalid document commitment");

        ConsentRecord storage record = _consents[consentId];
        require(record.status == ConsentStatus.Created, "ConsentRegistry: Invalid state for grant");
        require(block.timestamp < record.expiresAt, "ConsentRegistry: Request expired");

        // Caller must be the document owner or an authorized relayer
        require(
            msg.sender == owner || msg.sender == contractOwner || authorizedRelayers[msg.sender],
            "ConsentRegistry: Unauthorized grantor"
        );

        record.owner = owner;
        record.documentCommitment = documentCommitment;
        record.grantedAt = block.timestamp;
        record.status = ConsentStatus.Granted;

        emit ConsentGranted(consentId, owner, documentCommitment, block.timestamp);
    }

    /**
     * @notice Revoke previously granted consent.
     * @param consentId The consent ID to revoke.
     */
    function revokeConsent(bytes32 consentId) external {
        ConsentRecord storage record = _consents[consentId];
        require(record.status == ConsentStatus.Granted, "ConsentRegistry: Consent is not active");

        // Only the document owner, contract owner, or authorized relayer can revoke
        require(
            msg.sender == record.owner || msg.sender == contractOwner || authorizedRelayers[msg.sender],
            "ConsentRegistry: Unauthorized revoker"
        );

        record.status = ConsentStatus.Revoked;
        record.revokedAt = block.timestamp;

        emit ConsentRevoked(consentId, msg.sender, block.timestamp);
    }

    /**
     * @notice Record a document access event on-chain for tamper-evident audit.
     * @param consentId The consent ID.
     * @param actionType Description of action (e.g. "VIEW", "PRINT").
     */
    function recordAccess(bytes32 consentId, string memory actionType) external {
        ConsentRecord storage record = _consents[consentId];
        require(record.status == ConsentStatus.Granted, "ConsentRegistry: Consent not granted");
        require(block.timestamp < record.expiresAt, "ConsentRegistry: Consent expired");
        require(record.revokedAt == 0, "ConsentRegistry: Consent revoked");

        // Caller must be requester or authorized application relayer
        require(
            msg.sender == record.requester || msg.sender == contractOwner || authorizedRelayers[msg.sender],
            "ConsentRegistry: Unauthorized access recorder"
        );

        record.accessCount += 1;

        emit AccessRecorded(
            consentId,
            msg.sender,
            actionType,
            block.timestamp,
            record.accessCount
        );
    }

    /**
     * @notice Check whether a grant is currently valid (granted, not expired, not revoked).
     */
    function isGrantValid(bytes32 consentId) external view returns (bool) {
        ConsentRecord storage record = _consents[consentId];
        if (record.status != ConsentStatus.Granted) {
            return false;
        }
        if (block.timestamp >= record.expiresAt) {
            return false;
        }
        if (record.revokedAt != 0) {
            return false;
        }
        return true;
    }

    /**
     * @notice Retrieve full consent details by ID.
     */
    function getConsent(bytes32 consentId)
        external
        view
        returns (
            bytes32 id,
            address requester,
            address owner,
            bytes32 termsHash,
            bytes32 documentCommitment,
            uint256 createdAt,
            uint256 grantedAt,
            uint256 expiresAt,
            uint256 revokedAt,
            ConsentStatus status,
            uint256 accessCount
        )
    {
        ConsentRecord storage record = _consents[consentId];
        require(record.status != ConsentStatus.None, "ConsentRegistry: Consent not found");

        return (
            record.consentId,
            record.requester,
            record.owner,
            record.termsHash,
            record.documentCommitment,
            record.createdAt,
            record.grantedAt,
            record.expiresAt,
            record.revokedAt,
            record.status,
            record.accessCount
        );
    }

    /**
     * @notice Get current access count for a consent.
     */
    function getAccessCount(bytes32 consentId) external view returns (uint256) {
        ConsentRecord storage record = _consents[consentId];
        require(record.status != ConsentStatus.None, "ConsentRegistry: Consent not found");
        return record.accessCount;
    }
}

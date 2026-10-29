import { ethers } from "ethers";
import {
  ACTIVE_NETWORK,
  CONSENT_REGISTRY_ADDRESS,
  getExplorerTxUrl,
} from "./config";
import {
  CONSENT_REGISTRY_ABI,
  getServerRelayerSigner,
  getReadOnlyContract,
  formatConsentIdToBytes32,
} from "./contract";
import { dataService } from "../storage/service";

export interface TransactionExecutionResult {
  txHash: string | null;
  status: "pending" | "submitted" | "confirmed" | "failed";
  explorerUrl?: string;
  error?: string;
  onChainConfirmed: boolean;
}

export const blockchainService = {
  /**
   * Submit createConsent on-chain
   */
  async submitCreateConsent(params: {
    consentId: string;
    requesterWallet: string;
    termsHash: string;
    expiresAtTimestamp: number;
  }): Promise<TransactionExecutionResult> {
    const bytes32ConsentId = formatConsentIdToBytes32(params.consentId);
    const relayer = getServerRelayerSigner();

    // Record pending transaction in DB
    const txRecord = await dataService.recordBlockchainTx({
      consent_id_hex: bytes32ConsentId,
      action: "createConsent",
      chain_id: ACTIVE_NETWORK.chainId,
      contract_address: CONSENT_REGISTRY_ADDRESS,
      status: "pending",
    });

    if (!relayer) {
      // No server relayer configured -> client wallet signs directly or deferred
      return {
        txHash: null,
        status: "pending",
        onChainConfirmed: false,
      };
    }

    try {
      const contract = new ethers.Contract(
        CONSENT_REGISTRY_ADDRESS,
        CONSENT_REGISTRY_ABI,
        relayer
      );

      // Gas price estimation with fallback
      const feeData = await relayer.provider?.getFeeData();
      const tx = await contract.createConsent(
        bytes32ConsentId,
        params.requesterWallet,
        params.termsHash,
        params.expiresAtTimestamp,
        {
          gasLimit: 350000,
          gasPrice: feeData?.gasPrice || ethers.parseUnits("1.5", "gwei"),
        }
      );

      await dataService.updateBlockchainTx(txRecord.id, {
        status: "submitted",
        transaction_hash: tx.hash,
      });

      // Wait for 1 confirmation
      const receipt = await tx.wait(ACTIVE_NETWORK.confirmationsRequired);

      if (receipt && receipt.status === 1) {
        await dataService.updateBlockchainTx(txRecord.id, {
          status: "confirmed",
          transaction_hash: tx.hash,
        });

        return {
          txHash: tx.hash,
          status: "confirmed",
          explorerUrl: getExplorerTxUrl(tx.hash),
          onChainConfirmed: true,
        };
      } else {
        await dataService.updateBlockchainTx(txRecord.id, {
          status: "failed",
          error_code: "RECEIPT_REVERTED",
        });
        return {
          txHash: tx.hash,
          status: "failed",
          error: "Transaction reverted on chain",
          onChainConfirmed: false,
        };
      }
    } catch (err: any) {
      console.warn("Relayer createConsent warning (will require client/reconciliation):", err?.message);
      await dataService.updateBlockchainTx(txRecord.id, {
        status: "failed",
        error_code: err?.code || err?.message?.substring(0, 50),
      });
      return {
        txHash: null,
        status: "failed",
        error: err?.message,
        onChainConfirmed: false,
      };
    }
  },

  /**
   * Submit grantConsent on-chain
   */
  async submitGrantConsent(params: {
    consentId: string;
    grantId: string;
    ownerWallet: string;
    documentCommitment: string;
  }): Promise<TransactionExecutionResult> {
    const bytes32ConsentId = formatConsentIdToBytes32(params.consentId);
    const relayer = getServerRelayerSigner();

    const txRecord = await dataService.recordBlockchainTx({
      grant_id: params.grantId,
      consent_id_hex: bytes32ConsentId,
      action: "grantConsent",
      chain_id: ACTIVE_NETWORK.chainId,
      contract_address: CONSENT_REGISTRY_ADDRESS,
      status: "pending",
    });

    if (!relayer) {
      return {
        txHash: null,
        status: "pending",
        onChainConfirmed: false,
      };
    }

    try {
      const contract = new ethers.Contract(
        CONSENT_REGISTRY_ADDRESS,
        CONSENT_REGISTRY_ABI,
        relayer
      );

      const feeData = await relayer.provider?.getFeeData();
      const tx = await contract.grantConsent(
        bytes32ConsentId,
        params.ownerWallet,
        params.documentCommitment,
        {
          gasLimit: 350000,
          gasPrice: feeData?.gasPrice || ethers.parseUnits("1.5", "gwei"),
        }
      );

      await dataService.updateBlockchainTx(txRecord.id, {
        status: "submitted",
        transaction_hash: tx.hash,
      });

      const receipt = await tx.wait(ACTIVE_NETWORK.confirmationsRequired);

      if (receipt && receipt.status === 1) {
        await dataService.updateBlockchainTx(txRecord.id, {
          status: "confirmed",
          transaction_hash: tx.hash,
        });

        return {
          txHash: tx.hash,
          status: "confirmed",
          explorerUrl: getExplorerTxUrl(tx.hash),
          onChainConfirmed: true,
        };
      } else {
        await dataService.updateBlockchainTx(txRecord.id, {
          status: "failed",
          error_code: "RECEIPT_REVERTED",
        });
        return {
          txHash: tx.hash,
          status: "failed",
          error: "Transaction reverted on chain",
          onChainConfirmed: false,
        };
      }
    } catch (err: any) {
      console.warn("Relayer grantConsent warning:", err?.message);
      await dataService.updateBlockchainTx(txRecord.id, {
        status: "failed",
        error_code: err?.code || err?.message?.substring(0, 50),
      });
      return {
        txHash: null,
        status: "failed",
        error: err?.message,
        onChainConfirmed: false,
      };
    }
  },

  /**
   * Submit revokeConsent on-chain
   */
  async submitRevokeConsent(params: {
    consentId: string;
    grantId: string;
  }): Promise<TransactionExecutionResult> {
    const bytes32ConsentId = formatConsentIdToBytes32(params.consentId);
    const relayer = getServerRelayerSigner();

    const txRecord = await dataService.recordBlockchainTx({
      grant_id: params.grantId,
      consent_id_hex: bytes32ConsentId,
      action: "revokeConsent",
      chain_id: ACTIVE_NETWORK.chainId,
      contract_address: CONSENT_REGISTRY_ADDRESS,
      status: "pending",
    });

    if (!relayer) {
      return {
        txHash: null,
        status: "pending",
        onChainConfirmed: false,
      };
    }

    try {
      const contract = new ethers.Contract(
        CONSENT_REGISTRY_ADDRESS,
        CONSENT_REGISTRY_ABI,
        relayer
      );

      const feeData = await relayer.provider?.getFeeData();
      const tx = await contract.revokeConsent(bytes32ConsentId, {
        gasLimit: 300000,
        gasPrice: feeData?.gasPrice || ethers.parseUnits("1.5", "gwei"),
      });

      await dataService.updateBlockchainTx(txRecord.id, {
        status: "submitted",
        transaction_hash: tx.hash,
      });

      const receipt = await tx.wait(ACTIVE_NETWORK.confirmationsRequired);

      if (receipt && receipt.status === 1) {
        await dataService.updateBlockchainTx(txRecord.id, {
          status: "confirmed",
          transaction_hash: tx.hash,
        });

        return {
          txHash: tx.hash,
          status: "confirmed",
          explorerUrl: getExplorerTxUrl(tx.hash),
          onChainConfirmed: true,
        };
      } else {
        await dataService.updateBlockchainTx(txRecord.id, {
          status: "failed",
          error_code: "RECEIPT_REVERTED",
        });
        return {
          txHash: tx.hash,
          status: "failed",
          error: "Transaction reverted on chain",
          onChainConfirmed: false,
        };
      }
    } catch (err: any) {
      console.warn("Relayer revokeConsent warning:", err?.message);
      await dataService.updateBlockchainTx(txRecord.id, {
        status: "failed",
        error_code: err?.code || err?.message?.substring(0, 50),
      });
      return {
        txHash: null,
        status: "failed",
        error: err?.message,
        onChainConfirmed: false,
      };
    }
  },

  /**
   * Submit recordAccess on-chain
   */
  async submitRecordAccess(params: {
    consentId: string;
    grantId: string;
    actionType: string;
  }): Promise<TransactionExecutionResult> {
    const bytes32ConsentId = formatConsentIdToBytes32(params.consentId);
    const relayer = getServerRelayerSigner();

    if (!relayer) {
      return { txHash: null, status: "pending", onChainConfirmed: false };
    }

    try {
      const contract = new ethers.Contract(
        CONSENT_REGISTRY_ADDRESS,
        CONSENT_REGISTRY_ABI,
        relayer
      );

      const tx = await contract.recordAccess(bytes32ConsentId, params.actionType, {
        gasLimit: 200000,
      });

      return {
        txHash: tx.hash,
        status: "submitted",
        explorerUrl: getExplorerTxUrl(tx.hash),
        onChainConfirmed: false,
      };
    } catch (err: any) {
      console.warn("Relayer recordAccess warning:", err?.message);
      return { txHash: null, status: "failed", error: err?.message, onChainConfirmed: false };
    }
  },

  /**
   * Verify if a consent is currently valid on the MST blockchain
   */
  async verifyGrantOnChain(consentId: string): Promise<boolean> {
    try {
      const bytes32ConsentId = formatConsentIdToBytes32(consentId);
      const contract = getReadOnlyContract();
      return await contract.isGrantValid(bytes32ConsentId);
    } catch (err) {
      console.warn("verifyGrantOnChain read error:", err);
      return false;
    }
  },
};

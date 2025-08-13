import { switchNetwork } from "@wagmi/core";
import { requiredChain, requiredChainId } from "../providers/wagmiConfig";

export interface NetworkSwitchResult {
  success: boolean;
  error?: string;
  requiresManualConfig?: boolean;
}

/**
 * Get the required network name from chain ID
 */
export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 1:
      return "Ethereum Mainnet";
    case 560048:
      return "Ethereum Hoodi";
    default:
      return `Unknown Network (${chainId})`;
  }
}

/**
 * Get the required network name for the application
 */
export function getRequiredNetworkName(): string {
  return getNetworkName(requiredChainId);
}

/**
 * Check if the current network matches the required network
 */
export function isCorrectNetwork(currentChainId?: number): boolean {
  return currentChainId === requiredChainId;
}

/**
 * Attempt to switch to the required network
 */
export async function switchToRequiredNetwork(): Promise<NetworkSwitchResult> {
  try {
    // Try to switch to the required network
    await switchNetwork({
      chainId: requiredChainId,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to switch network:", error);

    // Check if it's a user rejection
    if (error instanceof Error && error.message.includes("User rejected")) {
      return {
        success: false,
        error: "Network switch was cancelled by user",
        requiresManualConfig: false,
      };
    }

    // For other errors, suggest manual configuration
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to switch network",
      requiresManualConfig: true,
    };
  }
}

/**
 * Get manual network configuration instructions
 */
export function getManualNetworkConfig() {
  return {
    networkName: requiredChain.name,
    rpcUrl: requiredChain.rpcUrls.default.http[0],
    chainId: requiredChain.id,
    currencySymbol: requiredChain.nativeCurrency.symbol,
    blockExplorerUrl: requiredChain.blockExplorers?.default?.url,
  };
}

/**
 * Format error messages for network-related issues
 */
export function formatNetworkError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error && error.message) {
    // Common error messages
    if (error.message.includes("User rejected")) {
      return "Network switch was cancelled by user";
    }
    if (error.message.includes("Unrecognized chain ID")) {
      return "This network is not supported by your wallet";
    }
    if (error.message.includes("Missing or invalid")) {
      return "Invalid network configuration";
    }

    return error.message;
  }

  return "An unexpected network error occurred";
}

import { useLogin } from "@refinedev/core";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import type { Connector } from "wagmi";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Wallet, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button, Panel, type Tone, toneSoft } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getRequiredNetworkName,
  getNetworkName,
  isCorrectNetwork,
  switchToRequiredNetwork,
  getManualNetworkConfig,
  formatNetworkError,
  type NetworkSwitchResult,
} from "@/utils/networkUtils";
import { appConfig } from "@/config/env";

/**
 * Full-width status callout for the sign-in flow. Carries the same soft single
 * tint as {@link SoftBadge} (via the shared `toneSoft` token map) but lays out
 * as a notice block — a leading icon beside heading/body content — so it can
 * host multi-line copy and an inline action button.
 */
const Callout = ({
  tone,
  icon: Icon,
  children,
}: {
  tone: Tone;
  icon: LucideIcon;
  children: ReactNode;
}) => (
  <div className={cn("rounded-lg p-3 ring-1 ring-inset", toneSoft[tone])}>
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  </div>
);

export const Login = () => {
  const { mutate: login, status, error } = useLogin();
  const isLoading = status === "pending";
  const { connectors, connect, error: connectError } = useConnect();
  const { isConnected, address, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [pendingConnectorId, setPendingConnectorId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [showManualConfig, setShowManualConfig] = useState(false);

  const requiredNetworkName = getRequiredNetworkName();
  const currentNetworkName = chain ? getNetworkName(chain.id) : "Unknown";
  const isOnCorrectNetwork = isCorrectNetwork(chain?.id);

  const handleWalletConnect = (connector: Connector) => {
    setNetworkError(null);
    setPendingConnectorId(connector.id);
    connect(
      { connector },
      { onSettled: () => setPendingConnectorId(null) }
    );
  };

  const handleNetworkSwitch = async () => {
    setIsSwitchingNetwork(true);
    setNetworkError(null);

    try {
      const result: NetworkSwitchResult = await switchToRequiredNetwork();

      if (result.success) {
        setShowManualConfig(false);
      } else {
        setNetworkError(formatNetworkError(result.error));
        if (result.requiresManualConfig) {
          setShowManualConfig(true);
        }
      }
    } catch (error) {
      console.error("Network switch failed:", error);
      setNetworkError(formatNetworkError(error));
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const handleSIWELogin = () => {
    // Clear all error states before attempting login
    setAuthError(null);
    setNetworkError(null);

    // Check network before attempting login
    if (!isOnCorrectNetwork) {
      setAuthError(
        `Please switch to ${requiredNetworkName} before signing in.`
      );
      return;
    }

    login(
      {},
      {
        onSuccess: (data) => {
          // Check if login actually failed
          if (!data?.success && data?.error) {
            // Parse the error message for better user feedback
            let errorMessage = "Authentication failed. Please try again.";

            if (data.error?.message) {
              if (data.error.message.includes("User rejected")) {
                errorMessage =
                  "Signature was rejected. Please try again and confirm the signature request.";
              } else if (data.error.message.includes("network")) {
                errorMessage = `Please ensure you're connected to ${requiredNetworkName} and try again.`;
              } else {
                errorMessage = data.error.message;
              }
            }

            setAuthError(errorMessage);
          }
        },
        onError: (error) => {
          // This might not be called when authProvider returns success: false
          let errorMessage = "Authentication failed. Please try again.";

          if (error?.message) {
            errorMessage = error.message;
          }

          setAuthError(errorMessage);
        },
      }
    );
  };

  const handleChangeWallet = () => {
    // Clear all error states
    setAuthError(null);
    setNetworkError(null);
    setShowManualConfig(false);

    // Reset connecting state
    setPendingConnectorId(null);

    // Disconnect current wallet
    disconnect();
  };

  // Reset network error when network changes to correct one
  useEffect(() => {
    if (isConnected && isOnCorrectNetwork) {
      setNetworkError(null);
      setShowManualConfig(false);
    }
  }, [isConnected, isOnCorrectNetwork]);

  // Clear auth errors when wallet address changes
  useEffect(() => {
    setAuthError(null);
    setNetworkError(null);
  }, [address]);


  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-background px-6 py-12">
      {/* Theme Toggle in Top Right */}
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-sm">
        {/* Wordmark + subtitle */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl border bg-card shadow-panel">
            <Wallet className="size-5 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {appConfig.appName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your wallet and sign in to access the admin interface
          </p>
        </div>

        <Panel className="p-6">
          <h2 className="text-base font-semibold tracking-tight">
            {!isConnected ? "Connect wallet" : "Sign in"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {!isConnected
              ? "Choose a wallet provider to continue."
              : "Verify your identity with a signed message."}
          </p>

          <div className="mt-6 space-y-4">
            {/* Manual Network Configuration */}
            {showManualConfig && (
              <Callout tone="amber" icon={AlertTriangle}>
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Manual network configuration required
                  </div>
                  <div className="space-y-1 text-xs">
                    {(() => {
                      const config = getManualNetworkConfig();
                      return (
                        <>
                          <div><strong>Network Name:</strong> {config.networkName}</div>
                          <div><strong>RPC URL:</strong> {config.rpcUrl}</div>
                          <div><strong>Chain ID:</strong> {config.chainId}</div>
                          <div><strong>Currency:</strong> {config.currencySymbol}</div>
                          {config.blockExplorerUrl && (
                            <div><strong>Block Explorer:</strong> {config.blockExplorerUrl}</div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Callout>
            )}

            {!isConnected ? (
              <div className="space-y-3">
                {connectors
                  .filter((connector: Connector) => connector.name !== "Injected")
                  .map((connector: Connector) => {
                    const isThisConnecting = pendingConnectorId === connector.id;
                    return (
                      <Button
                        key={connector.id}
                        onClick={() => handleWalletConnect(connector)}
                        disabled={pendingConnectorId !== null}
                        className="w-full"
                        size="lg"
                      >
                        {isThisConnecting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Wallet className="size-4" />
                            Connect {connector.name}
                          </>
                        )}
                      </Button>
                    );
                  })}
                {(() => {
                  const injectedConnector = connectors.find(
                    (c: Connector) => c.name === "Injected"
                  );
                  if (!injectedConnector) return null;
                  const isThisConnecting =
                    pendingConnectorId === injectedConnector.id;
                  return (
                    <Button
                      variant="outline"
                      onClick={() => handleWalletConnect(injectedConnector)}
                      disabled={pendingConnectorId !== null}
                      className="w-full"
                      size="lg"
                    >
                      {isThisConnecting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="size-4" />
                          Connect Browser Wallet
                        </>
                      )}
                    </Button>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Wallet Connection Status */}
                <Callout tone="emerald" icon={CheckCircle}>
                  <div className="text-sm font-medium">Wallet connected</div>
                  <div className="mt-0.5 break-all font-mono text-xs opacity-90">
                    {address}
                  </div>
                </Callout>

                {/* Network Status - Only show alert for wrong network */}
                {!isOnCorrectNetwork && (
                  <Callout tone="red" icon={XCircle}>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium">
                          Wrong network detected
                        </div>
                        <div className="mt-1 text-sm">
                          Connected to: {currentNetworkName}
                          <br />
                          Required: {requiredNetworkName}
                        </div>
                      </div>
                      <Button
                        onClick={handleNetworkSwitch}
                        disabled={isSwitchingNetwork}
                        size="sm"
                        variant="outline"
                      >
                        {isSwitchingNetwork ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Switching...
                          </>
                        ) : (
                          `Switch to ${requiredNetworkName}`
                        )}
                      </Button>
                    </div>
                  </Callout>
                )}

                {/* Error Messages */}
                {(error || authError || connectError || networkError) && (
                  <Callout tone="red" icon={XCircle}>
                    <div className="text-sm font-medium">
                      {networkError
                        ? "Network error"
                        : error || authError
                        ? "Authentication failed"
                        : "Wallet connection failed"}
                    </div>
                    <div className="mt-1 text-sm">
                      {networkError || authError || error?.message || connectError?.message}
                    </div>
                  </Callout>
                )}

                {/* Sign In Button */}
                <Button
                  onClick={handleSIWELogin}
                  disabled={isLoading || !isOnCorrectNetwork}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In with Ethereum"
                  )}
                </Button>

                {/* Change Wallet Button */}
                <Button
                  onClick={handleChangeWallet}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Wallet className="size-4" />
                  Change Wallet
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {isOnCorrectNetwork
                    ? "You will be prompted to sign a message to verify your identity"
                    : "Please switch to the correct network before signing in"}
                </p>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
};

import { useLogin } from "@refinedev/core";
import { useConnect, useAccount, useNetwork, useDisconnect } from "wagmi";
import { Connector } from "wagmi";
import { useState, useEffect } from "react";
import { Wallet, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export const Login = () => {
  const { mutate: login, status, error } = useLogin();
  const isLoading = status === "loading";
  const { connectors, connect, isLoading: isConnecting, error: connectError } = useConnect();
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const { disconnect } = useDisconnect();
  const [connecting, setConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [showManualConfig, setShowManualConfig] = useState(false);

  const requiredNetworkName = getRequiredNetworkName();
  const currentNetworkName = chain ? getNetworkName(chain.id) : "Unknown";
  const isOnCorrectNetwork = isCorrectNetwork(chain?.id);

  const handleWalletConnect = (connector: Connector) => {
    try {
      setConnecting(true);
      setNetworkError(null);
      connect({ connector });
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setConnecting(false);
    }
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
    setConnecting(false);
    
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

  // Reset connecting state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setConnecting(false);
    }
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Theme Toggle in Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            {import.meta.env.VITE_APP_NAME || "CSM ICS Admin Panel"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your wallet and sign in to access the admin interface
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {!isConnected ? "Connect Wallet" : "Sign In"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual Network Configuration */}
            {showManualConfig && (
              <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription>
                  <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Manual Network Configuration Required
                  </div>
                  <div className="text-yellow-700 dark:text-yellow-300 text-xs space-y-1">
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
                </AlertDescription>
              </Alert>
            )}

            {!isConnected ? (
              <div className="space-y-3">
                {connectors
                  .filter((connector: Connector) => connector.name !== "Injected")
                  .map((connector: Connector) => (
                    <Button
                      key={connector.id}
                      onClick={() => handleWalletConnect(connector)}
                      disabled={connecting || isConnecting}
                      className="w-full"
                      size="lg"
                    >
                      {connecting || isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Connect {connector.name}
                        </>
                      )}
                    </Button>
                  ))}
                {connectors.filter((connector: Connector) => connector.name === "Injected")
                  .length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const injectedConnector = connectors.find((c: Connector) => c.name === "Injected");
                      if (injectedConnector) {
                        handleWalletConnect(injectedConnector);
                      }
                    }}
                    disabled={connecting || isConnecting}
                    className="w-full"
                    size="lg"
                  >
                    {connecting || isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Browser Wallet
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Wallet Connection Status */}
                <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription>
                    <div className="font-medium text-green-800 dark:text-green-200 mb-1">
                      Wallet Connected
                    </div>
                    <div className="font-mono text-xs text-green-700 dark:text-green-300">
                      {address}
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Network Status - Only show alert for wrong network */}
                {!isOnCorrectNetwork && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">
                        Wrong Network Detected
                      </div>
                      <div className="text-sm mb-3">
                        Connected to: {currentNetworkName}
                        <br />
                        Required: {requiredNetworkName}
                      </div>
                      <Button
                        onClick={handleNetworkSwitch}
                        disabled={isSwitchingNetwork}
                        size="sm"
                        variant="outline"
                      >
                        {isSwitchingNetwork ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Switching...
                          </>
                        ) : (
                          `Switch to ${requiredNetworkName}`
                        )}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Messages */}
                {(error || authError || connectError || networkError) && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">
                        {networkError
                          ? "Network Error"
                          : error || authError
                          ? "Authentication Failed"
                          : "Wallet Connection Failed"}
                      </div>
                      {networkError || authError || error?.message || connectError?.message}
                    </AlertDescription>
                  </Alert>
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                  <Wallet className="mr-2 h-4 w-4" />
                  Change Wallet
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {isOnCorrectNetwork
                    ? "You will be prompted to sign a message to verify your identity"
                    : "Please switch to the correct network before signing in"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

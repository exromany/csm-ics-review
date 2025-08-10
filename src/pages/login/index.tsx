import { useLogin } from "@refinedev/core";
import { useConnect, useAccount } from "wagmi";
import { Connector } from "wagmi";
import { useState } from "react";
import { Wallet, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Login = () => {
  const { mutate: login, status, error } = useLogin();
  const isLoading = status === "loading";
  const { connectors, connect, isLoading: isConnecting, error: connectError } = useConnect();
  const { isConnected, address } = useAccount();
  const [connecting, setConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleWalletConnect = (connector: Connector) => {
    try {
      setConnecting(true);
      connect({ connector });
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setConnecting(false);
    }
  };

  const handleSIWELogin = () => {
    setAuthError(null);
    login(
      {},
      {
        onError: (error) => {
          console.error("SIWE login failed:", error);
          setAuthError(
            error?.message || "Authentication failed. Please try again."
          );
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            {import.meta.env.VITE_APP_NAME || "CSM ICS Admin Panel"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your wallet to access the admin interface
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Admin Access</CardTitle>
            <CardDescription className="text-center">
              Web3 authentication required
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Messages */}
            {(error || authError || connectError) && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">
                    {error || authError
                      ? "Authentication Failed"
                      : "Wallet Connection Failed"}
                  </div>
                  {error?.message || authError || connectError?.message}
                </AlertDescription>
              </Alert>
            )}

            {!isConnected ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium mb-3 text-center text-foreground">
                  Connect Wallet
                </h3>
                {connectors
                  .filter((connector) => connector.name !== "Injected")
                  .map((connector) => (
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
                {connectors.filter((connector) => connector.name === "Injected")
                  .length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const injectedConnector = connectors.find((c) => c.name === "Injected");
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
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="font-medium text-green-800 mb-1">
                      Wallet Connected
                    </div>
                    <div className="font-mono text-xs text-green-700">
                      {address}
                    </div>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleSIWELogin}
                  disabled={isLoading}
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

                <p className="text-xs text-muted-foreground text-center">
                  You will be prompted to sign a message to verify your identity
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Globe, Save, RotateCcw, Network } from "lucide-react";
import {
  useSettings,
  DEFAULT_RPC_URLS,
  type SupportedChainId,
} from "../../providers/settingsProvider";
import { requiredChain, requiredChainId } from "../../providers/wagmiConfig";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SettingsPage = () => {
  const { rpcUrls, setRpcUrl, resetRpcUrl } = useSettings();
  const chainId = requiredChainId as SupportedChainId;
  const chainName = requiredChain.name;
  const defaultRpc = DEFAULT_RPC_URLS[chainId];
  const stored = rpcUrls[chainId] ?? "";

  const [draft, setDraft] = useState(stored);

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const handleSave = () => {
    const value = draft.trim();
    if (value) {
      try {
        new URL(value);
      } catch {
        toast.error("Invalid URL");
        return;
      }
      setRpcUrl(chainId, value);
      toast.success(`${chainName} RPC saved`);
    } else {
      resetRpcUrl(chainId);
      toast.success(`${chainName} RPC reset to default`);
    }
  };

  const handleReset = () => {
    resetRpcUrl(chainId);
    setDraft("");
  };

  const hasChange = draft.trim() !== stored;

  return (
    <div className="container mx-auto space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure RPC endpoints used to read on-chain data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="w-5 h-5 mr-2 text-primary" />
            RPC Endpoints
          </CardTitle>
          <CardDescription>
            Custom RPC endpoints are used by the Lido CSM SDK to check ICS
            membership. Leave empty to use the built-in public RPC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-sm font-semibold flex items-center">
            <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
            {chainName}
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              Chain ID {chainId}
            </span>
          </Label>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={defaultRpc}
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Default: <code className="font-mono">{defaultRpc}</code>
            </p>
            <div className="flex items-center gap-2">
              {stored && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reset
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={!hasChange}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

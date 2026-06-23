import { useState, useEffect } from "react";
import { RotateCcw, Save } from "lucide-react";
import {
  useSettings,
  DEFAULT_RPC_URLS,
  type SupportedChainId,
} from "../../providers/settingsProvider";
import { requiredChain, requiredChainId } from "../../providers/wagmiConfig";
import { Button, Input, Label, Panel, notify } from "@/components/ui";

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
        notify.error("Invalid URL");
        return;
      }
      setRpcUrl(chainId, value);
      notify.success(`${chainName} RPC saved`);
    } else {
      resetRpcUrl(chainId);
      notify.success(`${chainName} RPC reset to default`);
    }
  };

  const handleReset = () => {
    resetRpcUrl(chainId);
    setDraft("");
  };

  const hasChange = draft.trim() !== stored;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure RPC endpoints used to read on-chain data.
        </p>
      </div>

      <Panel>
        <div className="space-y-1 border-b p-5">
          <h2 className="text-base font-semibold">RPC endpoints</h2>
          <p className="text-sm text-muted-foreground">
            Custom RPC endpoints are used by the Lido CSM SDK to check ICS
            membership. Leave empty to use the built-in public RPC.
          </p>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-baseline gap-2">
            <Label htmlFor="rpc-url" className="text-sm font-medium">
              {chainName}
            </Label>
            <span className="text-xs font-normal tabular-nums text-muted-foreground">
              Chain ID {chainId}
            </span>
          </div>
          <Input
            id="rpc-url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={defaultRpc}
            className="font-mono text-sm"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Default:{" "}
              <code className="font-mono text-foreground">{defaultRpc}</code>
            </p>
            <div className="flex items-center gap-2">
              {stored && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={!hasChange}>
                <Save className="size-3.5" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};

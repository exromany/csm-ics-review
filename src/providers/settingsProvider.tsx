import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { hoodi, mainnet } from "viem/chains";
import { useLocalStorage } from "../hooks/useLocalStorage";

export const SUPPORTED_CHAIN_IDS = [mainnet.id, hoodi.id] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export const DEFAULT_RPC_URLS: Record<SupportedChainId, string> = {
  [mainnet.id]: "https://ethereum-rpc.publicnode.com",
  [hoodi.id]: "https://0xrpc.io/hoodi",
};

const STORAGE_KEY = "ics-review:rpc-urls";

type RpcUrls = Partial<Record<SupportedChainId, string>>;

const EMPTY_RPC_URLS: RpcUrls = {};

interface SettingsContextValue {
  rpcUrls: RpcUrls;
  getRpcUrl: (chainId: SupportedChainId) => string;
  setRpcUrl: (chainId: SupportedChainId, url: string) => void;
  resetRpcUrl: (chainId: SupportedChainId) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const [rpcUrls, setRpcUrls] = useLocalStorage<RpcUrls>(
    STORAGE_KEY,
    EMPTY_RPC_URLS
  );

  const getRpcUrl = useCallback(
    (chainId: SupportedChainId) =>
      rpcUrls[chainId]?.trim() || DEFAULT_RPC_URLS[chainId],
    [rpcUrls]
  );

  const setRpcUrl = useCallback(
    (chainId: SupportedChainId, url: string) => {
      setRpcUrls((prev) => ({ ...prev, [chainId]: url }));
    },
    [setRpcUrls]
  );

  const resetRpcUrl = useCallback(
    (chainId: SupportedChainId) => {
      setRpcUrls((prev) => {
        const next = { ...prev };
        delete next[chainId];
        return next;
      });
    },
    [setRpcUrls]
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ rpcUrls, getRpcUrl, setRpcUrl, resetRpcUrl }),
    [rpcUrls, getRpcUrl, setRpcUrl, resetRpcUrl]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};

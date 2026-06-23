import { useMemo } from "react";
import { LidoSDKCore } from "@lidofinance/lido-ethereum-sdk";
import { LidoSDKCsm } from "@lidofinance/lido-csm-sdk";
import {
  useSettings,
  type SupportedChainId,
} from "../providers/settingsProvider";
import { requiredChainId } from "../providers/wagmiConfig";

const sdkCache = new Map<string, LidoSDKCsm>();

const getOrCreateSdk = (chainId: SupportedChainId, rpcUrl: string) => {
  const cacheKey = `${chainId}:${rpcUrl}`;
  const cached = sdkCache.get(cacheKey);
  if (cached) return cached;

  const core = new LidoSDKCore({
    chainId,
    rpcUrls: [rpcUrl],
    logMode: "none",
  });
  const sdk = new LidoSDKCsm({ core });
  sdkCache.set(cacheKey, sdk);
  return sdk;
};

export const useCsmSdk = (
  chainId: SupportedChainId = requiredChainId as SupportedChainId,
) => {
  const { getRpcUrl } = useSettings();
  const rpcUrl = getRpcUrl(chainId);

  return useMemo(() => {
    return {
      sdk: getOrCreateSdk(chainId, rpcUrl),
      chainId,
      rpcUrl,
    };
  }, [chainId, rpcUrl]);
};

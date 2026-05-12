import { useQueries, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { useCallback, useMemo } from "react";
import { useCsmSdk } from "./useCsmSdk";

const ICS_QUERY_KEY = "ics-status";

export type IcsStatus = "ICS" | "NOT_ICS";

const icsQueryKey = (chainId: number, rpcUrl: string, address: string) =>
  [ICS_QUERY_KEY, chainId, rpcUrl, address.toLowerCase()] as const;

export const useIcsStatusList = (addresses: (string | undefined)[]) => {
  const { sdk, chainId, rpcUrl } = useCsmSdk();
  const queryClient = useQueryClient();

  const validAddresses = useMemo(
    () =>
      addresses
        .filter((a): a is string => Boolean(a))
        .map((a) => a.toLowerCase()),
    [addresses]
  );

  const queries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: icsQueryKey(chainId, rpcUrl, address),
      queryFn: async (): Promise<IcsStatus> => {
        const proof = await sdk.icsGate.getProof(address as Address);
        return proof ? "ICS" : "NOT_ICS";
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });

  const byAddress = useMemo(() => {
    const map = new Map<
      string,
      { status?: IcsStatus; isLoading: boolean; isError: boolean }
    >();
    validAddresses.forEach((addr, idx) => {
      const q = queries[idx];
      map.set(addr, {
        status: q?.data,
        isLoading: !!q?.isLoading,
        isError: !!q?.isError,
      });
    });
    return map;
  }, [queries, validAddresses]);

  const hasError = queries.some((q) => q.isError);
  const isLoading = queries.some((q) => q.isLoading);

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [ICS_QUERY_KEY] });
  }, [queryClient]);

  const get = useCallback(
    (address?: string) => {
      if (!address) return undefined;
      return byAddress.get(address.toLowerCase());
    },
    [byAddress]
  );

  return { get, hasError, isLoading, refetchAll };
};

export type UseIcsStatusListResult = ReturnType<typeof useIcsStatusList>;

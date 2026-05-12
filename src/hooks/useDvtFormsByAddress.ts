import { useDataProvider } from "@refinedev/core";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { AdminDvtFormItemDto, FormStatus } from "../types/api";

const QUERY_KEY = "dvt-forms-by-address";

export interface DvtFormMatch {
  id: number;
  status: FormStatus;
  issued: boolean;
  outdated: boolean;
  createdAt: string;
}

const toMatch = (f: AdminDvtFormItemDto): DvtFormMatch => ({
  id: f.id,
  status: f.status,
  issued: f.issued,
  outdated: f.outdated,
  createdAt: f.createdAt,
});

// Higher score = stronger signal. Approved-issued is the "especially" case.
// Outdated drops below an active in-review form but above rejected (rejected is filtered out anyway).
const scoreOf = (f: DvtFormMatch): number => {
  let base: number;
  if (f.status === "APPROVED" && f.issued) base = 100;
  else if (f.status === "APPROVED") base = 80;
  else if (f.status === "REVIEW") base = 50;
  else base = 20; // REJECTED — filtered out, kept for safety
  if (f.outdated) base -= 60;
  return base;
};

const sortByScore = (forms: DvtFormMatch[]): DvtFormMatch[] =>
  [...forms].sort((a, b) => {
    const ds = scoreOf(b) - scoreOf(a);
    if (ds !== 0) return ds;
    return b.id - a.id;
  });

export const useDvtFormsByAddressList = (
  addresses: (string | undefined)[],
  excludeFormId?: number
) => {
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();

  const validAddresses = useMemo(
    () =>
      Array.from(
        new Set(
          addresses
            .filter((a): a is string => Boolean(a))
            .map((a) => a.toLowerCase())
        )
      ),
    [addresses]
  );

  const queries = useQueries({
    queries: validAddresses.map((address) => ({
      queryKey: [QUERY_KEY, address] as const,
      queryFn: async (): Promise<DvtFormMatch[]> => {
        const { data } = await dataProvider().getList<AdminDvtFormItemDto>({
          resource: "dvt-forms",
          filters: [{ field: "address", operator: "eq", value: address }],
          pagination: { currentPage: 1, pageSize: 100 },
          sorters: [{ field: "id", order: "desc" }],
        });
        return (data ?? []).map(toMatch);
      },
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });

  const byAddress = useMemo(() => {
    const map = new Map<
      string,
      {
        forms: DvtFormMatch[];
        isLoading: boolean;
        isError: boolean;
      }
    >();
    validAddresses.forEach((addr, idx) => {
      const q = queries[idx];
      const all = (q?.data ?? []) as DvtFormMatch[];
      const filtered = all
        .filter((f) => f.status !== "REJECTED")
        .filter((f) => (excludeFormId != null ? f.id !== excludeFormId : true));
      map.set(addr, {
        forms: sortByScore(filtered),
        isLoading: !!q?.isLoading,
        isError: !!q?.isError,
      });
    });
    return map;
  }, [queries, validAddresses, excludeFormId]);

  const hasError = queries.some((q) => q.isError);
  const isLoading = queries.some((q) => q.isLoading);

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
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

export type UseDvtFormsByAddressListResult = ReturnType<
  typeof useDvtFormsByAddressList
>;

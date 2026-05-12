import { useDataProvider } from "@refinedev/core";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { AdminDvtFormItemDto, FormStatus } from "../types/api";

const QUERY_KEY = "dvt-forms-by-identifier";

export type DvtMatchKind = "address" | "discordLink" | "telegramUsername";

export type DvtAddressRole = "main" | "member";

export interface DvtFormMatch {
  id: number;
  status: FormStatus;
  issued: boolean;
  outdated: boolean;
  createdAt: string;
  // Only set when the form was located via the "address" kind: indicates whether
  // the queried address acts as the form's main address or as a cluster member.
  addressRole?: DvtAddressRole;
}

export interface DvtFormMatchWithReasons extends DvtFormMatch {
  matchedOn: DvtMatchKind[];
}

export interface DvtIdentifier {
  kind: DvtMatchKind;
  value?: string;
}

const toMatch = (f: AdminDvtFormItemDto): DvtFormMatch => ({
  id: f.id,
  status: f.status,
  issued: f.issued,
  outdated: f.outdated,
  createdAt: f.createdAt,
});

// For address-kind lookups, resolve whether the queried address acts as the
// linked form's main address or as a cluster member. `address` is already
// normalized (lowercased) by the caller.
const resolveAddressRole = (
  f: AdminDvtFormItemDto,
  address: string
): DvtAddressRole => {
  if (f.form?.mainAddress?.toLowerCase() === address) return "main";
  return "member";
};

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

const sortByScore = <T extends DvtFormMatch>(forms: T[]): T[] =>
  [...forms].sort((a, b) => {
    const ds = scoreOf(b) - scoreOf(a);
    if (ds !== 0) return ds;
    return b.id - a.id;
  });

// Backend matches discord/telegram case-insensitively; we lowercase for stable cache keys.
const normalize = (value: string): string => value.trim().toLowerCase();

const keyOf = (kind: DvtMatchKind, value: string) => `${kind}:${value}`;

export const useDvtFormsByIdentifiersList = (
  identifiers: DvtIdentifier[],
  excludeFormId?: number
) => {
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();

  // Deduplicate (kind, normalized value) pairs so React Query fires one request per unique lookup.
  const validIdentifiers = useMemo(() => {
    const seen = new Set<string>();
    const result: { kind: DvtMatchKind; value: string }[] = [];
    for (const { kind, value } of identifiers) {
      if (!value) continue;
      const v = normalize(value);
      if (!v) continue;
      const key = keyOf(kind, v);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ kind, value: v });
    }
    return result;
  }, [identifiers]);

  const queries = useQueries({
    queries: validIdentifiers.map(({ kind, value }) => ({
      queryKey: [QUERY_KEY, kind, value] as const,
      queryFn: async (): Promise<DvtFormMatch[]> => {
        const { data } = await dataProvider().getList<AdminDvtFormItemDto>({
          resource: "dvt-forms",
          filters: [{ field: kind, operator: "eq", value }],
          pagination: { currentPage: 1, pageSize: 100 },
          sorters: [{ field: "id", order: "desc" }],
        });
        return (data ?? []).map((f) => {
          const base = toMatch(f);
          if (kind === "address") {
            base.addressRole = resolveAddressRole(f, value);
          }
          return base;
        });
      },
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });

  const byKey = useMemo(() => {
    const map = new Map<
      string,
      {
        forms: DvtFormMatch[];
        isLoading: boolean;
        isError: boolean;
      }
    >();
    validIdentifiers.forEach(({ kind, value }, idx) => {
      const q = queries[idx];
      const all = (q?.data ?? []) as DvtFormMatch[];
      const filtered = all
        .filter((f) => f.status !== "REJECTED")
        .filter((f) => (excludeFormId != null ? f.id !== excludeFormId : true));
      map.set(keyOf(kind, value), {
        forms: sortByScore(filtered),
        isLoading: !!q?.isLoading,
        isError: !!q?.isError,
      });
    });
    return map;
  }, [queries, validIdentifiers, excludeFormId]);

  const hasError = queries.some((q) => q.isError);
  const isLoading = queries.some((q) => q.isLoading);

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [queryClient]);

  const get = useCallback(
    (kind: DvtMatchKind, value?: string) => {
      if (!value) return undefined;
      const v = normalize(value);
      if (!v) return undefined;
      return byKey.get(keyOf(kind, v));
    },
    [byKey]
  );

  // Merge matches across multiple identifier kinds, deduped by form id.
  // Each merged match records which kinds matched in `matchedOn` so the UI can
  // surface "matched on Discord + Telegram" instead of showing the form thrice.
  const getMerged = useCallback(
    (
      values: Partial<Record<DvtMatchKind, string | undefined>>
    ): {
      forms: DvtFormMatchWithReasons[];
      isLoading: boolean;
      isError: boolean;
    } => {
      const acc = new Map<number, DvtFormMatchWithReasons>();
      let mergedLoading = false;
      let mergedError = false;
      (Object.entries(values) as [DvtMatchKind, string | undefined][]).forEach(
        ([kind, value]) => {
          const r = get(kind, value);
          if (!r) return;
          mergedLoading = mergedLoading || r.isLoading;
          mergedError = mergedError || r.isError;
          r.forms.forEach((f) => {
            const existing = acc.get(f.id);
            if (existing) {
              if (!existing.matchedOn.includes(kind)) {
                existing.matchedOn.push(kind);
              }
              // Late-arrival merge: addressRole is only populated on
              // address-kind matches, so an entry seeded by discord/telegram
              // won't carry it until the address kind catches up.
              if (kind === "address" && f.addressRole && !existing.addressRole) {
                existing.addressRole = f.addressRole;
              }
            } else {
              acc.set(f.id, { ...f, matchedOn: [kind] });
            }
          });
        }
      );
      return {
        forms: sortByScore(Array.from(acc.values())),
        isLoading: mergedLoading,
        isError: mergedError,
      };
    },
    [get]
  );

  return { get, getMerged, hasError, isLoading, refetchAll };
};

export type UseDvtFormsByIdentifiersListResult = ReturnType<
  typeof useDvtFormsByIdentifiersList
>;

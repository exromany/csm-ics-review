import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { FilterValues } from "./useTableFilters";

export type SortOrder = "asc" | "desc";

export interface TableState<TSort extends string = string> {
  filterValues: FilterValues;
  sortField: TSort;
  sortOrder: SortOrder;
  currentPage: number;
  pageSize: number;
}

const DEFAULT_TABLE_STATE: TableState = {
  filterValues: {
    status: undefined,
    address: "",
    issued: undefined,
    outdated: undefined,
    startDate: "",
    endDate: "",
  },
  sortField: "createdAt",
  sortOrder: "desc",
  currentPage: 1,
  pageSize: 20,
};

export function usePersistentTableState<TSort extends string = string>(
  storageKey = "csm-ics-table-state",
  defaultState: TableState<TSort> = DEFAULT_TABLE_STATE as TableState<TSort>
) {
  const [storedState, setStoredState, clearStoredState] =
    useLocalStorage<TableState<TSort>>(storageKey, defaultState);

  const updateFilterValues = useCallback(
    (filterValues: FilterValues | ((prev: FilterValues) => FilterValues)) => {
      setStoredState((prev) => ({
        ...prev,
        filterValues:
          typeof filterValues === "function"
            ? filterValues(prev.filterValues)
            : filterValues,
        currentPage: 1,
      }));
    },
    [setStoredState]
  );

  const updateSortField = useCallback(
    (sortField: TSort) => {
      setStoredState((prev) => ({
        ...prev,
        sortField,
        currentPage: 1,
      }));
    },
    [setStoredState]
  );

  const updateSortOrder = useCallback(
    (sortOrder: SortOrder) => {
      setStoredState((prev) => ({
        ...prev,
        sortOrder,
        currentPage: 1,
      }));
    },
    [setStoredState]
  );

  const updateSorting = useCallback(
    (sortField: TSort, sortOrder: SortOrder) => {
      setStoredState((prev) => ({
        ...prev,
        sortField,
        sortOrder,
        currentPage: 1,
      }));
    },
    [setStoredState]
  );

  const updateCurrentPage = useCallback(
    (currentPage: number) => {
      setStoredState((prev) => ({
        ...prev,
        currentPage,
      }));
    },
    [setStoredState]
  );

  const updatePageSize = useCallback(
    (pageSize: number) => {
      setStoredState((prev) => ({
        ...prev,
        pageSize,
        currentPage: 1,
      }));
    },
    [setStoredState]
  );

  const resetTableState = useCallback(() => {
    clearStoredState();
  }, [clearStoredState]);

  const hasStoredState = useCallback(() => {
    const hasFilters = Object.values(storedState.filterValues).some(
      (value) => value !== undefined && value !== null && value !== ""
    );
    const hasSorting =
      storedState.sortField !== defaultState.sortField ||
      storedState.sortOrder !== defaultState.sortOrder;
    const hasPagination =
      storedState.currentPage !== defaultState.currentPage ||
      storedState.pageSize !== defaultState.pageSize;

    return hasFilters || hasSorting || hasPagination;
  }, [storedState, defaultState]);

  return {
    filterValues: storedState.filterValues,
    sortField: storedState.sortField,
    sortOrder: storedState.sortOrder,
    currentPage: storedState.currentPage,
    pageSize: storedState.pageSize,
    updateFilterValues,
    updateSortField,
    updateSortOrder,
    updateSorting,
    updateCurrentPage,
    updatePageSize,
    resetTableState,
    hasStoredState,
  };
}

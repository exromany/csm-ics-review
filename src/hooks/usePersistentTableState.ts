import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { FilterValues } from "./useTableFilters";

type SortField =
  | "id"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "mainAddress"
  | "issued"
  | "outdated";

type SortOrder = "asc" | "desc";

interface TableState {
  filterValues: FilterValues;
  sortField: SortField;
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

export function usePersistentTableState(storageKey = "csm-ics-table-state") {
  const [storedState, setStoredState, clearStoredState] =
    useLocalStorage<TableState>(storageKey, DEFAULT_TABLE_STATE);

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
    (sortField: SortField) => {
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
    (sortField: SortField, sortOrder: SortOrder) => {
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
      storedState.sortField !== DEFAULT_TABLE_STATE.sortField ||
      storedState.sortOrder !== DEFAULT_TABLE_STATE.sortOrder;
    const hasPagination =
      storedState.currentPage !== DEFAULT_TABLE_STATE.currentPage ||
      storedState.pageSize !== DEFAULT_TABLE_STATE.pageSize;

    return hasFilters || hasSorting || hasPagination;
  }, [storedState]);

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

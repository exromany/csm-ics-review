import { useMemo } from 'react';
import type { LogicalFilter } from "@refinedev/core";

export interface FilterValues {
  [key: string]: string | boolean | number | undefined;
}

/**
 * Hook for building clean, type-safe table filters
 * Eliminates the need for complex spread operators and manual filter arrays
 */
export function useTableFilters() {
  /**
   * Converts filter values object into Refine's LogicalFilter format
   * Only includes filters that have actual values (not empty/undefined)
   * Uses direct API field names - no transformations needed
   */
  const buildFilters = useMemo(() => {
    return (filterValues: FilterValues): LogicalFilter[] => {
      return Object.entries(filterValues)
        .filter(([, value]) => {
          // Exclude empty, undefined, or null values
          if (value === undefined || value === null || value === '') {
            return false;
          }
          return true;
        })
        .map(([field, value]) => ({
          field,
          operator: getOperatorForValue(value),
          value
        }));
    };
  }, []);

  /**
   * Helper function to determine the appropriate operator based on value type
   */
  const getOperatorForValue = (value: any): "eq" | "contains" => {
    // For text searches, use contains for partial matching
    if (typeof value === 'string' && 
        (value.includes('0x') || value.length > 10)) { // Likely an address search
      return 'contains';
    }
    
    // For everything else (status, boolean, dates), use exact match
    return 'eq';
  };

  /**
   * Creates an empty filter state object based on provided field names
   */
  const createEmptyFilters = (fields: string[]): FilterValues => {
    return fields.reduce((acc, field) => {
      acc[field] = undefined;
      return acc;
    }, {} as FilterValues);
  };

  /**
   * Checks if any filters are currently active
   */
  const hasActiveFilters = (filterValues: FilterValues): boolean => {
    return Object.values(filterValues).some(value => 
      value !== undefined && value !== null && value !== ''
    );
  };

  /**
   * Clears all filter values
   */
  const clearAllFilters = (filterValues: FilterValues): FilterValues => {
    return Object.keys(filterValues).reduce((acc, key) => {
      acc[key] = undefined;
      return acc;
    }, {} as FilterValues);
  };

  return {
    buildFilters,
    createEmptyFilters,
    hasActiveFilters,
    clearAllFilters
  };
}

/**
 * Hook for managing table sorting state
 * Provides clean interface for handling sortable columns
 */
export function useTableSorting(defaultField: string, defaultOrder: 'asc' | 'desc' = 'desc') {
  const createSorter = (field: string, order: 'asc' | 'desc') => {
    return [{ field, order }];
  };

  const toggleSortOrder = (currentOrder: 'asc' | 'desc'): 'asc' | 'desc' => {
    return currentOrder === 'asc' ? 'desc' : 'asc';
  };

  return {
    createSorter,
    toggleSortOrder,
    defaultSort: { field: defaultField, order: defaultOrder }
  };
}
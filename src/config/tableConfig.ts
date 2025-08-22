export type FilterType = 'text' | 'select' | 'boolean' | 'date';

export interface TableConfig {
  filters: Record<string, FilterType>;
  sortableFields: string[];
  defaultSort: {
    field: string;
    order: 'asc' | 'desc';
  };
}

/**
 * Table configurations using direct API field names (no transformations needed)
 * Field names in this config match exactly what the API expects
 */
export const tableConfigs: Record<string, TableConfig> = {
  'ics-forms': {
    // All filter field names match API parameters exactly
    filters: {
      status: 'select',       // API: status
      address: 'text',        // API: address (filters by main or additional addresses)
      issued: 'boolean',      // API: issued
      outdated: 'boolean',    // API: outdated
      startDate: 'date',      // API: startDate (was createdAfter in frontend)
      endDate: 'date'         // API: endDate (was createdBefore in frontend)
    },
    // sortBy API parameter accepts these exact values
    sortableFields: ['id', 'createdAt', 'updatedAt', 'mainAddress', 'status', 'issued', 'outdated'],
    defaultSort: {
      field: 'createdAt',
      order: 'desc'
    }
  },
  'admin-users': {
    // All filter field names match API parameters exactly
    filters: {
      role: 'select',         // API: role
      active: 'boolean',      // API: active  
      address: 'text'         // API: address
    },
    // sortBy API parameter accepts these exact values (pending API update to include 'id')
    sortableFields: ['id', 'createdAt', 'updatedAt', 'address', 'role', 'active'],
    defaultSort: {
      field: 'createdAt',
      order: 'desc'
    }
  }
};

/**
 * Get filter configuration for a specific table
 */
export function getTableConfig(resource: string): TableConfig | undefined {
  return tableConfigs[resource];
}

/**
 * Get available filter types for a table
 */
export function getFilterTypes(resource: string): Record<string, FilterType> {
  const config = getTableConfig(resource);
  return config?.filters || {};
}

/**
 * Check if a field is sortable for a table
 */
export function isSortableField(resource: string, field: string): boolean {
  const config = getTableConfig(resource);
  return config?.sortableFields.includes(field) || false;
}
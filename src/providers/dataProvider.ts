import { DataProvider, LogicalFilter } from "@refinedev/core";
import type {
  AdminIcsFormListResponseDto,
  AdminIcsFormUpdateDto,
  AdminUserListResponseDto,
  AdminUserCreateDto,
} from "../types/api";
import { TOKEN_KEY } from "./authProvider";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3003";

const axiosInstance = {
  async request(config: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    data?: unknown;
    params?: Record<string, unknown>;
  }) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...config.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let url = `${API_BASE_URL}${config.url}`;

    if (config.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method: config.method.toUpperCase(),
      headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    });

    const data = response.ok ? await response.json() : null;

    if (!response.ok) {
      const error = {
        message: data?.message || `HTTP Error: ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }

    return { data, status: response.status };
  },
};

export const dataProvider: DataProvider = {
  getApiUrl: () => API_BASE_URL,

  // Get list of resources with pagination and filters
  getList: async ({ resource, pagination, filters, sorters }) => {
    if (resource === "ics-forms") {
      const params: Record<string, string | number | boolean> = {};

      if (pagination) {
        params.page = pagination.current || 1;
        params.pageSize = pagination.pageSize || 20;
      }

      // Handle filters
      if (filters) {
        filters.forEach((filter) => {
          const logicalFilter = filter as LogicalFilter;
          if (logicalFilter.field === "status" && logicalFilter.value) {
            params.status = logicalFilter.value;
          }
          if (logicalFilter.field === "mainAddress" && logicalFilter.value) {
            params.mainAddress = logicalFilter.value;
          }
          if (logicalFilter.field === "issued" && typeof logicalFilter.value === 'boolean') {
            params.issued = logicalFilter.value;
          }
          if (logicalFilter.field === "outdated" && typeof logicalFilter.value === 'boolean') {
            params.outdated = logicalFilter.value;
          }
          if (logicalFilter.field === "createdAfter" && logicalFilter.value) {
            params.createdAfter = logicalFilter.value;
          }
          if (logicalFilter.field === "createdBefore" && logicalFilter.value) {
            params.createdBefore = logicalFilter.value;
          }
          if (logicalFilter.field === "updatedAfter" && logicalFilter.value) {
            params.updatedAfter = logicalFilter.value;
          }
          if (logicalFilter.field === "updatedBefore" && logicalFilter.value) {
            params.updatedBefore = logicalFilter.value;
          }
        });
      }

      // Handle sorting
      if (sorters && sorters.length > 0) {
        const sorter = sorters[0];
        params.sortBy = sorter.field;
        params.sortOrder = sorter.order || 'asc';
      }

      const { data } = await axiosInstance.request({
        method: "GET",
        url: `/admin/${resource}`,
        params,
      });

      const response = data as AdminIcsFormListResponseDto;

      return {
        data: response.items as any,
        total: response.pagination.itemCount,
      };
    }

    if (resource === "admin-users") {
      const params: Record<string, string | number | boolean> = {};

      if (pagination) {
        params.page = pagination.current || 1;
        params.pageSize = pagination.pageSize || 20;
      }

      // Handle filters
      if (filters) {
        filters.forEach((filter) => {
          const logicalFilter = filter as LogicalFilter;
          if (logicalFilter.field === "role" && logicalFilter.value) {
            params.role = logicalFilter.value;
          }
          if (logicalFilter.field === "active" && typeof logicalFilter.value === 'boolean') {
            params.active = logicalFilter.value;
          }
          if (logicalFilter.field === "address" && logicalFilter.value) {
            params.address = logicalFilter.value;
          }
        });
      }

      // Handle sorting
      if (sorters && sorters.length > 0) {
        const sorter = sorters[0];
        params.sortBy = sorter.field;
        params.sortOrder = sorter.order || 'asc';
      }

      const { data } = await axiosInstance.request({
        method: "GET",
        url: `/admin/users`,
        params,
      });

      const response = data as AdminUserListResponseDto;

      return {
        data: response.items as any,
        total: response.pagination.itemCount,
      };
    }

    throw new Error(`Resource ${resource} not supported`);
  },

  // Get one resource by ID
  getOne: async ({ resource, id }) => {
    if (resource === "ics-forms") {
      const { data } = await axiosInstance.request({
        method: "GET",
        url: `/admin/${resource}/${id}`,
      });

      return { data: data as any };
    }

    if (resource === "admin-users") {
      const { data } = await axiosInstance.request({
        method: "GET",
        url: `/admin/users/${id}`,
      });

      return { data: data as any };
    }

    throw new Error(`Resource ${resource} not supported`);
  },

  // Update resources
  update: async ({ resource, id, variables, meta }) => {
    if (resource === "ics-forms") {
      const { data } = await axiosInstance.request({
        method: "PATCH",
        url: `/admin/${resource}/${id}`,
        data: variables as AdminIcsFormUpdateDto,
      });

      return { data: data as any };
    }

    if (resource === "admin-users") {
      // Handle custom endpoint for toggle-active
      if (meta?.endpoint) {
        const { data } = await axiosInstance.request({
          method: meta.method?.toUpperCase() || "PATCH",
          url: meta.endpoint,
          data: variables,
        });

        return { data: data as any };
      }
      
      // Regular update
      const { data } = await axiosInstance.request({
        method: "PATCH",
        url: `/admin/users/${id}`,
        data: variables,
      });

      return { data: data as any };
    }

    throw new Error(`Resource ${resource} not supported`);
  },

  // Create new resources
  create: async ({ resource, variables }) => {
    if (resource === "admin-users") {
      const { data } = await axiosInstance.request({
        method: "POST",
        url: `/admin/users`,
        data: variables as AdminUserCreateDto,
      });

      return { data: data as any };
    }

    throw new Error(`Create operation not supported for resource ${resource}`);
  },

  deleteOne: async () => {
    throw new Error("Delete operation not supported in admin interface");
  },

  getMany: async ({ resource, ids }) => {
    // Could implement batch fetching if needed
    const promises = ids.map((id) =>
      axiosInstance.request({
        method: "GET",
        url: `/admin/${resource}/${id}`,
      })
    );

    const responses = await Promise.all(promises);
    return {
      data: responses.map((response) => response.data) as any,
    };
  },

  createMany: async () => {
    throw new Error("CreateMany operation not supported in admin interface");
  },

  deleteMany: async () => {
    throw new Error("DeleteMany operation not supported in admin interface");
  },

  updateMany: async () => {
    throw new Error("UpdateMany operation not supported in admin interface");
  },

  custom: async ({ url, method, headers, meta }) => {
    const { data } = await axiosInstance.request({
      method: method || "GET",
      url,
      headers,
      data: meta?.data,
      params: meta?.params,
    });

    return { data };
  },
};

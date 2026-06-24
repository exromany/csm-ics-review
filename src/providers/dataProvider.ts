import type { DataProvider, LogicalFilter } from "@refinedev/core";
import { appConfig } from "@/config/env";
import { client, unwrap } from "./apiClient";
import { RESOURCES, type ResourceHandlers } from "./resourceRegistry";

const API_BASE_URL = appConfig.apiBaseUrl;

type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function resourceHandlers(resource: string): ResourceHandlers {
  const handlers = RESOURCES[resource];
  if (!handlers) {
    throw new Error(`Resource "${resource}" not supported`);
  }
  return handlers;
}

/**
 * Refine data provider backed by the generated hey-api SDK.
 *
 * Wire types and transport come from `src/client/*` (see `resourceRegistry`);
 * this layer only translates between Refine's call shape and the registry. The
 * `as never` casts on returns are the unavoidable boundary cast — Refine's
 * `TData` generic lives at the hook call site, not here, so the provider can't
 * name it. They erase nothing the registry hasn't already type-checked.
 */
export const dataProvider: DataProvider = {
  getApiUrl: () => API_BASE_URL,

  getList: async ({ resource, pagination, filters, sorters }) => {
    const query: Record<string, unknown> = {};

    if (pagination) {
      query.page = pagination.currentPage ?? 1;
      query.pageSize = pagination.pageSize ?? 20;
    }

    // Filter field names map 1:1 to API params — pass them straight through.
    filters?.forEach((filter) => {
      const { field, value } = filter as LogicalFilter;
      if (value !== undefined && value !== null && value !== "") {
        query[field] = value;
      }
    });

    if (sorters?.length) {
      query.sortBy = sorters[0].field;
      query.sortOrder = sorters[0].order ?? "asc";
    }

    const { items, pagination: meta } = await resourceHandlers(resource).list(query);
    return { data: items as never[], total: meta.itemCount };
  },

  getOne: async ({ resource, id }) => {
    const data = await resourceHandlers(resource).getOne(id);
    return { data: data as never };
  },

  update: async ({ resource, id, variables }) => {
    const { update } = resourceHandlers(resource);
    if (!update) {
      throw new Error(`Update not supported for resource "${resource}"`);
    }

    const data = await update(id, variables as Record<string, unknown>);
    return { data: data as never };
  },

  create: async ({ resource, variables }) => {
    const { create } = resourceHandlers(resource);
    if (!create) {
      throw new Error(`Create not supported for resource "${resource}"`);
    }

    const data = await create(variables as Record<string, unknown>);
    return { data: data as never };
  },

  getMany: async ({ resource, ids }) => {
    const { getOne } = resourceHandlers(resource);
    const data = await Promise.all(ids.map((id) => getOne(id)));
    return { data: data as never[] };
  },

  deleteOne: async () => {
    throw new Error("Delete operation not supported in admin interface");
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
    const data = await unwrap(
      client.request({
        method: (method?.toUpperCase() ?? "GET") as HttpVerb,
        url,
        headers,
        body: meta?.data,
        query: meta?.params as Record<string, unknown> | undefined,
      }),
    );
    return { data: data as never };
  },
};

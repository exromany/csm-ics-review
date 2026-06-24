/**
 * Maps each Refine resource to the generated SDK functions that back it.
 *
 * This is the single place that knows "resource name → endpoint → DTO". Adding
 * a resource is one typed entry; the data provider stays generic. `unwrap` is
 * applied here so callers receive plain, fully-typed promises.
 *
 * Request-side casts (`query`/`body`) are the only casts: filter field names
 * and Refine's `variables` are dynamic at runtime, so they're asserted into the
 * endpoint's typed shape. Responses stay fully typed — backend drift surfaces
 * here at compile time, not via scattered `as any`.
 */
import {
  adminIcsFormsGetFormDetail,
  adminIcsFormsGetFormsList,
  adminIcsFormsUpdateForm,
  adminIdvtcFormsGetFormDetail,
  adminIdvtcFormsGetFormsList,
  adminIdvtcFormsUpdateForm,
  adminUsersCreateUser,
  adminUsersGetUserDetail,
  adminUsersGetUsersList,
  adminUsersUpdateUser,
} from "@/client/sdk.gen";
import type {
  AdminIcsFormsGetFormsListData,
  AdminIcsFormUpdateDto,
  AdminIdvtcFormsGetFormsListData,
  AdminIdvtcFormUpdateDto,
  AdminUserCreateDto,
  AdminUsersGetUsersListData,
  AdminUserUpdateDto,
  Pagination,
} from "@/client/types.gen";
import { unwrap } from "./apiClient";

type Id = string | number;
type Query = Record<string, unknown>;
type Body = Record<string, unknown>;

/** Shared envelope returned by every list endpoint. */
export interface ListEnvelope<TItem = unknown> {
  items: TItem[];
  pagination: Pagination;
}

export interface ResourceHandlers {
  list: (query: Query) => Promise<ListEnvelope>;
  getOne: (id: Id) => Promise<unknown>;
  update?: (id: Id, body: Body) => Promise<unknown>;
  create?: (body: Body) => Promise<unknown>;
}

const path = (value: Id) => ({ id: Number(value) });

export const RESOURCES: Record<string, ResourceHandlers> = {
  "ics-forms": {
    list: (query) =>
      unwrap(adminIcsFormsGetFormsList({ query: query as AdminIcsFormsGetFormsListData["query"] })),
    getOne: (id) => unwrap(adminIcsFormsGetFormDetail({ path: path(id) })),
    update: (id, body) =>
      unwrap(adminIcsFormsUpdateForm({ path: path(id), body: body as AdminIcsFormUpdateDto })),
  },
  "idvtc-forms": {
    list: (query) =>
      unwrap(adminIdvtcFormsGetFormsList({ query: query as AdminIdvtcFormsGetFormsListData["query"] })),
    getOne: (id) => unwrap(adminIdvtcFormsGetFormDetail({ path: path(id) })),
    update: (id, body) =>
      unwrap(adminIdvtcFormsUpdateForm({ path: path(id), body: body as AdminIdvtcFormUpdateDto })),
  },
  "admin-users": {
    list: (query) =>
      unwrap(adminUsersGetUsersList({ query: query as AdminUsersGetUsersListData["query"] })),
    getOne: (id) => unwrap(adminUsersGetUserDetail({ path: path(id) })),
    update: (id, body) =>
      unwrap(adminUsersUpdateUser({ path: path(id), body: body as AdminUserUpdateDto })),
    create: (body) => unwrap(adminUsersCreateUser({ body: body as AdminUserCreateDto })),
  },
};

/**
 * Public type surface for the app.
 *
 * Wire types (DTOs) are generated from the backend OpenAPI spec by
 * `@hey-api/openapi-ts` into `src/client/types.gen.ts` — never edit those by
 * hand. Re-pull the spec with `pnpm openapi:pull`, then regenerate with
 * `pnpm gen:api`.
 *
 * This module re-exports the generated types under the names the app uses and
 * adds the few frontend-only helper types that have no server counterpart.
 */
export type {
  // Auth
  AdminAuthPersonalSignDto,
  AdminAuthSignInDto,
  AdminAuthPayloadDto,
  // Shared
  Pagination,
  IcsFormStatus,
  // ICS forms
  IcsFormDataDto,
  IcsCommentsDto,
  IcsScoresDto,
  AdminIcsFormItemDto,
  AdminIcsFormListResponseDto,
  AdminIcsFormDetailDto,
  AdminIcsFormUpdateDto,
  // IDVTC forms
  IdvtcClusterMemberDataDto,
  IdvtcFormDataDto,
  IdvtcCommentsDto,
  AdminIdvtcFormItemDto,
  AdminIdvtcFormListResponseDto,
  AdminIdvtcFormDetailDto,
  AdminIdvtcFormUpdateDto,
  // Admin users
  AdminUserItemDto,
  AdminUserListResponseDto,
  AdminUserDetailDto,
  AdminUserCreateDto,
  AdminUserUpdateDto,
} from "@/client/types.gen";

import type { IcsFormStatus, IcsScoresDto } from "@/client/types.gen";

// Resource-agnostic status alias. ICS and IDVTC share the same status union.
export type FormStatus = IcsFormStatus;

// --- Frontend-only helper types (no server counterpart) -------------------

export interface IcsFormFilters {
  status?: IcsFormStatus;
  address?: string; // API: address (filters by main or additional addresses)
  issued?: boolean;
  outdated?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "id" | "createdAt" | "updatedAt" | "mainAddress" | "status" | "issued" | "outdated";
  sortOrder?: "asc" | "desc";
}

export interface IdvtcFormFilters {
  status?: FormStatus;
  address?: string;
  issued?: boolean;
  outdated?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "id" | "createdAt" | "updatedAt" | "mainAddress" | "status" | "issued" | "outdated";
  sortOrder?: "asc" | "desc";
}

export interface AdminUserFilters {
  role?: "VIEWER" | "REVIEWER" | "SUPERVISOR";
  active?: boolean;
  address?: string;
  name?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "id" | "address" | "name" | "role" | "active" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface TotalScore {
  total: number;
  breakdown: Record<keyof IcsScoresDto, number>;
}

// Identity type for authentication.
export interface AdminIdentity {
  id: number;
  name: string;
  address: string;
  role: "VIEWER" | "REVIEWER" | "SUPERVISOR";
  avatar: string;
}

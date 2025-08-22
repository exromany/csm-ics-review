// API Types based on OpenAPI schema from http://localhost:3003/admin/api-json

export interface AdminAuthPersonalSignDto {
  message: string;
  signature: string;
}

export interface AdminAuthSignInDto {
  access_token: string;
  token_type: string;
  role: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR';
}

export interface AdminAuthPayloadDto {
  address: string;
  adminId: number;
  role: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR';
}

export interface IcsFormDataDto {
  mainAddress: string;
  twitterLink?: string;
  discordLink?: string;
  additionalAddresses?: string[];
}

export interface IcsCommentsDto {
  reason?: string;
  mainAddress?: string;
  twitterLink?: string;
  discordLink?: string;
  additionalAddresses?: (string | null)[];
}

export interface IcsScoresDto {
  ethStaker?: number;
  stakeCat?: number;
  obolTechne?: number;
  ssvVerified?: number;
  csmTestnet?: number;
  csmMainnet?: number;
  sdvtTestnet?: number;
  sdvtMainnet?: number;
  humanPassport?: number;
  circles?: number;
  discord?: number;
  twitter?: number;
  aragonVotes?: number;
  snapshotVotes?: number;
  lidoGalxe?: number;
  highSignal?: number;
  gitPoaps?: number;
}

export type IcsFormStatus = 'REVIEW' | 'APPROVED' | 'REJECTED';

export interface AdminIcsFormItemDto {
  id: number;
  form: IcsFormDataDto;
  status: IcsFormStatus;
  comments: IcsCommentsDto;
  scores: IcsScoresDto;
  createdAt: string;
  updatedAt: string | null;
  issued: boolean;
  outdated: boolean;
  lastReviewer?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  itemCount: number;
  pageCount: number;
}

export interface AdminIcsFormListResponseDto {
  items: AdminIcsFormItemDto[];
  pagination: Pagination;
}

export type AdminIcsFormDetailDto = AdminIcsFormItemDto;

export interface AdminIcsFormUpdateDto {
  status: IcsFormStatus;
  comments?: IcsCommentsDto;
  scores?: IcsScoresDto;
  issued?: boolean;
}

// Utility types for frontend - using direct API field names
export interface IcsFormFilters {
  status?: IcsFormStatus;
  address?: string;      // API: address (filters by main or additional addresses)
  issued?: boolean;      // API: issued
  outdated?: boolean;    // API: outdated
  startDate?: string;    // API: startDate
  endDate?: string;      // API: endDate
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'createdAt' | 'updatedAt' | 'mainAddress' | 'status' | 'issued' | 'outdated';
  sortOrder?: 'asc' | 'desc';
}

export interface TotalScore {
  total: number;
  breakdown: Record<keyof IcsScoresDto, number>;
}

// Identity type for authentication
export interface AdminIdentity {
  id: number;
  name: string;
  address: string;
  role: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR';
  avatar: string;
}

// User management types
export interface AdminUserItemDto {
  id: number;
  address: string;
  role: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResponseDto {
  items: AdminUserItemDto[];
  pagination: Pagination;
}

export interface AdminUserDetailDto {
  id: number;
  address: string;
  role: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserCreateDto {
  address: string;
  role: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR';
  active: boolean;
}

// User filtering and sorting types - using direct API field names
export interface AdminUserFilters {
  role?: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR';  // API: role
  active?: boolean;                             // API: active
  address?: string;                             // API: address
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'address' | 'role' | 'active' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
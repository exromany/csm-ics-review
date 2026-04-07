# DVT Forms Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full admin panel support for DVT forms — list, detail/review, CSV export — alongside existing ICS forms.

**Architecture:** Shared small components (StatusBadge, AddressDisplay, badges), separate DVT pages. Data provider extended to handle `dvt-forms` resource. OtherFormsFromAddress generalized with props.

**Tech Stack:** React, TypeScript, Refine, shadcn/ui, Tailwind CSS, Vite

---

## File Map

### New files
- `src/components/ui/status-badge.tsx` — shared FormStatus badge
- `src/components/ui/address-display.tsx` — truncated address with tooltip
- `src/pages/dvt-forms/list.tsx` — DVT forms list page
- `src/pages/dvt-forms/detail.tsx` — DVT form detail/review page
- `src/pages/dvt-forms/index.ts` — barrel export

### Modified files
- `src/types/api.ts` — add DVT types, rename IcsFormStatus → FormStatus
- `src/providers/dataProvider.ts` — add dvt-forms resource support
- `src/config/tableConfig.ts` — add dvt-forms config
- `src/utils/csvExport.ts` — add DVT flatten/export functions
- `src/components/OtherFormsFromAddress.tsx` — generalize with resource/basePath/proofLabel props
- `src/components/menu/index.tsx` — add DVT Forms nav button
- `src/App.tsx` — add DVT resource and routes
- `src/pages/ics-forms/list.tsx` — use shared StatusBadge
- `src/pages/ics-forms/detail.tsx` — use shared StatusBadge, pass props to OtherFormsFromAddress

---

### Task 1: Add DVT Types

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: Rename IcsFormStatus to FormStatus and add DVT types**

Add after line 55 (`export type IcsFormStatus = ...`), rename and add DVT types. Keep `IcsFormStatus` as an alias for backwards compat during migration.

```typescript
// In src/types/api.ts

// Change line 55 from:
//   export type IcsFormStatus = 'REVIEW' | 'APPROVED' | 'REJECTED';
// To:
export type FormStatus = 'REVIEW' | 'APPROVED' | 'REJECTED';
export type IcsFormStatus = FormStatus;

// Add after AdminUserFilters (at end of file):

// DVT Form Types
export interface DvtClusterMemberDataDto {
  address: string;
  discordHandle?: string;
  telegramUsername?: string;
}

export interface DvtFormDataDto {
  mainAddress: string;
  discordLink: string;
  telegramUsername?: string;
  clusterMembers: DvtClusterMemberDataDto[];
}

export interface DvtCommentsDto {
  reason?: string;
  mainAddress?: string;
  discordLink?: string;
  telegramUsername?: string;
  clusterMembers?: (string | null)[];
}

export interface AdminDvtFormItemDto {
  id: number;
  form: DvtFormDataDto;
  status: FormStatus;
  comments: DvtCommentsDto;
  lastReviewer?: string | null;
  issued: boolean;
  outdated: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminDvtFormListResponseDto {
  items: AdminDvtFormItemDto[];
  pagination: Pagination;
}

export type AdminDvtFormDetailDto = AdminDvtFormItemDto;

export interface AdminDvtFormUpdateDto {
  status: FormStatus;
  comments?: DvtCommentsDto;
  issued?: boolean;
}

export interface DvtFormFilters {
  status?: FormStatus;
  address?: string;
  issued?: boolean;
  outdated?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'createdAt' | 'updatedAt' | 'mainAddress' | 'status' | 'issued' | 'outdated';
  sortOrder?: 'asc' | 'desc';
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (IcsFormStatus alias preserves backwards compat)

- [ ] **Step 3: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: add DVT form types to api.ts"
```

---

### Task 2: Update Data Provider for DVT Forms

**Files:**
- Modify: `src/providers/dataProvider.ts`

- [ ] **Step 1: Add dvt-forms to imports**

```typescript
// Add to imports at top of file:
import type {
  AdminIcsFormListResponseDto,
  AdminIcsFormUpdateDto,
  AdminDvtFormListResponseDto,
  AdminDvtFormUpdateDto,
  AdminUserListResponseDto,
  AdminUserCreateDto,
} from "../types/api";
```

- [ ] **Step 2: Update getList to support dvt-forms**

Replace lines 107-121 (the response handling section after the request):

```typescript
    // Handle different response types
    let responseData: AdminIcsFormListResponseDto | AdminDvtFormListResponseDto | AdminUserListResponseDto;

    if (resource === "ics-forms") {
      responseData = data as AdminIcsFormListResponseDto;
    } else if (resource === "dvt-forms") {
      responseData = data as AdminDvtFormListResponseDto;
    } else if (resource === "admin-users") {
      responseData = data as AdminUserListResponseDto;
    } else {
      throw new Error(`Resource ${resource} not supported`);
    }

    return {
      data: responseData.items as any,
      total: responseData.pagination.itemCount,
    };
```

- [ ] **Step 3: Update getOne to support dvt-forms**

Add after the ics-forms block (after line 133):

```typescript
    if (resource === "dvt-forms") {
      const { data } = await axiosInstance.request({
        method: "GET",
        url: `/admin/${resource}/${id}`,
      });

      return { data: data as any };
    }
```

- [ ] **Step 4: Update update to support dvt-forms**

Add after the ics-forms block (after line 157):

```typescript
    if (resource === "dvt-forms") {
      const { data } = await axiosInstance.request({
        method: "PATCH",
        url: `/admin/${resource}/${id}`,
        data: variables as AdminDvtFormUpdateDto,
      });

      return { data: data as any };
    }
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/providers/dataProvider.ts
git commit -m "feat: add dvt-forms resource to data provider"
```

---

### Task 3: Add DVT Table Config

**Files:**
- Modify: `src/config/tableConfig.ts`

- [ ] **Step 1: Add dvt-forms config entry**

Add after the `'admin-users'` entry in `tableConfigs`:

```typescript
  'dvt-forms': {
    filters: {
      status: 'select',
      address: 'text',
      issued: 'boolean',
      outdated: 'boolean',
      startDate: 'date',
      endDate: 'date'
    },
    sortableFields: ['id', 'createdAt', 'updatedAt', 'mainAddress', 'status', 'issued', 'outdated'],
    defaultSort: {
      field: 'createdAt',
      order: 'desc'
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/config/tableConfig.ts
git commit -m "feat: add dvt-forms table config"
```

---

### Task 4: Extract Shared StatusBadge Component

**Files:**
- Create: `src/components/ui/status-badge.tsx`
- Modify: `src/pages/ics-forms/list.tsx`
- Modify: `src/pages/ics-forms/detail.tsx`
- Modify: `src/components/OtherFormsFromAddress.tsx`

- [ ] **Step 1: Create shared StatusBadge**

Create `src/components/ui/status-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import type { FormStatus } from "../../types/api";

const variants = {
  REVIEW: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
} as const;

export const StatusBadge = ({ status }: { status: FormStatus }) => {
  return (
    <Badge variant={variants[status]} className="text-xs">
      {status}
    </Badge>
  );
};
```

- [ ] **Step 2: Update ICS list page to use shared StatusBadge**

In `src/pages/ics-forms/list.tsx`:
- Remove the local `StatusBadge` component (lines 67-79)
- Add import: `import { StatusBadge } from "../../components/ui/status-badge";`
- Update the `IcsFormStatus` import to also import `FormStatus` (or just use the existing `IcsFormStatus` which is now an alias)

- [ ] **Step 3: Update OtherFormsFromAddress to use shared StatusBadge**

In `src/components/OtherFormsFromAddress.tsx`:
- Remove the local `StatusBadge` component (lines 22-34)
- Add import: `import { StatusBadge } from "@/components/ui/status-badge";`

- [ ] **Step 4: Keep the detail page's richer StatusBadge as-is**

The detail page has a different, more elaborate `StatusBadge` with icons and gradients. Leave it as a local component — it serves a different visual purpose.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/status-badge.tsx src/pages/ics-forms/list.tsx src/components/OtherFormsFromAddress.tsx
git commit -m "refactor: extract shared StatusBadge component"
```

---

### Task 5: Extract Shared AddressDisplay Component

**Files:**
- Create: `src/components/ui/address-display.tsx`

- [ ] **Step 1: Create AddressDisplay component**

Create `src/components/ui/address-display.tsx`:

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";

interface AddressDisplayProps {
  address: string;
  etherscanLink?: boolean;
  className?: string;
}

export const AddressDisplay = ({
  address,
  etherscanLink = false,
  className = "max-w-[150px]",
}: AddressDisplayProps) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <code className="text-sm bg-muted px-2 py-1 rounded block truncate cursor-help">
            {address.slice(0, 8)}...{address.slice(-6)}
          </code>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{address}</p>
        </TooltipContent>
      </Tooltip>
      {etherscanLink && (
        <a
          href={`https://etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-6 h-6 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded transition-colors duration-200 shrink-0"
          title="View on Etherscan"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};

interface ReviewerDisplayProps {
  reviewer: string | null | undefined;
}

export const ReviewerDisplay = ({ reviewer }: ReviewerDisplayProps) => {
  if (!reviewer) return <span>—</span>;

  if (reviewer.startsWith("0x")) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <code className="text-xs block truncate cursor-help">
            {`${reviewer.slice(0, 6)}...${reviewer.slice(-4)}`}
          </code>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{reviewer}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <code className="text-xs block truncate">{reviewer}</code>;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/address-display.tsx
git commit -m "feat: add shared AddressDisplay and ReviewerDisplay components"
```

---

### Task 6: Generalize OtherFormsFromAddress

**Files:**
- Modify: `src/components/OtherFormsFromAddress.tsx`
- Modify: `src/pages/ics-forms/detail.tsx`

- [ ] **Step 1: Make OtherFormsFromAddress generic**

Rewrite `src/components/OtherFormsFromAddress.tsx` to accept configuration props:

```tsx
import { useList } from "@refinedev/core";
import { Link } from "react-router";
import { Archive, CheckCircle, Edit, Eye } from "lucide-react";
import type { FormStatus } from "../types/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { AddressDisplay, ReviewerDisplay } from "@/components/ui/address-display";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface FormItem {
  id: number;
  form: { mainAddress: string };
  status: FormStatus;
  lastReviewer?: string | null;
  issued: boolean;
  outdated: boolean;
  createdAt: string;
}

interface OtherFormsFromAddressProps {
  currentFormId: number;
  mainAddress: string;
  resource: string;
  basePath: string;
  proofLabel: string;
}

export const OtherFormsFromAddress = ({
  currentFormId,
  mainAddress,
  resource,
  basePath,
  proofLabel,
}: OtherFormsFromAddressProps) => {
  const { data, isLoading } = useList<FormItem>({
    resource,
    filters: [
      {
        field: "address",
        operator: "eq",
        value: mainAddress,
      },
    ],
    pagination: {
      current: 1,
      pageSize: 100,
    },
    sorters: [
      {
        field: "id",
        order: "desc",
      },
    ],
  });

  const otherForms =
    data?.data?.filter((form) => form.id !== currentFormId) || [];

  if (!isLoading && otherForms.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Other Forms from Same Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Main Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{proofLabel}</TableHead>
                    <TableHead>Outdated</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Last Reviewer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Other Forms with Same Address
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({otherForms.length} {otherForms.length === 1 ? "form" : "forms"})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Main Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{proofLabel}</TableHead>
                  <TableHead>Outdated</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Last Reviewer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">#{form.id}</TableCell>
                    <TableCell className="max-w-[150px]">
                      <AddressDisplay address={form.form.mainAddress} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={form.status} />
                    </TableCell>
                    <TableCell>
                      {form.issued ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Issued
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Not Issued
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {form.outdated ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-200 text-amber-700 bg-amber-50"
                        >
                          <Archive className="w-3 h-3 mr-1" />
                          Outdated
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[120px]">
                      <ReviewerDisplay reviewer={form.lastReviewer} />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`${basePath}/${form.id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
                        title={
                          form.issued
                            ? `View form with issued ${proofLabel}`
                            : form.outdated
                            ? "View outdated form"
                            : "Review form"
                        }
                      >
                        {form.issued || form.outdated ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-1" />
                            Review
                          </>
                        )}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

- [ ] **Step 2: Update ICS detail page usage**

In `src/pages/ics-forms/detail.tsx`, find the `<OtherFormsFromAddress` usage (around line 754) and update:

```tsx
        <OtherFormsFromAddress
          currentFormId={form.id}
          mainAddress={form.form.mainAddress}
          resource="ics-forms"
          basePath="/forms"
          proofLabel="ICS Proof"
        />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/OtherFormsFromAddress.tsx src/pages/ics-forms/detail.tsx
git commit -m "refactor: generalize OtherFormsFromAddress for multiple form types"
```

---

### Task 7: Add DVT CSV Export

**Files:**
- Modify: `src/utils/csvExport.ts`

- [ ] **Step 1: Add DVT flatten and export functions**

Add to `src/utils/csvExport.ts` after the existing code:

```typescript
import type { AdminIcsFormItemDto, IcsFormFilters, AdminDvtFormItemDto, DvtFormFilters } from '../types/api';

// (keep existing FlattenedIcsForm, flattenIcsForm, generateCsvContent, generateFilename, downloadCsv as-is)

export interface FlattenedDvtForm {
  id: number;

  // Form data
  mainAddress: string;
  discordLink: string;
  telegramUsername: string;
  clusterMember1Address: string;
  clusterMember1Discord: string;
  clusterMember1Telegram: string;
  clusterMember2Address: string;
  clusterMember2Discord: string;
  clusterMember2Telegram: string;
  clusterMember3Address: string;
  clusterMember3Discord: string;
  clusterMember3Telegram: string;
  clusterMember4Address: string;
  clusterMember4Discord: string;
  clusterMember4Telegram: string;

  // Status and metadata
  status: string;
  issued: boolean;
  outdated: boolean;
  createdAt: string;
  updatedAt: string | null;
  lastReviewer: string;

  // Comments
  reasonComment: string;
  mainAddressComment: string;
  discordLinkComment: string;
  telegramUsernameComment: string;
  clusterMember1Comment: string;
  clusterMember2Comment: string;
  clusterMember3Comment: string;
  clusterMember4Comment: string;
}

export const flattenDvtForm = (form: AdminDvtFormItemDto): FlattenedDvtForm => {
  const members = form.form.clusterMembers || [];
  const memberComments = form.comments.clusterMembers || [];

  return {
    id: form.id,

    mainAddress: form.form.mainAddress,
    discordLink: form.form.discordLink || '',
    telegramUsername: form.form.telegramUsername || '',
    clusterMember1Address: members[0]?.address || '',
    clusterMember1Discord: members[0]?.discordHandle || '',
    clusterMember1Telegram: members[0]?.telegramUsername || '',
    clusterMember2Address: members[1]?.address || '',
    clusterMember2Discord: members[1]?.discordHandle || '',
    clusterMember2Telegram: members[1]?.telegramUsername || '',
    clusterMember3Address: members[2]?.address || '',
    clusterMember3Discord: members[2]?.discordHandle || '',
    clusterMember3Telegram: members[2]?.telegramUsername || '',
    clusterMember4Address: members[3]?.address || '',
    clusterMember4Discord: members[3]?.discordHandle || '',
    clusterMember4Telegram: members[3]?.telegramUsername || '',

    status: form.status,
    issued: form.issued,
    outdated: form.outdated,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt || '',
    lastReviewer: form.lastReviewer || '',

    reasonComment: form.comments.reason || '',
    mainAddressComment: form.comments.mainAddress || '',
    discordLinkComment: form.comments.discordLink || '',
    telegramUsernameComment: form.comments.telegramUsername || '',
    clusterMember1Comment: memberComments[0] || '',
    clusterMember2Comment: memberComments[1] || '',
    clusterMember3Comment: memberComments[2] || '',
    clusterMember4Comment: memberComments[3] || '',
  };
};

export const generateDvtCsvContent = (forms: AdminDvtFormItemDto[]): string => {
  if (forms.length === 0) return '';

  const flattenedForms = forms.map(flattenDvtForm);
  const headers = Object.keys(flattenedForms[0]);

  const headerRow = headers.join(',');

  const dataRows = flattenedForms.map(form => {
    return headers.map(header => {
      const value = form[header as keyof FlattenedDvtForm];

      if (value === null || value === undefined) {
        return '';
      }

      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

export const generateDvtFilename = (filters: DvtFormFilters): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];

  const filterParts: string[] = [];

  if (filters.status) {
    filterParts.push(filters.status.toLowerCase());
  }

  if (typeof filters.issued === 'boolean') {
    filterParts.push(filters.issued ? 'issued' : 'not-issued');
  }

  if (typeof filters.outdated === 'boolean') {
    filterParts.push(filters.outdated ? 'outdated' : 'current');
  }

  if (filters.address) {
    filterParts.push(`addr-${filters.address.slice(0, 6)}`);
  }

  if (filters.startDate || filters.endDate) {
    if (filters.startDate && filters.endDate) {
      filterParts.push(`${filters.startDate}-to-${filters.endDate}`);
    } else if (filters.startDate) {
      filterParts.push(`from-${filters.startDate}`);
    } else if (filters.endDate) {
      filterParts.push(`until-${filters.endDate}`);
    }
  }

  const filterString = filterParts.length > 0 ? `-${filterParts.join('-')}` : '';

  return `dvt-forms${filterString}-${date}.csv`;
};
```

- [ ] **Step 2: Update the import at the top of csvExport.ts**

Replace the existing import:

```typescript
import type { AdminIcsFormItemDto, IcsFormFilters, AdminDvtFormItemDto, DvtFormFilters } from '../types/api';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/utils/csvExport.ts
git commit -m "feat: add DVT form CSV export functions"
```

---

### Task 8: Create DVT Forms List Page

**Files:**
- Create: `src/pages/dvt-forms/list.tsx`
- Create: `src/pages/dvt-forms/index.ts`

- [ ] **Step 1: Create barrel export**

Create `src/pages/dvt-forms/index.ts`:

```typescript
export { DvtFormsList } from "./list";
export { DvtFormDetail } from "./detail";
```

- [ ] **Step 2: Create DVT forms list page**

Create `src/pages/dvt-forms/list.tsx`. This follows the same pattern as `src/pages/ics-forms/list.tsx` but adapted for DVT:

```tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "../../components/ui/status-badge";
import { useDataProvider, useList } from "@refinedev/core";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  RotateCcw,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { usePersistentTableState } from "../../hooks/usePersistentTableState";
import { useTableFilters } from "../../hooks/useTableFilters";
import type { AdminDvtFormItemDto, FormStatus } from "../../types/api";
import {
  downloadCsv,
  generateDvtCsvContent,
  generateDvtFilename,
} from "../../utils/csvExport";

const getPageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible = 7
) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const sidePages = Math.floor((maxVisible - 3) / 2);

  if (currentPage <= sidePages + 2) {
    for (let i = 1; i <= sidePages + 2; i++) {
      pages.push(i);
    }
    if (sidePages + 3 < totalPages) {
      pages.push("ellipsis");
    }
    pages.push(totalPages);
  } else if (currentPage >= totalPages - sidePages - 1) {
    pages.push(1);
    if (totalPages - sidePages - 2 > 1) {
      pages.push("ellipsis");
    }
    for (let i = totalPages - sidePages - 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (currentPage - sidePages > 2) {
      pages.push("ellipsis");
    }
    for (let i = currentPage - sidePages; i <= currentPage + sidePages; i++) {
      pages.push(i);
    }
    if (currentPage + sidePages < totalPages - 1) {
      pages.push("ellipsis");
    }
    pages.push(totalPages);
  }

  return pages;
};

export const DvtFormsList = () => {
  const dataProvider = useDataProvider();
  const { buildFilters, hasActiveFilters } = useTableFilters();

  const {
    filterValues,
    sortField,
    sortOrder,
    currentPage,
    pageSize,
    updateFilterValues,
    updateSorting,
    updateCurrentPage,
    updatePageSize,
    resetTableState,
  } = usePersistentTableState("csm-dvt-table-state");

  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useList<AdminDvtFormItemDto>({
    resource: "dvt-forms",
    pagination: {
      current: currentPage,
      pageSize,
    },
    filters: buildFilters(filterValues),
    sorters: [
      {
        field: sortField,
        order: sortOrder,
      },
    ],
  });

  const handleStatusFilter = (status?: FormStatus) => {
    updateFilterValues((prev) => ({ ...prev, status }));
  };

  const handleAddressSearch = (address: string) => {
    updateFilterValues((prev) => ({ ...prev, address }));
  };

  const handleIssuedFilter = (issued?: boolean) => {
    updateFilterValues((prev) => ({ ...prev, issued }));
  };

  const handleOutdatedFilter = (outdated?: boolean) => {
    updateFilterValues((prev) => ({ ...prev, outdated }));
  };

  const handleDateRangeFilter = (startDate: string, endDate: string) => {
    updateFilterValues((prev) => ({ ...prev, startDate, endDate }));
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      updateSorting(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      updateSorting(field, "asc");
    }
  };

  const clearFilters = () => {
    resetTableState();
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const newSize = parseInt(newPageSize);
    updatePageSize(newSize);
  };

  const handleCsvExport = async () => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      const exportFilters = buildFilters(filterValues);

      const exportData = await dataProvider().getList<AdminDvtFormItemDto>({
        resource: "dvt-forms",
        pagination: {
          current: 1,
          pageSize: 9999,
        },
        filters: exportFilters,
        sorters: [
          {
            field: sortField,
            order: sortOrder,
          },
        ],
      });

      const csvContent = generateDvtCsvContent(exportData.data);

      const filename = generateDvtFilename({
        status: filterValues.status as FormStatus,
        address: filterValues.address as string,
        issued: filterValues.issued as boolean,
        outdated: filterValues.outdated as boolean,
        startDate: filterValues.startDate as string,
        endDate: filterValues.endDate as string,
      });

      downloadCsv(csvContent, filename);
    } catch (error) {
      console.error("CSV export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.ceil((data?.total || 0) / pageSize);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DVT Forms Review</h1>
        <p className="text-muted-foreground">
          Review and manage Distributed Validator Technology form submissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters & Search
              </CardTitle>
              <CardDescription>
                Filter DVT forms by multiple criteria
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCsvExport}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Download CSV"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                title="Reset all filters, sorting, and pagination to defaults"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!filterValues.status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter()}
                  className="text-xs"
                >
                  All
                </Button>
                {["REVIEW", "APPROVED", "REJECTED"].map((status) => (
                  <Button
                    key={status}
                    variant={
                      filterValues.status === status ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusFilter(status as FormStatus)}
                    className="text-xs"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Issued Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">DVT Proof Status</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    typeof filterValues.issued === "undefined"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleIssuedFilter(undefined)}
                  className="text-xs"
                >
                  All
                </Button>
                <Button
                  variant={filterValues.issued === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleIssuedFilter(true)}
                  className="text-xs"
                >
                  Issued
                </Button>
                <Button
                  variant={
                    filterValues.issued === false ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleIssuedFilter(false)}
                  className="text-xs"
                >
                  Not Issued
                </Button>
              </div>
            </div>

            {/* Outdated Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Form Status</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    typeof filterValues.outdated === "undefined"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleOutdatedFilter(undefined)}
                  className="text-xs"
                >
                  All
                </Button>
                <Button
                  variant={
                    filterValues.outdated === false ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleOutdatedFilter(false)}
                  className="text-xs"
                >
                  Current
                </Button>
                <Button
                  variant={
                    filterValues.outdated === true ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleOutdatedFilter(true)}
                  className="text-xs"
                >
                  Outdated
                </Button>
              </div>
            </div>

            {/* Address Search */}
            <div className="space-y-2">
              <label htmlFor="dvt-address-search" className="text-sm font-medium">
                Search by Address
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dvt-address-search"
                  type="text"
                  placeholder="0x..."
                  value={(filterValues.address as string) || ""}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Submission Date Range
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  value={(filterValues.startDate as string) || ""}
                  onChange={(e) =>
                    handleDateRangeFilter(
                      e.target.value,
                      filterValues.endDate as string
                    )
                  }
                  placeholder="Start Date"
                  className="text-xs min-w-0"
                />
                <Input
                  type="date"
                  value={(filterValues.endDate as string) || ""}
                  onChange={(e) =>
                    handleDateRangeFilter(
                      filterValues.startDate as string,
                      e.target.value
                    )
                  }
                  placeholder="End Date"
                  className="text-xs min-w-0"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            DVT Forms ({data?.total || 0})
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading DVT forms..."
              : `${data?.data?.length || 0} DVT forms displayed`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Main Address</TableHead>
                      <TableHead>Cluster Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>DVT Proof</TableHead>
                      <TableHead>Outdated</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Last Reviewer</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("id")} className="h-auto p-0 font-semibold hover:bg-transparent">
                          ID
                          {sortField === "id" && (sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                          {sortField !== "id" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("mainAddress")} className="h-auto p-0 font-semibold hover:bg-transparent">
                          Main Address
                          {sortField === "mainAddress" && (sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                          {sortField !== "mainAddress" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>Cluster Members</TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("status")} className="h-auto p-0 font-semibold hover:bg-transparent">
                          Status
                          {sortField === "status" && (sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                          {sortField !== "status" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("issued")} className="h-auto p-0 font-semibold hover:bg-transparent">
                          DVT Proof
                          {sortField === "issued" && (sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                          {sortField !== "issued" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("outdated")} className="h-auto p-0 font-semibold hover:bg-transparent">
                          Outdated
                          {sortField === "outdated" && (sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                          {sortField !== "outdated" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("createdAt")} className="h-auto p-0 font-semibold hover:bg-transparent">
                          Submitted
                          {sortField === "createdAt" && (sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />)}
                          {sortField !== "createdAt" && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                        </Button>
                      </TableHead>
                      <TableHead>Last Reviewer</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data?.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">#{form.id}</TableCell>
                        <TableCell className="max-w-[150px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <code className="text-sm bg-muted px-2 py-1 rounded block truncate cursor-help">
                                {form.form.mainAddress.slice(0, 8)}...
                                {form.form.mainAddress.slice(-6)}
                              </code>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">
                                {form.form.mainAddress}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="text-xs cursor-help">
                                {form.form.clusterMembers?.length || 0} members
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                {form.form.clusterMembers?.map((member, i) => (
                                  <p key={i} className="font-mono text-xs">
                                    {member.address.slice(0, 8)}...{member.address.slice(-6)}
                                  </p>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={form.status} />
                        </TableCell>
                        <TableCell>
                          {form.issued ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Issued
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Not Issued
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {form.outdated ? (
                            <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                              <Archive className="w-3 h-3 mr-1" />
                              Outdated
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(form.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[120px]">
                          {form.lastReviewer ? (
                            form.lastReviewer.startsWith("0x") ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <code className="text-xs block truncate cursor-help">
                                    {`${form.lastReviewer.slice(0, 6)}...${form.lastReviewer.slice(-4)}`}
                                  </code>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono text-xs">{form.lastReviewer}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <code className="text-xs block truncate">{form.lastReviewer}</code>
                            )
                          ) : (
                            <span>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/dvt-forms/${form.id}`}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
                            title={
                              form.issued
                                ? "View form with issued DVT Proof"
                                : form.outdated
                                ? "View outdated form"
                                : "Review DVT form"
                            }
                          >
                            {form.issued || form.outdated ? (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </>
                            ) : (
                              <>
                                <Edit className="h-4 w-4 mr-1" />
                                Review
                              </>
                            )}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          {data?.total && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {Math.min((currentPage - 1) * pageSize + 1, data.total)} to{" "}
                  {Math.min(currentPage * pageSize, data.total)} of {data.total}{" "}
                  results
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {data.total > pageSize && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => updateCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {pageNumbers.map((pageNum, index) => (
                      <PaginationItem key={index}>
                        {pageNum === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => updateCurrentPage(pageNum)}
                            isActive={pageNum === currentPage}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => updateCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && (!data?.data || data.data.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No DVT forms found</h3>
            <p className="text-muted-foreground text-center">
              {hasActiveFilters(filterValues)
                ? "Try adjusting your filters to see more results."
                : "No DVT forms have been submitted yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/dvt-forms/
git commit -m "feat: add DVT forms list page"
```

---

### Task 9: Create DVT Forms Detail Page

**Files:**
- Create: `src/pages/dvt-forms/detail.tsx`

- [ ] **Step 1: Create DVT form detail page**

Create `src/pages/dvt-forms/detail.tsx`:

```tsx
import {
  useOne,
  useUpdate,
  useNavigation,
  useGetIdentity,
} from "@refinedev/core";
import { useParams } from "react-router";
import { useState } from "react";
import React from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  User,
  Globe,
  ExternalLink,
  Clock,
  CircleCheck,
  CircleX,
  Save,
  Loader2,
  AlertTriangle,
  Eye,
  Shield,
  Archive,
  Users,
  MessageSquare,
  Send,
} from "lucide-react";
import type {
  AdminDvtFormDetailDto,
  FormStatus,
  DvtCommentsDto,
  AdminIdentity,
} from "../../types/api";
import { OtherFormsFromAddress } from "../../components/OtherFormsFromAddress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DetailStatusBadge = ({ status }: { status: FormStatus }) => {
  const statusConfig = {
    REVIEW: {
      variant: "secondary" as const,
      className:
        "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold px-3 py-1.5 shadow-sm",
      Icon: Clock,
    },
    APPROVED: {
      variant: "default" as const,
      className:
        "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 font-semibold px-3 py-1.5 shadow-sm",
      Icon: CircleCheck,
    },
    REJECTED: {
      variant: "destructive" as const,
      className:
        "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700 font-semibold px-3 py-1.5 shadow-sm",
      Icon: CircleX,
    },
  } as const;

  const config = statusConfig[status];
  const IconComponent = config.Icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <IconComponent className="w-4 h-4 mr-1.5" />
      {status}
    </Badge>
  );
};

export const DvtFormDetail = () => {
  const { id } = useParams();
  const { list } = useNavigation();
  const { mutate: updateForm, status: updateStatus } = useUpdate();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const isUpdating = updateStatus === "loading";

  const { data, isLoading } = useOne<AdminDvtFormDetailDto>({
    resource: "dvt-forms",
    id: id as string,
  });

  const isSupervisor = identity?.role === "SUPERVISOR";
  const isViewer = identity?.role === "VIEWER";
  const isFormIssued = data?.data?.issued ?? false;
  const isFormOutdated = data?.data?.outdated ?? false;
  const isReadOnly = isSupervisor || isViewer || isFormIssued || isFormOutdated;

  const [status, setStatus] = useState<FormStatus>();
  const [comments, setComments] = useState<DvtCommentsDto>({});
  const [issued, setIssued] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    if (data?.data) {
      setStatus(data.data.status);
      setComments(data.data.comments);
      setIssued(data.data.issued);
    }
  }, [data?.data]);

  const handleStatusChange = (newStatus: FormStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleCommentChange = (field: keyof DvtCommentsDto, value: string) => {
    setComments((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleClusterMemberCommentChange = (index: number, value: string) => {
    setComments((prev) => {
      const clusterMembers = prev.clusterMembers
        ? [...prev.clusterMembers]
        : [];
      clusterMembers[index] = value;
      return { ...prev, clusterMembers };
    });
    setHasChanges(true);
  };

  const handleIssuedChange = (value: boolean) => {
    setIssued(value);
    setHasChanges(true);
  };

  const handleSubmit = () => {
    if (!id || !status) return;

    updateForm(
      {
        resource: "dvt-forms",
        id: parseInt(id),
        values: {
          status,
          comments,
          issued,
        },
      },
      {
        onSuccess: () => {
          setHasChanges(false);
          toast.success("DVT form review updated successfully");
          setTimeout(() => {
            list("dvt-forms");
          }, 1000);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="space-y-8">
            <Skeleton className="h-4 w-48" />
            <Card>
              <CardHeader className="pb-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex space-x-3">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              </CardHeader>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/30 dark:to-indigo-900/50 flex items-center justify-center">
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl shadow-slate-200/60 ring-1 ring-slate-200/60 max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                DVT Form Not Found
              </h3>
              <p className="text-slate-600">
                The requested DVT form could not be found or may have been
                removed.
              </p>
            </div>
            <Button
              onClick={() => list("dvt-forms")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to DVT Forms List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = data.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={() => list("dvt-forms")}
              >
                DVT Forms
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Form #{form.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div>
                  <CardTitle className="text-3xl font-bold">
                    DVT Form Review
                  </CardTitle>
                  <div className="text-lg font-semibold text-muted-foreground mt-1">
                    #{form.id}
                  </div>
                </div>
                <CardDescription className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      Submitted on{" "}
                      {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {form.lastReviewer && (
                    <div className="flex items-center space-x-2">
                      <span>
                        Last reviewed by:{" "}
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {form.lastReviewer.startsWith("0x")
                            ? `${form.lastReviewer.slice(0, 8)}...${form.lastReviewer.slice(-6)}`
                            : form.lastReviewer}
                        </code>
                      </span>
                    </div>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {form.outdated && (
                    <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                      <Archive className="w-3 h-3 mr-1" />
                      Outdated
                    </Badge>
                  )}
                  {form.status === "APPROVED" && form.issued && (
                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Issued
                    </Badge>
                  )}
                  <DetailStatusBadge status={form.status} />
                </div>
                <Button variant="outline" onClick={() => list("dvt-forms")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Submitted DVT Form Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 text-primary mr-3" />
              Submitted DVT Form Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Column - Form Fields */}
              <div className="space-y-6">
                <div className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-4">
                  Form Field Data
                </div>

                {/* Main Address */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    Main Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm text-foreground bg-muted px-3 py-2 rounded-lg flex-1 break-all">
                      {form.form.mainAddress}
                    </p>
                    <a
                      href={`https://etherscan.io/address/${form.form.mainAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-colors duration-200"
                      title="View on Etherscan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Discord Link */}
                <div className="space-y-3 border-t border-slate-200/50 pt-4">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Discord Link
                  </label>
                  <a
                    href={form.form.discordLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center bg-muted px-3 py-2 rounded-lg break-all"
                  >
                    <span className="truncate max-w-xs">
                      {form.form.discordLink.length > 50
                        ? `${form.form.discordLink.substring(0, 50)}...`
                        : form.form.discordLink}
                    </span>
                    <ExternalLink className="w-3 h-3 ml-1 shrink-0" />
                  </a>
                </div>

                {/* Telegram Username */}
                {form.form.telegramUsername && (
                  <div className="space-y-3 border-t border-slate-200/50 pt-4">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center">
                      <Send className="w-3 h-3 mr-1" />
                      Telegram Username
                    </label>
                    <p className="text-sm bg-muted px-3 py-2 rounded-lg">
                      {form.form.telegramUsername}
                    </p>
                  </div>
                )}

                {/* Cluster Members */}
                <div className="border-t border-slate-200/50 pt-4">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center mb-3">
                    <Users className="w-3 h-3 mr-1" />
                    Cluster Members
                    <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                      {form.form.clusterMembers.length}
                    </span>
                  </label>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Discord</TableHead>
                          <TableHead>Telegram</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.form.clusterMembers.map((member, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <code className="text-xs font-mono break-all">
                                  {member.address}
                                </code>
                                <a
                                  href={`https://etherscan.io/address/${member.address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-5 h-5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded transition-colors duration-200 shrink-0"
                                  title="View on Etherscan"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {member.discordHandle || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {member.telegramUsername || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Right Column - Comments */}
              <div className="space-y-6">
                <div className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-4">
                  Related Comments
                </div>

                {/* Main Address Comment */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    Main Address Comment
                  </Label>
                  <Input
                    value={comments.mainAddress || ""}
                    onChange={(e) => handleCommentChange("mainAddress", e.target.value)}
                    placeholder="Add comment to main address"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Discord Comment */}
                <div className="space-y-3 border-t border-border pt-4">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Discord Link Comment
                  </Label>
                  <Input
                    value={comments.discordLink || ""}
                    onChange={(e) => handleCommentChange("discordLink", e.target.value)}
                    placeholder="Add comment to Discord link"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Telegram Comment */}
                {form.form.telegramUsername && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                      <Send className="w-3 h-3 mr-1" />
                      Telegram Comment
                    </Label>
                    <Input
                      value={comments.telegramUsername || ""}
                      onChange={(e) => handleCommentChange("telegramUsername", e.target.value)}
                      placeholder="Add comment to Telegram username"
                      readOnly={isReadOnly}
                      disabled={isReadOnly}
                    />
                  </div>
                )}

                {/* Cluster Member Comments */}
                <div className="border-t border-slate-200/50 pt-4">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center mb-3">
                    <Users className="w-3 h-3 mr-1" />
                    Cluster Member Comments
                  </label>
                  <div className="space-y-3">
                    {form.form.clusterMembers.map((member, index) => (
                      <div key={index} className="bg-muted/50 rounded-lg p-3">
                        <div className="mb-2">
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                            Member #{index + 1} Comment
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({member.address.slice(0, 8)}...{member.address.slice(-4)})
                          </span>
                        </div>
                        <Input
                          value={comments.clusterMembers?.[index] || ""}
                          onChange={(e) => handleClusterMemberCommentChange(index, e.target.value)}
                          placeholder={`Add comment for member ${index + 1}`}
                          readOnly={isReadOnly}
                          disabled={isReadOnly}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other DVT Forms from Same Address */}
        <OtherFormsFromAddress
          currentFormId={form.id}
          mainAddress={form.form.mainAddress}
          resource="dvt-forms"
          basePath="/dvt-forms"
          proofLabel="DVT Proof"
        />

        {/* Save Review Block */}
        <Card>
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold mb-2">
              Save Review
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {/* Review Status Selection */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-6 text-center">
                Review Decision
              </h3>
              <div className="flex justify-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={status === "REVIEW" ? "default" : "outline"}
                        size="lg"
                        onClick={() => handleStatusChange("REVIEW")}
                        disabled={isReadOnly}
                        className={`h-auto flex flex-col gap-2 px-8 py-5 ${
                          status === "REVIEW"
                            ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                            : "hover:border-amber-200 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/30"
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                        <div className="text-center">
                          <div className="font-semibold">Under Review</div>
                          <div className="text-xs opacity-75 mt-0.5">Pending decision</div>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Mark as under review</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={status === "APPROVED" ? "default" : "outline"}
                        size="lg"
                        onClick={() => handleStatusChange("APPROVED")}
                        disabled={isReadOnly}
                        className={`h-auto flex flex-col gap-2 px-8 py-5 ${
                          status === "APPROVED"
                            ? "bg-green-600 hover:bg-green-700 border-green-600 text-white"
                            : "hover:border-green-200 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-900/30"
                        }`}
                      >
                        <CircleCheck className="w-5 h-5" />
                        <div className="text-center">
                          <div className="font-semibold">Approved</div>
                          <div className="text-xs opacity-75 mt-0.5">Accept form</div>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Approve this submission</p></TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={status === "REJECTED" ? "default" : "outline"}
                        size="lg"
                        onClick={() => handleStatusChange("REJECTED")}
                        disabled={isReadOnly}
                        className={`h-auto flex flex-col gap-2 px-8 py-5 ${
                          status === "REJECTED"
                            ? "bg-red-600 hover:bg-red-700 border-red-600 text-white"
                            : "hover:border-red-200 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-900/30"
                        }`}
                      >
                        <CircleX className="w-5 h-5" />
                        <div className="text-center">
                          <div className="font-semibold">Rejected</div>
                          <div className="text-xs opacity-75 mt-0.5">Decline form</div>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Reject this submission</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* DVT Proof Issued toggle */}
            {status === "APPROVED" && !isReadOnly && (
              <>
                <Separator className="my-8" />
                <div className="mt-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className={`w-5 h-5 ${issued ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`} />
                      <div>
                        <label htmlFor="dvt-issued-switch" className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                          DVT Proof issued
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Form will be read-only after DVT Proof is issued
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="dvt-issued-switch"
                      checked={issued}
                      onCheckedChange={handleIssuedChange}
                      disabled={isFormIssued}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Rejection Reason */}
            {status === "REJECTED" && (
              <>
                <Separator className="my-8" />
                <div className="space-y-4">
                  <Label className="text-sm font-semibold flex items-center">
                    <CircleX className="w-4 h-4 text-red-500 mr-2" />
                    Rejection Reason
                  </Label>
                  <Textarea
                    value={comments.reason || ""}
                    onChange={(e) => handleCommentChange("reason", e.target.value)}
                    placeholder="Please provide a clear reason for rejection"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                    className="min-h-20"
                  />
                </div>
              </>
            )}

            {/* Save Button */}
            {!isReadOnly && (
              <>
                <Separator className="my-8" />
                <div className="space-y-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isUpdating || !hasChanges}
                    className="w-full h-14 text-lg font-bold"
                    size="lg"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        <span>Saving Review...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-3" />
                        <span>Save Review</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => list("dvt-forms")}
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to List
                  </Button>

                  {hasChanges && (
                    <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/30">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm font-medium">
                        You have unsaved changes
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}

            {/* Read-only Notice */}
            {isReadOnly && (
              <div className="py-6 space-y-4">
                {isFormIssued ? (
                  <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-200">DVT Proof Issued</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      DVT Proof has been issued for this form and can no longer be edited.
                    </AlertDescription>
                  </Alert>
                ) : isFormOutdated ? (
                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30">
                    <Archive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200">Form Outdated</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      This form is outdated and has been replaced by a newer submission. It cannot be modified.
                    </AlertDescription>
                  </Alert>
                ) : isViewer ? (
                  <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30">
                    <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-800 dark:text-blue-200">View-Only Access</AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      Viewer role has read-only access to DVT form reviews.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30">
                    <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200">Read-Only Mode</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      Supervisor role has view-only access to DVT form reviews.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  variant="outline"
                  onClick={() => list("dvt-forms")}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Update barrel export to include detail**

The barrel export in `src/pages/dvt-forms/index.ts` already references `DvtFormDetail` from step 1 of Task 8.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/dvt-forms/detail.tsx
git commit -m "feat: add DVT forms detail/review page"
```

---

### Task 10: Wire Up Routing and Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/menu/index.tsx`

- [ ] **Step 1: Add DVT imports and resource to App.tsx**

Add import at top of `src/App.tsx`:

```typescript
import { DvtFormDetail } from "./pages/dvt-forms/detail";
import { DvtFormsList } from "./pages/dvt-forms/list";
```

Add new resource in the `resources` array (after the `ics-forms` resource):

```typescript
                {
                  name: "dvt-forms",
                  list: "/dvt-forms",
                  show: "/dvt-forms/:id",
                  meta: {
                    label: "DVT Forms",
                  },
                },
```

Add routes in the authenticated routes section (after the `/forms/:id` route):

```tsx
                          <Route path="/dvt-forms" element={<DvtFormsList />} />
                          <Route
                            path="/dvt-forms/:id"
                            element={<DvtFormDetail />}
                          />
```

- [ ] **Step 2: Add DVT Forms nav button to menu**

In `src/components/menu/index.tsx`, add `Network` to the lucide-react imports:

```typescript
import { LogOut, Users, FileText, Network } from "lucide-react";
```

Add DVT Forms button after the ICS Forms button (after line 40):

```tsx
              <Button
                variant="ghost"
                size="sm"
                onClick={() => list("dvt-forms")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Network className="w-4 h-4 mr-2" />
                DVT Forms
              </Button>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Verify dev server runs**

Run: `yarn dev`
Expected: App starts, DVT Forms appears in nav, clicking navigates to `/dvt-forms`

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/menu/index.tsx
git commit -m "feat: wire up DVT forms routing and navigation"
```

---

### Task 11: Verify End-to-End

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `npx eslint src --ext .ts,.tsx`
Expected: No new errors

- [ ] **Step 3: Build for production**

Run: `yarn build`
Expected: Build succeeds

- [ ] **Step 4: Manual verification checklist**

Run `yarn dev` and verify:
- DVT Forms appears in nav bar between ICS Forms and Users
- `/dvt-forms` shows list page with filters and table
- Clicking a DVT form navigates to `/dvt-forms/:id`
- Detail page shows cluster members table, comments, status controls
- Save review works (status + comments + issued)
- CSV export downloads correctly
- OtherFormsFromAddress shows for DVT forms
- ICS forms still work correctly (regression check)
- Read-only mode works for issued/outdated/viewer/supervisor

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```

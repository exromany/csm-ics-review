# DVT Forms Support — Design Spec

## Overview

Add full admin panel support for DVT (Distributed Validator Technology) forms alongside existing ICS forms. DVT forms follow a similar review workflow (REVIEW/APPROVED/REJECTED + issued/outdated) but have no scoring system and use a cluster-of-4-members model instead of additional addresses.

## Approach

**Shared small components, separate pages (Approach C).** Extract reusable UI pieces (StatusBadge, AddressDisplay, OtherForms, badges) into shared components. DVT and ICS pages remain independent — structurally different enough that a shared framework would be premature abstraction.

## API Contract

Backend already exposes DVT admin endpoints mirroring ICS:

| Endpoint | Method | Description |
|---|---|---|
| `/admin/dvt-forms` | GET | Paginated list with filters |
| `/admin/dvt-forms/{id}` | GET | Form detail |
| `/admin/dvt-forms/{id}` | PATCH | Update review |

### Key DTOs

```typescript
DvtClusterMemberDataDto {
  address: string
  discordHandle?: string
  telegramUsername?: string
}

DvtFormDataDto {
  mainAddress: string
  discordLink: string
  telegramUsername?: string
  clusterMembers: DvtClusterMemberDataDto[]  // exactly 4
}

DvtCommentsDto {
  reason?: string
  mainAddress?: string
  discordLink?: string
  telegramUsername?: string
  clusterMembers?: (string | null)[]  // per-member comments
}

AdminDvtFormItemDto {
  id: number
  form: DvtFormDataDto
  status: 'REVIEW' | 'APPROVED' | 'REJECTED'
  comments: DvtCommentsDto
  lastReviewer?: string | null
  issued: boolean
  outdated: boolean
  createdAt: string
  updatedAt: string | null
}

AdminDvtFormUpdateDto {
  status: 'REVIEW' | 'APPROVED' | 'REJECTED'
  comments?: DvtCommentsDto
  issued?: boolean
}
```

### Filters & Sorting

Identical to ICS: status, address (searches main + cluster member addresses), issued, outdated, startDate, endDate. Sortable by id, createdAt, updatedAt, mainAddress, status, issued, outdated.

## Types

Add to `src/types/api.ts`:
- `DvtClusterMemberDataDto`
- `DvtFormDataDto`
- `DvtCommentsDto`
- `AdminDvtFormItemDto`
- `AdminDvtFormUpdateDto`
- `AdminDvtFormListResponseDto` (items + pagination)
- `AdminDvtFormDetailDto` (same shape as item)
- Rename `IcsFormStatus` to `FormStatus` (shared) since DVT uses the same status enum

## Shared Components

### Extract from existing code

1. **`src/components/ui/status-badge.tsx`**
   - `StatusBadge({ status: FormStatus })` — REVIEW/APPROVED/REJECTED badge with color variants.
   - Currently duplicated in `OtherFormsFromAddress.tsx` and ICS list page.

2. **`src/components/ui/address-display.tsx`**
   - `AddressDisplay({ address, etherscanLink? })` — truncated address with tooltip showing full address.
   - Pattern repeated across list tables, detail pages, other forms table.

3. **`src/components/ui/issued-badge.tsx`** and **`src/components/ui/outdated-badge.tsx`**
   - Small badge components for issued/outdated status.
   - Used in both list pages and "other forms" tables.

4. **`src/components/OtherFormsFromAddress.tsx`** — generalize
   - Accept `resource: string` (e.g., `"ics-forms"` or `"dvt-forms"`)
   - Accept `basePath: string` (e.g., `"/forms"` or `"/dvt-forms"`)
   - Accept `proofLabel: string` (e.g., `"ICS Proof"` or `"DVT Proof"`)
   - Use shared badge components internally.
   - Generic type parameter for the form item DTO.

### What stays ICS-specific
- Scoring components (ScoreGroupCard, TotalScoreCard)
- Scoring config and utils
- Rejection suggestions
- Validation command copy buttons

## DVT Forms List Page

**File:** `src/pages/dvt-forms/list.tsx`

### Filters Card
Status (select), Address (text search), Issued (boolean), Outdated (boolean), Date Range (start/end date).

### Table Columns
| Column | Description |
|---|---|
| ID | Form ID, links to detail |
| Main Address | Truncated with tooltip, Etherscan link |
| Discord Link | Truncated, clickable |
| Cluster Members | Count (4) with tooltip listing truncated addresses |
| Status | StatusBadge component |
| Issued | IssuedBadge component |
| Outdated | OutdatedBadge component |
| Submitted | createdAt formatted date |
| Last Reviewer | Truncated address with tooltip |
| Actions | View (issued/outdated) or Review (active) |

### State Persistence
Separate localStorage key: `csm-dvt-table-state`

### CSV Export
`flattenDvtForm()` in `src/utils/csvExport.ts`:
- Flatten cluster members to indexed fields: `clusterMember1Address`, `clusterMember1Discord`, `clusterMember1Telegram`, ..., `clusterMember4Telegram`
- Include all comment fields similarly flattened
- Filename pattern: `dvt-forms-{filters}-{date}.csv`

## DVT Forms Detail Page

**File:** `src/pages/dvt-forms/detail.tsx`

### Section A: Form Data Display
- Main address with Etherscan link
- Discord link (clickable external link)
- Telegram username (if present)
- **Cluster Members table:** 4 rows showing:
  - Member index (1-4)
  - Address with Etherscan link
  - Discord handle
  - Telegram username

### Section B: Comments
- Main address comment (textarea)
- Discord link comment (textarea)
- Telegram username comment (textarea, shown if form has telegram)
- Per-cluster-member comments (4 textareas, labeled "Member 1" through "Member 4")
- All disabled when: issued, outdated, or role is VIEWER/SUPERVISOR

### Section C: Status & Save
- Three status buttons: REVIEW / APPROVED / REJECTED
- Issued toggle (only visible for APPROVED status, irreversible once set)
- Rejection reason (free-text textarea, shown when status is REJECTED)
- Save button (disabled if no changes detected)
- Read-only rules: issued OR outdated OR role VIEWER/SUPERVISOR

### Section D: Other DVT Forms
- `OtherFormsFromAddress` with `resource="dvt-forms"`, `basePath="/dvt-forms"`, `proofLabel="DVT Proof"`
- Shows only other DVT forms from the same main address

### Not included
- No scoring section
- No validation commands (deferred)
- No predefined rejection suggestions

## Routing & Navigation

### App.tsx
New Refine resource:
```typescript
{ name: "dvt-forms", list: "/dvt-forms", show: "/dvt-forms/:id" }
```

New routes:
- `/dvt-forms` → `DvtFormsList`
- `/dvt-forms/:id` → `DvtFormDetail`

### Menu
Add "DVT Forms" nav button between "ICS Forms" and "Users". Visible to all roles.

## What Does NOT Change
- Auth provider (SIWE)
- Data provider (already resource-generic)
- Theme/layout system
- Scoring system (ICS-only)
- Admin users management
- Wagmi/wallet configuration

## File Inventory

### New files
- `src/types/api.ts` — add DVT types (edit existing)
- `src/pages/dvt-forms/list.tsx`
- `src/pages/dvt-forms/detail.tsx`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/address-display.tsx`
- `src/components/ui/issued-badge.tsx`
- `src/components/ui/outdated-badge.tsx`

### Modified files
- `src/App.tsx` — add DVT resource and routes
- `src/components/menu/index.tsx` — add DVT Forms nav button
- `src/components/OtherFormsFromAddress.tsx` — generalize for both form types
- `src/config/tableConfig.ts` — add `dvt-forms` config entry
- `src/utils/csvExport.ts` — add DVT flattening and export
- `src/pages/ics-forms/list.tsx` — use shared StatusBadge/AddressDisplay
- `src/pages/ics-forms/detail.tsx` — use shared components, pass props to OtherForms

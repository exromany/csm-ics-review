import { useList, useNavigation, useGetIdentity } from "@refinedev/core";
import { Link } from "react-router";
import { Users, Plus, Shield, Pencil } from "lucide-react";
import type { AdminUserItemDto, AdminIdentity } from "../../types/api";
import { useTableFilters } from "../../hooks/useTableFilters";
import {
  usePersistentTableState,
  type TableState,
} from "../../hooks/usePersistentTableState";
import {
  AddressDisplay,
  Badge,
  Button,
  ColumnLabel,
  DataPagination,
  EmptyState,
  FilterToolbar,
  LoadingState,
  PageHeader,
  Panel,
  QueryErrorState,
  RoleBadge,
  SearchInput,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SortableHeader,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from "@/components/ui";

const StatusBadge = ({ active }: { active: boolean }) => (
  <StatusPill tone={active ? "emerald" : "neutral"}>
    {active ? "Active" : "Inactive"}
  </StatusPill>
);

type UserSortField = "id" | "address" | "name" | "role" | "active" | "createdAt";

const COLUMNS: { field: UserSortField; label: string }[] = [
  { field: "id", label: "ID" },
  { field: "address", label: "Address" },
  { field: "name", label: "Name" },
  { field: "role", label: "Role" },
  { field: "active", label: "Status" },
  { field: "createdAt", label: "Created" },
];

const STATUS_OPTIONS: { label: string; value: boolean | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

const DEFAULT_ADMIN_USERS_TABLE_STATE: TableState<UserSortField> = {
  filterValues: { role: undefined, active: undefined, address: "", name: "" },
  sortField: "createdAt",
  sortOrder: "desc",
  currentPage: 1,
  pageSize: 20,
};

export const AdminUsersList = () => {
  const { create, edit } = useNavigation();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const { buildFilters } = useTableFilters();
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
    hasStoredState,
  } = usePersistentTableState<UserSortField>(
    "csm-admin-users-table-state",
    DEFAULT_ADMIN_USERS_TABLE_STATE
  );

  const {
    result: data,
    query: { isLoading, isError, refetch, isFetching },
  } = useList<AdminUserItemDto>({
    resource: "admin-users",
    pagination: {
      currentPage,
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

  const handleRoleFilter = (role?: "VIEWER" | "REVIEWER" | "SUPERVISOR") => {
    updateFilterValues((prev) => ({ ...prev, role }));
  };

  const handleActiveFilter = (active?: boolean) => {
    updateFilterValues((prev) => ({ ...prev, active }));
  };

  const handleAddressSearch = (address: string) => {
    updateFilterValues((prev) => ({ ...prev, address }));
  };

  const handleNameSearch = (name: string) => {
    updateFilterValues((prev) => ({ ...prev, name }));
  };

  const handleSort = (field: UserSortField) => {
    if (sortField === field) {
      updateSorting(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      updateSorting(field, "asc");
    }
  };

  const clearFilters = () => {
    resetTableState();
  };

  const handlePageSizeChange = (newSize: number) => {
    updatePageSize(newSize);
  };

  // Show loading state while identity is being fetched
  if (identity === undefined) {
    return <LoadingState label="Loading…" />;
  }

  // Only show to supervisors
  if (identity?.role !== 'SUPERVISOR') {
    return (
      <div className="mx-auto max-w-md pt-10">
        <Panel className="p-8">
          <EmptyState
            tone="destructive"
            size="md"
            icon={Shield}
            title="Access restricted"
            description="Only supervisors can manage admin users."
          />
        </Panel>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const isEmpty = !isLoading && !isError && rows.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="User management"
        count={data?.total}
        description="Manage admin users and their roles across the CSM ICS system."
        actions={
          <Button onClick={() => create("admin-users")}>
            <Plus className="size-4" />
            Add user
          </Button>
        }
      />

      {/* Unified panel: toolbar → table → footer */}
      <Panel className="overflow-hidden">
        {/* Filter toolbar */}
        <FilterToolbar onReset={clearFilters} resetDisabled={!hasStoredState()}>
          <SearchInput
            id="name-search"
            type="text"
            aria-label="Search by name"
            placeholder="Search by name"
            value={(filterValues.name as string) || ""}
            onDebouncedChange={handleNameSearch}
            containerClassName="w-full sm:w-56"
          />
          <SearchInput
            mono
            id="address-search"
            type="text"
            aria-label="Search by address"
            placeholder="Search by address (0x…)"
            value={(filterValues.address as string) || ""}
            onDebouncedChange={handleAddressSearch}
            containerClassName="w-full sm:w-72"
          />
          <FilterToolbar.Filters>
            <Select
              value={(filterValues.role as string) || "all"}
              onValueChange={(value) =>
                handleRoleFilter(
                  value === "all"
                    ? undefined
                    : (value as "VIEWER" | "REVIEWER" | "SUPERVISOR")
                )
              }
            >
              <SelectTrigger aria-label="Filter by role" className="h-9 w-[148px]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
                <SelectItem value="REVIEWER">Reviewer</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
              </SelectContent>
            </Select>
            <SegmentedControl
              aria-label="Filter by status"
              options={STATUS_OPTIONS}
              value={filterValues.active as boolean | undefined}
              onChange={handleActiveFilter}
            />
          </FilterToolbar.Filters>
        </FilterToolbar>

        {/* Table */}
          <Table
            containerClassName="max-h-[70vh]"
            className="[&_td]:px-4 [&_td]:py-3 [&_th]:h-auto [&_th]:px-4 [&_th]:py-2.5"
          >
            <TableHeader sticky>
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((col) => (
                  <TableHead key={col.field}>
                    <SortableHeader
                      label={col.label}
                      active={sortField === col.field}
                      order={sortOrder}
                      onClick={() => handleSort(col.field)}
                    />
                  </TableHead>
                ))}
                <TableHead className="text-right">
                  <ColumnLabel>Actions</ColumnLabel>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableSkeleton
                  columns={[
                    { width: "h-4 w-8" },
                    { width: "h-5 w-32" },
                    { width: "h-4 w-24" },
                    { width: "h-5 w-20" },
                    { width: "h-5 w-16" },
                    { width: "h-4 w-20" },
                    { width: "h-7 w-16", align: "right" },
                  ]}
                />
              )}

              {isError && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7}>
                    <QueryErrorState
                      title="Couldn't load users"
                      onRetry={() => refetch()}
                      isRetrying={isFetching}
                      className="py-14"
                    />
                  </TableCell>
                </TableRow>
              )}

              {isEmpty && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={Users}
                      title="No users found"
                      description="Try adjusting your filters, or add a new admin user."
                      action={
                        <Button size="sm" onClick={() => create("admin-users")}>
                          <Plus className="size-4" />
                          Add user
                        </Button>
                      }
                      className="py-14"
                    />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                rows.map((user: AdminUserItemDto) => (
                  <TableRow key={user.id} className="group">
                    <TableCell className="tabular-nums">
                      <Link
                        to={`/users/${user.id}/edit`}
                        className="font-medium text-primary hover:underline"
                      >
                        #{user.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AddressDisplay address={user.address} />
                        {user.id === identity?.id && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                          >
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.name ? (
                        <span className="font-medium">{user.name}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={user.active} />
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => edit("admin-users", user.id)}
                        title="Edit user"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

        {/* Footer: range summary, page size, pagination */}
        <DataPagination
          currentPage={currentPage}
          pageSize={pageSize}
          total={data?.total ?? 0}
          onPageChange={updateCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </Panel>
    </div>
  );
};

import { useList, useUpdate, useNavigation, useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Plus, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
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
  notify,
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

type UserSortField = "id" | "address" | "role" | "active" | "createdAt";

const COLUMNS: { field: UserSortField; label: string }[] = [
  { field: "id", label: "ID" },
  { field: "address", label: "Address" },
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
  filterValues: { role: undefined, active: undefined, address: "" },
  sortField: "createdAt",
  sortOrder: "desc",
  currentPage: 1,
  pageSize: 20,
};

export const AdminUsersList = () => {
  const { create } = useNavigation();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const { mutate: toggleActive } = useUpdate();
  const queryClient = useQueryClient();
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<number, boolean>
  >(new Map());
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

  const handleToggleActive = (userId: number, currentActive: boolean) => {
    if (userId === identity?.id) {
      return; // Prevent self-deactivation
    }

    const newActiveState = !currentActive;

    // Start loading state
    setTogglingUserId(userId);

    // Apply optimistic update immediately
    setOptimisticUpdates((prev) => new Map(prev).set(userId, newActiveState));

    // Update cache optimistically
    const queryKey = [
      "admin-users",
      "list",
      { current: currentPage, pageSize },
    ];
    queryClient.setQueryData(
      queryKey,
      (oldData: { data?: AdminUserItemDto[]; total?: number } | undefined) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((user: AdminUserItemDto) =>
            user.id === userId ? { ...user, active: newActiveState } : user
          ),
        };
      }
    );

    toggleActive(
      {
        resource: "admin-users",
        id: userId,
        values: { active: newActiveState },
        meta: {
          method: "patch",
          endpoint: `/admin/users/${userId}/toggle-active`,
        },
      },
      {
        onSuccess: () => {
          // Remove optimistic update since real data is now correct
          setOptimisticUpdates((prev) => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
          setTogglingUserId(null);
          notify.success("User status updated successfully");
        },
        onError: () => {
          // Revert optimistic update on error
          setOptimisticUpdates((prev) => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });

          // Revert cache to original state
          const queryKey = [
            "admin-users",
            "list",
            { current: currentPage, pageSize },
          ];
          queryClient.setQueryData(
            queryKey,
            (
              oldData: { data?: AdminUserItemDto[]; total?: number } | undefined
            ) => {
              if (!oldData?.data) return oldData;

              return {
                ...oldData,
                data: oldData.data.map((user: AdminUserItemDto) =>
                  user.id === userId ? { ...user, active: currentActive } : user
                ),
              };
            }
          );

          setTogglingUserId(null);
          notify.error(
            `Failed to ${newActiveState ? "activate" : "deactivate"} user`
          );
        },
      }
    );
  };

  const handleRoleFilter = (role?: "VIEWER" | "REVIEWER" | "SUPERVISOR") => {
    updateFilterValues((prev) => ({ ...prev, role }));
  };

  const handleActiveFilter = (active?: boolean) => {
    updateFilterValues((prev) => ({ ...prev, active }));
  };

  const handleAddressSearch = (address: string) => {
    updateFilterValues((prev) => ({ ...prev, address }));
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
  if (identity?.role !== "SUPERVISOR") {
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
              <SelectTrigger
                aria-label="Filter by role"
                className="h-9 w-[148px]"
              >
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
                  { width: "h-5 w-20" },
                  { width: "h-5 w-16" },
                  { width: "h-4 w-20" },
                  { width: "h-7 w-24", align: "right" },
                ]}
              />
            )}

            {isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6}>
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
                <TableCell colSpan={6}>
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
              rows.map((user: AdminUserItemDto) => {
                const isSelf = user.id === identity?.id;
                const displayActive =
                  optimisticUpdates.get(user.id) ?? user.active;
                return (
                  <TableRow key={user.id} className="group">
                    <TableCell className="tabular-nums font-medium">
                      #{user.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AddressDisplay address={user.address} />
                        {isSelf && (
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
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={displayActive} />
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(user.id, user.active)}
                        disabled={isSelf || togglingUserId === user.id}
                        title={
                          isSelf
                            ? "Cannot modify your own status"
                            : user.active
                            ? "Deactivate user"
                            : "Activate user"
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {togglingUserId === user.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : user.active ? (
                          <>
                            <EyeOff className="size-3.5" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="size-3.5" />
                            Activate
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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

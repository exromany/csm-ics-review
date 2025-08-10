import { useList, useUpdate, useNavigation, useGetIdentity } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Plus, Shield, Eye, EyeOff, Loader2, UserCheck, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { AdminUserItemDto, AdminIdentity } from "../../types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const RoleBadge = ({
  role,
}: {
  role: "VIEWER" | "REVIEWER" | "SUPERVISOR";
}) => {
  const variants = {
    VIEWER: {
      variant: "outline" as const,
      color: "text-purple-700 bg-purple-50 border-purple-200",
    },
    REVIEWER: {
      variant: "default" as const,
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    SUPERVISOR: {
      variant: "secondary" as const,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  } as const;

  const config = variants[role];

  return (
    <Badge variant={config.variant} className={`text-xs ${config.color}`}>
      {role}
    </Badge>
  );
};

const StatusBadge = ({ active }: { active: boolean }) => {
  return (
    <Badge variant={active ? "default" : "secondary"} className="text-xs">
      {active ? (
        <>
          <UserCheck className="w-3 h-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <EyeOff className="w-3 h-3 mr-1" />
          Inactive
        </>
      )}
    </Badge>
  );
};

type UserSortField = "id" | "address" | "role" | "active" | "createdAt";
type SortOrder = "asc" | "desc";

// Helper function to generate page numbers array for pagination
const getPageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible = 7
) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const sidePages = Math.floor((maxVisible - 3) / 2); // Reserve space for first, last, and current

  if (currentPage <= sidePages + 2) {
    // Near the beginning
    for (let i = 1; i <= sidePages + 2; i++) {
      pages.push(i);
    }
    if (sidePages + 3 < totalPages) {
      pages.push("ellipsis");
    }
    pages.push(totalPages);
  } else if (currentPage >= totalPages - sidePages - 1) {
    // Near the end
    pages.push(1);
    if (totalPages - sidePages - 2 > 1) {
      pages.push("ellipsis");
    }
    for (let i = totalPages - sidePages - 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // In the middle
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

export const AdminUsersList = () => {
  const { create } = useNavigation();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const { mutate: toggleActive } = useUpdate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<number, boolean>>(new Map());
  const [filters, setFilters] = useState<{
    role?: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR';
    active?: boolean;
    address?: string;
  }>({});
  const [sortField, setSortField] = useState<UserSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useList<AdminUserItemDto>({
    resource: "admin-users",
    pagination: {
      current: currentPage,
      pageSize,
    },
    filters: [
      ...(filters.role
        ? [{ field: "role", operator: "eq" as const, value: filters.role }]
        : []),
      ...(typeof filters.active === "boolean"
        ? [{ field: "active", operator: "eq" as const, value: filters.active }]
        : []),
      ...(filters.address
        ? [
            {
              field: "address",
              operator: "contains" as const,
              value: filters.address,
            },
          ]
        : []),
    ],
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

          // Show error feedback to user
          console.error(
            `Failed to ${newActiveState ? "activate" : "deactivate"} user`
          );
        },
      }
    );
  };

  const handleRoleFilter = (role?: 'VIEWER' | 'REVIEWER' | 'SUPERVISOR') => {
    setFilters(prev => ({ ...prev, role }));
    setCurrentPage(1);
  };

  const handleActiveFilter = (active?: boolean) => {
    setFilters(prev => ({ ...prev, active }));
    setCurrentPage(1);
  };

  const handleAddressSearch = (address: string) => {
    setFilters(prev => ({ ...prev, address }));
    setCurrentPage(1);
  };

  const handleSort = (field: UserSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const totalPages = Math.ceil((data?.total || 0) / pageSize);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const handlePageSizeChange = (newPageSize: string) => {
    const newSize = parseInt(newPageSize);
    const newPage = Math.min(
      currentPage,
      Math.ceil((data?.total || 0) / newSize)
    );
    setPageSize(newSize);
    setCurrentPage(newPage);
  };

  // Only show to supervisors
  if (identity?.role !== 'SUPERVISOR') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-red-700">Access Denied</h3>
            <p className="text-red-600 text-center">
              Only supervisors can access user management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage admin users and their roles in the CSM ICS system
          </p>
        </div>
        <Button
          onClick={() => create("admin-users")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters & Search
              </CardTitle>
              <CardDescription>
                Filter users by role, status, and address
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={filters.role || "all"}
                onValueChange={(value) =>
                  handleRoleFilter(
                    value === "all"
                      ? undefined
                      : (value as "VIEWER" | "REVIEWER" | "SUPERVISOR")
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="REVIEWER">Reviewer</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    typeof filters.active === "undefined"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleActiveFilter(undefined)}
                  className="text-xs"
                >
                  All
                </Button>
                <Button
                  variant={filters.active === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleActiveFilter(true)}
                  className="text-xs"
                >
                  Active
                </Button>
                <Button
                  variant={filters.active === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleActiveFilter(false)}
                  className="text-xs"
                >
                  Inactive
                </Button>
              </div>
            </div>

            {/* Address Search */}
            <div className="space-y-2">
              <label htmlFor="address-search" className="text-sm font-medium">
                Search by Address
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address-search"
                  type="text"
                  placeholder="0x..."
                  value={filters.address || ""}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Admin Users ({data?.total || 0})
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading users..."
              : `${data?.data?.length || 0} users displayed`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading users...
              </span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("id")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        ID
                        {sortField === "id" &&
                          (sortOrder === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          ))}
                        {sortField !== "id" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("address")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Address
                        {sortField === "address" &&
                          (sortOrder === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          ))}
                        {sortField !== "address" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("role")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Role
                        {sortField === "role" &&
                          (sortOrder === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          ))}
                        {sortField !== "role" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("active")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Status
                        {sortField === "active" &&
                          (sortOrder === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          ))}
                        {sortField !== "active" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("createdAt")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Created
                        {sortField === "createdAt" &&
                          (sortOrder === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          ))}
                        {sortField !== "createdAt" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">#{user.id}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {user.address.slice(0, 8)}...{user.address.slice(-6)}
                        </code>
                        {user.id === identity?.id && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          active={optimisticUpdates.get(user.id) ?? user.active}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleActive(user.id, user.active)
                          }
                          disabled={
                            user.id === identity?.id ||
                            togglingUserId === user.id
                          }
                          title={
                            user.id === identity?.id
                              ? "Cannot modify your own status"
                              : user.active
                              ? "Deactivate user"
                              : "Activate user"
                          }
                        >
                          {togglingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.active ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Enhanced Pagination */}
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
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {pageNumbers.map((pageNum, index) => (
                      <PaginationItem key={index}>
                        {pageNum === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
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
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {!isLoading && (!data?.data || data.data.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-muted-foreground text-center mb-4">
              No admin users have been created yet.
            </p>
            <Button
              onClick={() => create("admin-users")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First User
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

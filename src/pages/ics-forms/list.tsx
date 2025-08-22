import { useList, useNavigation, useDataProvider } from "@refinedev/core";
import { useState } from "react";
import {
  Search,
  FileText,
  CheckCircle,
  Eye,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Archive,
} from "lucide-react";
import type { AdminIcsFormItemDto, IcsFormStatus } from "../../types/api";
import { useTableFilters, type FilterValues } from "../../hooks/useTableFilters";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateCsvContent,
  generateFilename,
  downloadCsv,
} from "../../utils/csvExport";

const StatusBadge = ({ status }: { status: IcsFormStatus }) => {
  const variants = {
    REVIEW: "secondary",
    APPROVED: "default",
    REJECTED: "destructive",
  } as const;

  return (
    <Badge variant={variants[status]} className="text-xs">
      {status}
    </Badge>
  );
};


type SortField =
  | "id"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "mainAddress"
  | "issued"
  | "outdated";
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

export const IcsFormsList = () => {
  const { show } = useNavigation();
  const dataProvider = useDataProvider();
  const { buildFilters, hasActiveFilters, clearAllFilters } = useTableFilters();
  
  // Using direct API field names - no transformations needed!
  const [filterValues, setFilterValues] = useState<FilterValues>({
    status: undefined,        // API: status
    address: '',              // API: address (was mainAddress)
    issued: undefined,        // API: issued  
    outdated: undefined,      // API: outdated
    startDate: '',            // API: startDate (was dateRange.from)
    endDate: ''               // API: endDate (was dateRange.to)
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isExporting, setIsExporting] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useList<AdminIcsFormItemDto>({
    resource: "ics-forms",
    pagination: {
      current: currentPage,
      pageSize,
    },
    // Clean, simple filter building using direct API field names
    filters: buildFilters(filterValues),
    sorters: [
      {
        field: sortField,
        order: sortOrder,
      },
    ],
  });

  const handleStatusFilter = (status?: IcsFormStatus) => {
    setFilterValues((prev) => ({ ...prev, status }));
    setCurrentPage(1);
  };

  const handleAddressSearch = (address: string) => {
    setFilterValues((prev) => ({ ...prev, address }));
    setCurrentPage(1);
  };

  const handleIssuedFilter = (issued?: boolean) => {
    setFilterValues((prev) => ({ ...prev, issued }));
    setCurrentPage(1);
  };

  const handleOutdatedFilter = (outdated?: boolean) => {
    setFilterValues((prev) => ({ ...prev, outdated }));
    setCurrentPage(1);
  };

  const handleDateRangeFilter = (startDate: string, endDate: string) => {
    setFilterValues((prev) => ({ ...prev, startDate, endDate }));
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterValues(clearAllFilters(filterValues));
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const newSize = parseInt(newPageSize);
    const newPage = Math.min(
      currentPage,
      Math.ceil((data?.total || 0) / newSize)
    );
    setPageSize(newSize);
    setCurrentPage(newPage);
  };

  const handleCsvExport = async () => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      // Use the same clean filter building for export
      const exportFilters = buildFilters(filterValues);

      // Fetch all matching records (no pagination)
      const exportData = await dataProvider().getList<AdminIcsFormItemDto>({
        resource: "ics-forms",
        pagination: {
          current: 1,
          pageSize: 9999, // Large number to get all records
        },
        filters: exportFilters,
        sorters: [
          {
            field: sortField,
            order: sortOrder,
          },
        ],
      });

      // Generate CSV content
      const csvContent = generateCsvContent(exportData.data);

      // Generate filename based on active filters (using direct API field names)
      const filename = generateFilename({
        status: filterValues.status as IcsFormStatus,
        address: filterValues.address as string,
        issued: filterValues.issued as boolean,
        outdated: filterValues.outdated as boolean,
        startDate: filterValues.startDate as string,
        endDate: filterValues.endDate as string,
      });

      // Download the file
      downloadCsv(csvContent, filename);
    } catch (error) {
      console.error("CSV export failed:", error);
      // Could add toast notification here if available
    } finally {
      setIsExporting(false);
    }
  };


  const totalPages = Math.ceil((data?.total || 0) / pageSize);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ICS Forms Review</h1>
        <p className="text-muted-foreground">
          Review and manage Individual Customer Staker form submissions
        </p>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters & Search
              </CardTitle>
              <CardDescription>
                Filter ICS forms by multiple criteria
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
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
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
                    variant={filterValues.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilter(status as IcsFormStatus)}
                    className="text-xs"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Issued Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ICS Proof Status</label>
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
                  variant={filterValues.issued === false ? "default" : "outline"}
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
                  variant={filterValues.outdated === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleOutdatedFilter(false)}
                  className="text-xs"
                >
                  Current
                </Button>
                <Button
                  variant={filterValues.outdated === true ? "default" : "outline"}
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
              <label htmlFor="address-search" className="text-sm font-medium">
                Search by Address
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address-search"
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
              <label className="text-sm font-medium">Submission Date Range</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  value={(filterValues.startDate as string) || ""}
                  onChange={(e) =>
                    handleDateRangeFilter(e.target.value, filterValues.endDate as string)
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            ICS Forms ({data?.total || 0})
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading ICS forms..."
              : `${data?.data?.length || 0} ICS forms displayed`}
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
                      <TableHead>Status</TableHead>
                      <TableHead>ICS Proof</TableHead>
                      <TableHead>Outdated</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Last Reviewer</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-16" />
                        </TableCell>
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
                          onClick={() => handleSort("mainAddress")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Main Address
                          {sortField === "mainAddress" &&
                            (sortOrder === "asc" ? (
                              <ArrowUp className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-2 h-4 w-4" />
                            ))}
                          {sortField !== "mainAddress" && (
                            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("status")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Status
                          {sortField === "status" &&
                            (sortOrder === "asc" ? (
                              <ArrowUp className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-2 h-4 w-4" />
                            ))}
                          {sortField !== "status" && (
                            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("issued")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          ICS Proof
                          {sortField === "issued" &&
                            (sortOrder === "asc" ? (
                              <ArrowUp className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-2 h-4 w-4" />
                            ))}
                          {sortField !== "issued" && (
                            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("outdated")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Outdated
                          {sortField === "outdated" &&
                            (sortOrder === "asc" ? (
                              <ArrowUp className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-2 h-4 w-4" />
                            ))}
                          {sortField !== "outdated" && (
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
                          Submitted
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
                      <TableHead>Last Reviewer</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data?.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">
                          #{form.id}
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <code className="text-sm bg-muted px-2 py-1 rounded block truncate cursor-help">
                                {form.form.mainAddress.slice(0, 8)}...
                                {form.form.mainAddress.slice(-6)}
                              </code>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">{form.form.mainAddress}</p>
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
                              <code className="text-xs block truncate">
                                {form.lastReviewer}
                              </code>
                            )
                          ) : (
                            <span>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              show("ics-forms", form.id.toString())
                            }
                            title={
                              form.issued
                                ? "View form with issued ICS Proof"
                                : form.outdated
                                ? "View outdated form"
                                : "Review ICS form"
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
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No ICS forms found</h3>
            <p className="text-muted-foreground text-center">
              {hasActiveFilters(filterValues)
                ? "Try adjusting your filters to see more results."
                : "No ICS forms have been submitted yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

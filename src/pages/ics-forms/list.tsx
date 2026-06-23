import {
  AddressDisplay,
  Button,
  ColumnLabel,
  DataPagination,
  DateRangeFilter,
  EmptyState,
  FilterToolbar,
  notify,
  PageHeader,
  Panel,
  QueryErrorState,
  ReviewerDisplay,
  SearchInput,
  SegmentedControl,
  SortableHeader,
  StatusBadge,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  toneIcon,
} from "@/components/ui";
import { useDataProvider, useList } from "@refinedev/core";
import { Download, Edit, Eye, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { usePersistentTableState } from "../../hooks/usePersistentTableState";
import { useTableFilters } from "../../hooks/useTableFilters";
import type { AdminIcsFormItemDto, IcsFormStatus } from "../../types/api";
import {
  downloadCsv,
  generateCsvContent,
  generateFilename,
} from "../../utils/csvExport";
import { getScoreBreakdown, getScoreStatus } from "../../utils/scoring";

type IcsSortField =
  | "id"
  | "mainAddress"
  | "status"
  | "issued"
  | "outdated"
  | "createdAt";

// `sortable` columns map to backend sort fields. "Score" is the capped total
// derived client-side from `scores` (no backend sort field), so it renders a
// plain label — sorting it would only reorder the current page, which lies under
// server-side pagination.
type IcsColumn = { field: string; label: string; sortable: boolean };

const COLUMNS: IcsColumn[] = [
  { field: "id", label: "ID", sortable: true },
  { field: "mainAddress", label: "Main Address", sortable: true },
  { field: "status", label: "Status", sortable: true },
  { field: "totalScore", label: "Score", sortable: false },
  { field: "issued", label: "ICS Proof", sortable: true },
  { field: "outdated", label: "Outdated", sortable: true },
  { field: "createdAt", label: "Submitted", sortable: true },
];

const STATUS_OPTIONS: { label: string; value: IcsFormStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Review", value: "REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const ISSUED_OPTIONS: { label: string; value: boolean | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Issued", value: true },
  { label: "Not issued", value: false },
];

const OUTDATED_OPTIONS: { label: string; value: boolean | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Current", value: false },
  { label: "Outdated", value: true },
];

export const IcsFormsList = () => {
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
    hasStoredState,
  } = usePersistentTableState();

  const [isExporting, setIsExporting] = useState(false);

  const {
    result: data,
    query: { isLoading, isError, refetch, isFetching },
  } = useList<AdminIcsFormItemDto>({
    resource: "ics-forms",
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

  const handleStatusFilter = (status?: IcsFormStatus) => {
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

  const handlePageSizeChange = (newSize: number) => {
    updatePageSize(newSize);
  };

  const handleCsvExport = async () => {
    if (isExporting) return;

    const total = data?.total ?? 0;
    if (total === 0) {
      notify.error("No forms to export");
      return;
    }

    setIsExporting(true);

    try {
      const exportFilters = buildFilters(filterValues);

      const exportData = await dataProvider().getList<AdminIcsFormItemDto>({
        resource: "ics-forms",
        pagination: { currentPage: 1, pageSize: total },
        filters: exportFilters,
        sorters: [{ field: sortField, order: sortOrder }],
      });

      const csvContent = generateCsvContent(exportData.data);
      const filename = generateFilename({
        status: filterValues.status as IcsFormStatus,
        address: filterValues.address as string,
        issued: filterValues.issued as boolean,
        outdated: filterValues.outdated as boolean,
        startDate: filterValues.startDate as string,
        endDate: filterValues.endDate as string,
      });

      downloadCsv(csvContent, filename);
      notify.success(
        `Exported ${exportData.data.length} form${
          exportData.data.length === 1 ? "" : "s"
        } to CSV`
      );
    } catch (error) {
      console.error("CSV export failed:", error);
      notify.error("CSV export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const rows = data?.data ?? [];
  const isEmpty = !isLoading && !isError && rows.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="ICS Forms"
        count={data?.total}
        description="Review and manage Individual Customer Staker form submissions."
        actions={
          <Button
            variant="outline"
            onClick={handleCsvExport}
            disabled={isExporting || !data?.total}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {isExporting ? "Exporting…" : "Download CSV"}
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
          <DateRangeFilter
            fromLabel="Submitted from date"
            toLabel="Submitted to date"
            value={{
              from: (filterValues.startDate as string) || "",
              to: (filterValues.endDate as string) || "",
            }}
            onChange={({ from, to }) => handleDateRangeFilter(from, to)}
          />
          <FilterToolbar.Filters>
            <SegmentedControl
              aria-label="Filter by status"
              options={STATUS_OPTIONS}
              value={filterValues.status as IcsFormStatus | undefined}
              onChange={handleStatusFilter}
            />
            <SegmentedControl
              aria-label="Filter by ICS proof status"
              options={ISSUED_OPTIONS}
              value={filterValues.issued as boolean | undefined}
              onChange={handleIssuedFilter}
            />
            <SegmentedControl
              aria-label="Filter by form freshness"
              options={OUTDATED_OPTIONS}
              value={filterValues.outdated as boolean | undefined}
              onChange={handleOutdatedFilter}
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
                    {col.sortable ? (
                      <SortableHeader
                        label={col.label}
                        active={sortField === col.field}
                        order={sortOrder}
                        onClick={() => handleSort(col.field as IcsSortField)}
                      />
                    ) : (
                      <ColumnLabel>{col.label}</ColumnLabel>
                    )}
                  </TableHead>
                ))}
                <TableHead>
                  <ColumnLabel>Last Reviewer</ColumnLabel>
                </TableHead>
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
                    { width: "h-5 w-10" },
                    { width: "h-5 w-20" },
                    { width: "h-5 w-16" },
                    { width: "h-4 w-20" },
                    { width: "h-4 w-20" },
                    { width: "h-7 w-16", align: "right" },
                  ]}
                />
              )}

              {isError && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9}>
                    <QueryErrorState
                      title="Couldn't load ICS forms"
                      onRetry={() => refetch()}
                      isRetrying={isFetching}
                      className="py-14"
                    />
                  </TableCell>
                </TableRow>
              )}

              {isEmpty && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9}>
                    <EmptyState
                      icon={FileText}
                      title="No ICS forms found"
                      description={
                        hasActiveFilters(filterValues)
                          ? "Try adjusting your filters to see more results."
                          : "No ICS forms have been submitted yet."
                      }
                      className="py-14"
                    />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                rows.map((form) => {
                  // Capped total + qualification tone, mirroring the detail
                  // page's TotalScoreCard (emerald/amber/red accent).
                  const breakdown = getScoreBreakdown(form.scores);
                  const scoreTone = breakdown.isQualified
                    ? "emerald"
                    : breakdown.isPartiallyQualified
                    ? "amber"
                    : "red";

                  return (
                  <TableRow key={form.id} className="group">
                    <TableCell className="tabular-nums">
                      <Link
                        to={`/forms/${form.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        #{form.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <AddressDisplay address={form.form.mainAddress} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={form.status} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          toneIcon[scoreTone]
                        )}
                        title={getScoreStatus(breakdown).message}
                      >
                        {breakdown.totalScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      {form.issued ? (
                        <StatusPill tone="emerald">Issued</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Not issued</StatusPill>
                      )}
                    </TableCell>
                    <TableCell>
                      {form.outdated ? (
                        <StatusPill tone="amber">Outdated</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Current</StatusPill>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-[140px] text-sm text-muted-foreground">
                      <ReviewerDisplay reviewer={form.lastReviewer} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Link
                          to={`/forms/${form.id}`}
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
                              <Eye className="size-3.5" />
                              View
                            </>
                          ) : (
                            <>
                              <Edit className="size-3.5" />
                              Review
                            </>
                          )}
                        </Link>
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

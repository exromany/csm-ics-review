import {
  AddressDisplay,
  Button,
  ColumnLabel,
  DataPagination,
  DateRangeFilter,
  EmptyState,
  FilterToolbar,
  PageHeader,
  Panel,
  QueryErrorState,
  ReviewerDisplay,
  SearchInput,
  SegmentedControl,
  SoftBadge,
  SortableHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  notify,
} from "@/components/ui";
import { useDataProvider, useList } from "@refinedev/core";
import { Download, Edit, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { usePersistentTableState } from "../../hooks/usePersistentTableState";
import { useTableFilters } from "../../hooks/useTableFilters";
import type { AdminIdvtcFormItemDto, FormStatus } from "../../types/api";
import {
  downloadCsv,
  generateIdvtcCsvContent,
  generateIdvtcFilename,
} from "../../utils/csvExport";

type SortField =
  | "id"
  | "mainAddress"
  | "status"
  | "issued"
  | "outdated"
  | "createdAt";

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "id", label: "ID" },
  { field: "mainAddress", label: "Main Address" },
  { field: "status", label: "Status" },
  { field: "issued", label: "IDVTC Proof" },
  { field: "outdated", label: "Form" },
  { field: "createdAt", label: "Submitted" },
];

const STATUS_OPTIONS: { label: string; value: FormStatus | undefined }[] = [
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

const IssuedCell = ({ issued }: { issued: boolean }) =>
  issued ? (
    <SoftBadge tone="emerald" size="sm">
      Issued
    </SoftBadge>
  ) : (
    <span className="text-sm text-muted-foreground">Not issued</span>
  );

const OutdatedCell = ({ outdated }: { outdated: boolean }) =>
  outdated ? (
    <SoftBadge tone="amber" size="sm">
      Outdated
    </SoftBadge>
  ) : (
    <span className="text-sm text-muted-foreground">Current</span>
  );

export const IdvtcFormsList = () => {
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
  } = usePersistentTableState("csm-idvtc-table-state");

  const [isExporting, setIsExporting] = useState(false);

  const {
    result: data,
    query: { isLoading, isError, refetch, isFetching },
  } = useList<AdminIdvtcFormItemDto>({
    resource: "idvtc-forms",
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

      const exportData = await dataProvider().getList<AdminIdvtcFormItemDto>({
        resource: "idvtc-forms",
        pagination: { currentPage: 1, pageSize: total },
        filters: exportFilters,
        sorters: [{ field: sortField, order: sortOrder }],
      });

      const csvContent = generateIdvtcCsvContent(exportData.data);
      const filename = generateIdvtcFilename({
        status: filterValues.status as FormStatus,
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
  const colSpan = COLUMNS.length + 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="IDVTC forms"
        count={data?.total}
        description="Review and manage Distributed Validator Technology form submissions."
        actions={
          <Button
            variant="outline"
            onClick={handleCsvExport}
            disabled={isExporting || !data?.total}
          >
            <Download className="size-4" />
            {isExporting ? "Exporting…" : "Export CSV"}
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
            fromLabel="Submitted from"
            toLabel="Submitted until"
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
              value={(filterValues.status as FormStatus | undefined) ?? undefined}
              onChange={handleStatusFilter}
            />
            <SegmentedControl
              aria-label="Filter by IDVTC proof"
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
                    <SortableHeader
                      label={col.label}
                      active={sortField === col.field}
                      order={sortOrder}
                      onClick={() => handleSort(col.field)}
                    />
                  </TableHead>
                ))}
                <TableHead>
                  <ColumnLabel>Reviewer</ColumnLabel>
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
                    { width: "h-5 w-16" },
                    { width: "h-5 w-16" },
                    { width: "h-4 w-20" },
                    { width: "h-4 w-20" },
                    { width: "h-7 w-16", align: "right" },
                  ]}
                />
              )}

              {isError && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colSpan}>
                    <QueryErrorState
                      title="Couldn't load IDVTC forms"
                      onRetry={() => refetch()}
                      isRetrying={isFetching}
                      className="py-14"
                    />
                  </TableCell>
                </TableRow>
              )}

              {isEmpty && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colSpan}>
                    <EmptyState
                      icon={FileText}
                      title="No IDVTC forms found"
                      description={
                        hasActiveFilters(filterValues)
                          ? "Try adjusting your filters to see more results."
                          : "No IDVTC forms have been submitted yet."
                      }
                      className="py-14"
                    />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                rows.map((form) => (
                  <TableRow key={form.id} className="group">
                    <TableCell className="tabular-nums">
                      <Link
                        to={`/idvtc-forms/${form.id}`}
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
                      <IssuedCell issued={form.issued} />
                    </TableCell>
                    <TableCell>
                      <OutdatedCell outdated={form.outdated} />
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-[120px] text-muted-foreground">
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
                          to={`/idvtc-forms/${form.id}`}
                          title={
                            form.issued
                              ? "View form with issued IDVTC Proof"
                              : form.outdated
                              ? "View outdated form"
                              : "Review IDVTC form"
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

import { useList } from "@refinedev/core";
import { Link } from "react-router";
import { Archive, CheckCircle, Edit, Eye } from "lucide-react";
import type { FormStatus } from "../types/api";
import {
  StatusBadge,
  AddressDisplay,
  ReviewerDisplay,
  ColumnLabel,
  Panel,
  SoftBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from "@/components/ui";

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
  const {
    result,
    query: { isLoading },
  } = useList<FormItem>({
    resource,
    filters: [
      {
        field: "address",
        operator: "eq",
        value: mainAddress,
      },
    ],
    pagination: {
      currentPage: 1,
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
    result?.data?.filter((form) => form.id !== currentFormId) || [];

  if (!isLoading && otherForms.length === 0) {
    return null;
  }

  const tableMeta =
    "[&_td]:px-4 [&_td]:py-2.5 [&_th]:h-auto [&_th]:px-4 [&_th]:py-2.5";

  const header = (
    <div className="flex items-center gap-2 border-b p-4">
      <h2 className="text-sm font-semibold">Other forms with same main address</h2>
      {!isLoading && (
        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {otherForms.length}
        </span>
      )}
    </div>
  );

  const columns = (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        {["ID", "Main Address", "Status", proofLabel, "Outdated", "Submitted", "Last Reviewer"].map(
          (label) => (
            <TableHead key={label}>
              <ColumnLabel>{label}</ColumnLabel>
            </TableHead>
          )
        )}
        <TableHead className="text-right">
          <ColumnLabel>Actions</ColumnLabel>
        </TableHead>
      </TableRow>
    </TableHeader>
  );

  if (isLoading) {
    return (
      <Panel className="overflow-hidden">
        {header}
        <div className="overflow-x-auto">
          <Table className={tableMeta}>
            {columns}
            <TableBody>
              <TableSkeleton
                rows={3}
                columns={[
                  { width: "h-4 w-8" },
                  { width: "h-5 w-32" },
                  { width: "h-5 w-20" },
                  { width: "h-5 w-16" },
                  { width: "h-5 w-16" },
                  { width: "h-4 w-24" },
                  { width: "h-4 w-20" },
                  { width: "h-7 w-16", align: "right" },
                ]}
              />
            </TableBody>
          </Table>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      {header}
      <div className="overflow-x-auto">
        <Table className={tableMeta}>
          {columns}
          <TableBody>
            {otherForms.map((form) => (
              <TableRow key={form.id} className="group">
                <TableCell className="font-medium tabular-nums">
                  <Link
                    to={`${basePath}/${form.id}`}
                    className="text-primary hover:underline"
                  >
                    #{form.id}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[150px]">
                  <AddressDisplay address={form.form.mainAddress} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={form.status} />
                </TableCell>
                <TableCell>
                  {form.issued ? (
                    <SoftBadge tone="emerald" size="sm" icon={CheckCircle}>
                      Issued
                    </SoftBadge>
                  ) : (
                    <SoftBadge tone="neutral" size="sm">Not Issued</SoftBadge>
                  )}
                </TableCell>
                <TableCell>
                  {form.outdated ? (
                    <SoftBadge tone="amber" size="sm" icon={Archive}>
                      Outdated
                    </SoftBadge>
                  ) : (
                    <SoftBadge tone="neutral" size="sm">Current</SoftBadge>
                  )}
                </TableCell>
                <TableCell className="tabular-nums text-sm text-muted-foreground">
                  {new Date(form.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="max-w-[120px] text-muted-foreground">
                  <ReviewerDisplay reviewer={form.lastReviewer} />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    to={`${basePath}/${form.id}`}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
};

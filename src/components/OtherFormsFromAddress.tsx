import { useList } from "@refinedev/core";
import { Link } from "react-router";
import { Archive, CheckCircle, Edit, Eye } from "lucide-react";
import type { AdminIcsFormItemDto, IcsFormStatus } from "../types/api";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

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

interface OtherFormsFromAddressProps {
  currentFormId: number;
  mainAddress: string;
}

export const OtherFormsFromAddress = ({
  currentFormId,
  mainAddress,
}: OtherFormsFromAddressProps) => {
  const { data, isLoading } = useList<AdminIcsFormItemDto>({
    resource: "ics-forms",
    filters: [
      {
        field: "address",
        operator: "eq",
        value: mainAddress,
      },
    ],
    pagination: {
      current: 1,
      pageSize: 100, // Get all forms from this address
    },
    sorters: [
      {
        field: "id",
        order: "desc",
      },
    ],
  });

  // Filter out the current form from the results
  const otherForms =
    data?.data?.filter((form) => form.id !== currentFormId) || [];

  // Don't show anything if there are no other forms
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
                    <TableHead>ICS Proof</TableHead>
                    <TableHead>Outdated</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Last Reviewer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, i) => (
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
                    <TableHead>ICS Proof</TableHead>
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
                                  {`${form.lastReviewer.slice(
                                    0,
                                    6
                                  )}...${form.lastReviewer.slice(-4)}`}
                                </code>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">
                                  {form.lastReviewer}
                                </p>
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
                        <Link
                          to={`/forms/${form.id}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
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

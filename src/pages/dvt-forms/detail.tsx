import {
  useOne,
  useUpdate,
  useNavigation,
  useGetIdentity,
} from "@refinedev/core";
import { useParams } from "react-router";
import {
  Fragment,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  ArrowLeft,
  CheckCircle,
  User,
  ExternalLink,
  Clock,
  CircleCheck,
  CircleX,
  Copy,
  Save,
  Loader2,
  AlertTriangle,
  Eye,
  Shield,
  Archive,
  Users,
  MessageSquare,
  Send,
  RefreshCw,
} from "lucide-react";
import type {
  AdminDvtFormDetailDto,
  FormStatus,
  DvtCommentsDto,
  AdminIdentity,
} from "../../types/api";
import { cn } from "@/lib/utils";
import { OtherFormsFromAddress } from "../../components/OtherFormsFromAddress";
import {
  Button,
  Panel,
  SoftBadge,
  Switch,
  Input,
  Label,
  Textarea,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  Alert,
  AlertDescription,
  AlertTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DetailStatusBadge,
  IcsStatusBadge,
  AddressDisplay,
  ReviewerDisplay,
  LoadingState,
  EmptyState,
  QueryErrorState,
  notify,
  toneIcon,
  toneSoft,
  toneSolid,
  toneBorder,
  toneTint,
} from "@/components/ui";
import { useIcsStatusList } from "../../hooks/useIcsStatus";
import {
  useDvtFormsByIdentifiersList,
  type DvtIdentifier,
} from "../../hooks/useDvtFormsByIdentifiers";
import { DvtLinkedFormRowContent } from "../../components/ClusterMemberDvtMatch";

const FieldLabel = ({
  icon: Icon,
  children,
  warn,
}: {
  icon: typeof User;
  children: React.ReactNode;
  warn?: { count: number };
}) => (
  <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
    <Icon className="size-3.5" />
    {children}
    {warn && warn.count > 0 && (
      <span
        className="inline-flex items-center"
        title={`Appears in ${warn.count} other DVT application${warn.count === 1 ? "" : "s"}`}
        aria-label="Warning: appears in other DVT applications"
      >
        <AlertTriangle className={cn("size-3.5", toneIcon.amber)} />
      </span>
    )}
  </span>
);

const DECISIONS: {
  value: FormStatus;
  label: string;
  hint: string;
  tooltip: string;
  Icon: typeof Clock;
  activeClass: string;
}[] = [
  {
    value: "REVIEW",
    label: "Under Review",
    hint: "Pending decision",
    tooltip: "Mark as under review",
    Icon: Clock,
    activeClass: toneSolid.amber,
  },
  {
    value: "APPROVED",
    label: "Approved",
    hint: "Accept form",
    tooltip: "Approve this submission",
    Icon: CircleCheck,
    activeClass: toneSolid.emerald,
  },
  {
    value: "REJECTED",
    label: "Rejected",
    hint: "Decline form",
    tooltip: "Reject this submission",
    Icon: CircleX,
    activeClass: toneSolid.red,
  },
];

export const DvtFormDetail = () => {
  const { id } = useParams();
  const { list } = useNavigation();
  const { mutate: updateForm, mutation: updateMutation } = useUpdate();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const isUpdating = updateMutation.isPending;

  const {
    result: data,
    query: { isLoading, isError, refetch, isFetching },
  } = useOne<AdminDvtFormDetailDto>({
    resource: "dvt-forms",
    id: id as string,
  });

  // Check if user is supervisor/viewer or form is issued/outdated (read-only mode)
  const isSupervisor = identity?.role === "SUPERVISOR";
  const isViewer = identity?.role === "VIEWER";
  const isFormIssued = data?.issued ?? false;
  const isFormOutdated = data?.outdated ?? false;
  const isReadOnly = isSupervisor || isViewer || isFormIssued || isFormOutdated;

  const icsAddresses = useMemo(
    () => data?.form.clusterMembers?.map((m) => m.address) ?? [],
    [data?.form.clusterMembers]
  );
  const icsStatus = useIcsStatusList(icsAddresses);

  const dvtIdentifiers = useMemo<DvtIdentifier[]>(() => {
    // Already-rejected forms don't need cross-application checks — decision is final.
    if (data?.status === "REJECTED") return [];
    const members = data?.form.clusterMembers ?? [];
    const result: DvtIdentifier[] = [];
    for (const m of members) {
      if (m.address) result.push({ kind: "address", value: m.address });
    }
    if (data?.form.discordLink) {
      result.push({ kind: "discordLink", value: data.form.discordLink });
    }
    if (data?.form.telegramUsername) {
      result.push({
        kind: "telegramUsername",
        value: data.form.telegramUsername,
      });
    }
    return result;
  }, [
    data?.status,
    data?.form.clusterMembers,
    data?.form.discordLink,
    data?.form.telegramUsername,
  ]);

  const dvtMatches = useDvtFormsByIdentifiersList(dvtIdentifiers, data?.id);

  const discordLinkedForms =
    dvtMatches.get("discordLink", data?.form.discordLink ?? "")?.forms ?? [];
  const telegramLinkedForms =
    dvtMatches.get("telegramUsername", data?.form.telegramUsername ?? "")
      ?.forms ?? [];

  // Build the per-address merged lookup once per render instead of calling
  // getMerged (which constructs a fresh Map + sorts) inside the clusterMembers
  // .map below on every row, every render.
  const mergedByAddress = useMemo(() => {
    const members = data?.form.clusterMembers ?? [];
    return new Map(
      members.map((m) => [m.address, dvtMatches.getMerged({ address: m.address })])
    );
  }, [data?.form.clusterMembers, dvtMatches]);

  const [status, setStatus] = useState<FormStatus>();
  const [comments, setComments] = useState<DvtCommentsDto>({});
  const [issued, setIssued] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data once per id when it first arrives. Guarding on the id
  // (a) resets hasChanges per form so a dirty banner from form A never leaks
  // into form B (same component instance, no route key), and (b) ignores later
  // background refetches so in-progress edits aren't clobbered.
  const initializedId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (data && initializedId.current !== id) {
      setStatus(data.status);
      setComments(data.comments);
      setIssued(data.issued);
      setHasChanges(false);
      initializedId.current = id;
    }
  }, [data, id]);

  const handleStatusChange = useCallback((newStatus: FormStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  }, []);

  const handleCommentChange = useCallback(
    (field: keyof DvtCommentsDto, value: string) => {
      setComments((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  const handleClusterMemberCommentChange = useCallback(
    (index: number, value: string) => {
      setComments((prev) => {
        const clusterMembers = prev.clusterMembers
          ? [...prev.clusterMembers]
          : [];
        clusterMembers[index] = value;
        return { ...prev, clusterMembers };
      });
      setHasChanges(true);
    },
    []
  );

  const handleIssuedChange = (value: boolean) => {
    setIssued(value);
    setHasChanges(true);
  };

  // idvtc validation command: main address followed by each cluster member.
  const generateIdvtcCommand = () => {
    const addresses = [
      data?.form.mainAddress,
      ...(data?.form.clusterMembers?.map((m) => m.address) ?? []),
    ].filter(Boolean);
    return `python idvtc.py check ${addresses.join(" ")}`;
  };

  const copyToClipboard = async (text: string, commandType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success(`${commandType} copied to clipboard`);
    } catch {
      notify.error("Failed to copy to clipboard");
    }
  };

  const handleSubmit = () => {
    if (!id || !status) return;

    updateForm(
      {
        resource: "dvt-forms",
        id: parseInt(id),
        values: { status, comments, issued },
      },
      {
        onSuccess: () => {
          setHasChanges(false);
          notify.success("DVT form review updated successfully");
          list("dvt-forms");
        },
        onError: (error) => {
          notify.error(`Failed to save review: ${error.message}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState label="Loading DVT form…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Panel className="mx-4 w-full max-w-md p-8">
          <QueryErrorState
            size="md"
            title="Couldn't load DVT form"
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </Panel>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md pt-10">
        <Panel className="p-8">
          <EmptyState
            icon={AlertTriangle}
            tone="destructive"
            size="md"
            title="DVT form not found"
            description="The requested DVT form could not be found or may have been removed."
            action={
              <Button onClick={() => list("dvt-forms")}>
                <ArrowLeft className="size-4" />
                Back to DVT forms
              </Button>
            }
          />
        </Panel>
      </div>
    );
  }

  const form = data;

  return (
    <div className="space-y-6">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              DVT form review
            </h1>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-medium tabular-nums text-muted-foreground">
              #{form.id}
            </span>
          </div>
          <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            Submitted {new Date(form.createdAt).toLocaleDateString()}
            {form.lastReviewer && (
              <span className="flex items-center gap-1">
                {" · last reviewed by "}
                <ReviewerDisplay reviewer={form.lastReviewer} />
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {form.outdated && (
            <SoftBadge tone="amber" icon={Archive}>
              Outdated
            </SoftBadge>
          )}
          {form.status === "APPROVED" && form.issued && (
            <SoftBadge tone="emerald" icon={CheckCircle}>
              Issued
            </SoftBadge>
          )}
          <DetailStatusBadge status={form.status} />
          <Button variant="outline" onClick={() => list("dvt-forms")}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Submitted DVT Form Data */}
      <Panel className="overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold">Submitted DVT form data</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 xl:grid-cols-2">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Form field data
            </div>

            {/* Main Address */}
            <div className="space-y-2">
              <FieldLabel icon={User}>Main Address</FieldLabel>
              <div className="flex items-center gap-2">
                <p className="flex-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground">
                  {form.form.mainAddress}
                </p>
                <a
                  href={`https://etherscan.io/address/${form.form.mainAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="View on Etherscan"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>

            {/* Discord Link */}
            <div className="space-y-2 border-t pt-5">
              <FieldLabel
                icon={MessageSquare}
                warn={{ count: discordLinkedForms.length }}
              >
                Discord Link
              </FieldLabel>
              <a
                href={form.form.discordLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all rounded-md bg-muted px-3 py-2 text-sm text-primary hover:underline"
              >
                <span className="max-w-xs truncate">
                  {form.form.discordLink.length > 50
                    ? `${form.form.discordLink.substring(0, 50)}...`
                    : form.form.discordLink}
                </span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
              {discordLinkedForms.length > 0 && (
                <div className={cn("space-y-1.5 rounded-md p-2 ring-1 ring-inset", toneSoft.amber)}>
                  {discordLinkedForms.map((linkedForm) => (
                    <div
                      key={linkedForm.id}
                      className="rounded bg-card px-2 py-1.5"
                    >
                      <DvtLinkedFormRowContent
                        form={linkedForm}
                        matchedOn={["discordLink"]}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Telegram Username */}
            {form.form.telegramUsername && (
              <div className="space-y-2 border-t pt-5">
                <FieldLabel
                  icon={Send}
                  warn={{ count: telegramLinkedForms.length }}
                >
                  Telegram Username
                </FieldLabel>
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
                  {form.form.telegramUsername}
                </p>
                {telegramLinkedForms.length > 0 && (
                  <div className={cn("space-y-1.5 rounded-md p-2 ring-1 ring-inset", toneSoft.amber)}>
                    {telegramLinkedForms.map((linkedForm) => (
                      <div
                        key={linkedForm.id}
                        className="rounded bg-card px-2 py-1.5"
                      >
                        <DvtLinkedFormRowContent
                          form={linkedForm}
                          matchedOn={["telegramUsername"]}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cluster Members Table */}
            {form.form.clusterMembers && form.form.clusterMembers.length > 0 && (
              <div className="border-t pt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <FieldLabel icon={Users}>Cluster Members</FieldLabel>
                  <div className="flex items-center gap-2">
                    {icsStatus.hasError && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={icsStatus.refetchAll}
                        disabled={icsStatus.isLoading}
                      >
                        <RefreshCw
                          className={cn("size-3.5", icsStatus.isLoading && "animate-spin")}
                        />
                        Re-check ICS
                      </Button>
                    )}
                    {dvtMatches.hasError && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={dvtMatches.refetchAll}
                        disabled={dvtMatches.isLoading}
                      >
                        <RefreshCw
                          className={cn("size-3.5", dvtMatches.isLoading && "animate-spin")}
                        />
                        Re-check DVT
                      </Button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>ICS</TableHead>
                        <TableHead>Discord Handle</TableHead>
                        <TableHead>Telegram</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.form.clusterMembers.map((member, index) => {
                        const s = icsStatus.get(member.address);
                        const linked =
                          mergedByAddress.get(member.address)?.forms ?? [];
                        const hasLinked = linked.length > 0;
                        const warnSubRow = toneSoft.amber;
                        return (
                          <Fragment key={index}>
                            <TableRow className={hasLinked ? "border-b-0" : ""}>
                              <TableCell className="align-top text-xs font-medium text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="flex items-center gap-1">
                                  {hasLinked && (
                                    <span
                                      className="inline-flex shrink-0 items-center"
                                      title={`Appears in ${linked.length} other DVT application${linked.length === 1 ? "" : "s"}`}
                                      aria-label="Warning: appears in other DVT applications"
                                    >
                                      <AlertTriangle
                                        className={cn("size-3.5", toneIcon.amber)}
                                      />
                                    </span>
                                  )}
                                  <AddressDisplay
                                    address={member.address}
                                    etherscanLink
                                    className="max-w-none"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <IcsStatusBadge
                                  status={s?.status}
                                  isLoading={s?.isLoading ?? false}
                                  isError={s?.isError ?? false}
                                />
                              </TableCell>
                              <TableCell className="align-top text-xs text-muted-foreground">
                                {member.discordHandle || "—"}
                              </TableCell>
                              <TableCell className="align-top text-xs text-muted-foreground">
                                {member.telegramUsername || "—"}
                              </TableCell>
                            </TableRow>
                            {linked.map((linkedForm, lIdx) => {
                              const isLast = lIdx === linked.length - 1;
                              return (
                                <TableRow
                                  key={`${index}-${linkedForm.id}`}
                                  className={`${warnSubRow} ${
                                    isLast ? "" : "border-b-0"
                                  }`.trim()}
                                >
                                  <TableCell
                                    className={cn(
                                      "text-center text-xs",
                                      toneIcon.amber
                                    )}
                                  >
                                    {isLast ? "└" : "├"}
                                  </TableCell>
                                  <TableCell colSpan={4} className="py-2">
                                    <DvtLinkedFormRowContent
                                      form={linkedForm}
                                      matchedOn={linkedForm.matchedOn}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Comments */}
          <div className="space-y-6">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Related comments
            </div>

            {/* Main Address Comment */}
            <div className="space-y-2">
              <FieldLabel icon={User}>Main Address Comment</FieldLabel>
              <Input
                value={comments.mainAddress || ""}
                onChange={(e) =>
                  handleCommentChange("mainAddress", e.target.value)
                }
                placeholder="Add comment to main address"
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            {/* Discord Comment */}
            <div className="space-y-2 border-t pt-5">
              <FieldLabel icon={MessageSquare}>Discord Comment</FieldLabel>
              <Input
                value={comments.discordLink || ""}
                onChange={(e) =>
                  handleCommentChange("discordLink", e.target.value)
                }
                placeholder="Add comment to Discord link"
                readOnly={isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            {/* Telegram Comment */}
            {form.form.telegramUsername && (
              <div className="space-y-2 border-t pt-5">
                <FieldLabel icon={Send}>Telegram Comment</FieldLabel>
                <Input
                  value={comments.telegramUsername || ""}
                  onChange={(e) =>
                    handleCommentChange("telegramUsername", e.target.value)
                  }
                  placeholder="Add comment to Telegram username"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
              </div>
            )}

            {/* Cluster Member Comments */}
            {form.form.clusterMembers && form.form.clusterMembers.length > 0 && (
              <div className="border-t pt-5">
                <div className="mb-3">
                  <FieldLabel icon={Users}>Cluster Member Comments</FieldLabel>
                </div>
                <div className="space-y-3">
                  {form.form.clusterMembers.map((member, index) => (
                    <div key={index} className="rounded-md bg-muted/50 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <SoftBadge tone="emerald" size="sm">
                          Member #{index + 1}
                        </SoftBadge>
                        <AddressDisplay
                          address={member.address}
                          className="max-w-none"
                        />
                      </div>
                      <Input
                        value={comments.clusterMembers?.[index] || ""}
                        onChange={(e) =>
                          handleClusterMemberCommentChange(
                            index,
                            e.target.value
                          )
                        }
                        placeholder={`Add comment to member ${index + 1}`}
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Copy validation command */}
        <div className="border-t px-6 py-6">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Copy validation command
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(generateIdvtcCommand(), "idvtc check command")
              }
            >
              <Copy className="size-3.5" />
              idvtc check
            </Button>
          </div>
        </div>
      </Panel>

      {/* Other DVT Forms from Same Address Section */}
      <OtherFormsFromAddress
        currentFormId={form.id}
        mainAddress={form.form.mainAddress}
        resource="dvt-forms"
        basePath="/dvt-forms"
        proofLabel="DVT Proof"
      />

      {/* Save Review Block */}
      <Panel className="overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold">Review decision</h2>
        </div>
        <div className="space-y-6 p-6">
          {/* Review Status Selection */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TooltipProvider>
              {DECISIONS.map((decision) => {
                const isActive = status === decision.value;
                const { Icon } = decision;
                return (
                  <Tooltip key={decision.value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "outline"}
                        onClick={() => handleStatusChange(decision.value)}
                        disabled={isReadOnly}
                        className={cn(
                          "h-auto flex-col gap-2 py-4",
                          isActive && decision.activeClass
                        )}
                      >
                        <Icon className="size-5" />
                        <div className="text-center">
                          <div className="font-semibold">{decision.label}</div>
                          <div className="mt-0.5 text-xs opacity-75">
                            {decision.hint}
                          </div>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{decision.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>

          {/* Set DVT Proof as Issued - Show when status is approved */}
          {status === "APPROVED" && !isReadOnly && (
            <div className="flex items-center justify-between rounded-md border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={cn(
                    "size-5",
                    issued ? toneIcon.emerald : "text-muted-foreground"
                  )}
                />
                <div>
                  <label
                    htmlFor="issued-switch"
                    className="cursor-pointer text-sm font-medium text-foreground"
                  >
                    DVT Proof issued
                  </label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Form will be read-only after DVT Proof is issued
                  </p>
                </div>
              </div>
              <Switch
                id="issued-switch"
                checked={issued}
                onCheckedChange={handleIssuedChange}
                disabled={isFormIssued}
              />
            </div>
          )}

          {/* Rejection Reason - Only show for rejected status */}
          {status === "REJECTED" && (
            <div className="space-y-2 border-t pt-6">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <CircleX className={cn("size-4", toneIcon.red)} />
                Rejection reason
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
          )}

          {/* Save Button */}
          {!isReadOnly && (
            <div className="space-y-3 border-t pt-6">
              {hasChanges && (
                <Alert className={cn(toneBorder.amber, toneTint.amber)}>
                  <AlertTriangle className={cn("size-4", toneIcon.amber)} />
                  <AlertDescription className="text-sm font-medium">
                    You have unsaved changes
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <Button
                  onClick={handleSubmit}
                  disabled={isUpdating || !hasChanges}
                  className="sm:flex-1"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving review…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save review
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => list("dvt-forms")}>
                  <ArrowLeft className="size-4" />
                  Back to list
                </Button>
              </div>
            </div>
          )}

          {/* Read-only Notice */}
          {isReadOnly && (
            <div className="space-y-4 border-t pt-6">
              {isFormIssued ? (
                <Alert className={cn(toneBorder.emerald, toneTint.emerald)}>
                  <CheckCircle className={cn("size-4", toneIcon.emerald)} />
                  <AlertTitle>DVT Proof issued</AlertTitle>
                  <AlertDescription>
                    DVT Proof has been issued for this form and can no longer be
                    edited.
                  </AlertDescription>
                </Alert>
              ) : isFormOutdated ? (
                <Alert className={cn(toneBorder.amber, toneTint.amber)}>
                  <Archive className={cn("size-4", toneIcon.amber)} />
                  <AlertTitle>Form outdated</AlertTitle>
                  <AlertDescription>
                    This form is outdated and has been replaced by a newer
                    submission for the same address. It cannot be modified.
                  </AlertDescription>
                </Alert>
              ) : isViewer ? (
                <Alert>
                  <Eye className="size-4 text-primary" />
                  <AlertTitle>View-only access</AlertTitle>
                  <AlertDescription>
                    Viewer role has read-only access to DVT form reviews.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Shield className="size-4 text-muted-foreground" />
                  <AlertTitle>Read-only mode</AlertTitle>
                  <AlertDescription>
                    Supervisor role has view-only access to DVT form reviews.
                  </AlertDescription>
                </Alert>
              )}

              {/* Back to List Button for Read-only Mode */}
              <Button variant="outline" onClick={() => list("dvt-forms")}>
                <ArrowLeft className="size-4" />
                Back to list
              </Button>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
};

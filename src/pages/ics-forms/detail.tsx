import {
  useOne,
  useUpdate,
  useNavigation,
  useGetIdentity,
} from "@refinedev/core";
import { useParams } from "react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Clock,
  CircleCheck,
  CircleX,
  Save,
  Loader2,
  AlertTriangle,
  Eye,
  Shield,
  Archive,
  Copy,
} from "lucide-react";
import type {
  AdminIcsFormDetailDto,
  IcsFormStatus,
  IcsCommentsDto,
  IcsScoresDto,
  AdminIdentity,
} from "../../types/api";
import { SCORE_SOURCES } from "../../config/scoringConfig";
import {
  generateRejectionSuggestions,
  type RejectionSuggestion,
} from "../../utils/rejectionSuggestions";
import ScoreGroupCard from "../../components/scoring/ScoreGroupCard";
import TotalScoreCard from "../../components/scoring/TotalScoreCard";
import { OtherFormsFromAddress } from "../../components/OtherFormsFromAddress";
import { cn } from "@/lib/utils";
import {
  Panel,
  QueryErrorState,
  StatusPill,
  SoftBadge,
  Button,
  Switch,
  Input,
  Label,
  Textarea,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DetailStatusBadge,
  ReviewerDisplay,
  LoadingState,
  EmptyState,
  notify,
  toneIcon,
  toneSolid,
  toneGhostHover,
  toneBorder,
  toneTint,
} from "@/components/ui";

const SECTION_LABEL =
  "text-xs font-medium uppercase tracking-wider text-muted-foreground";

const TwitterGlyph = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordGlyph = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
  </svg>
);

export const IcsFormDetail = () => {
  const { id } = useParams();
  const { list } = useNavigation();
  const { mutate: updateForm, mutation: updateMutation } = useUpdate();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const isUpdating = updateMutation.isPending;

  const {
    result: data,
    query: { isLoading, isError, refetch, isFetching },
  } = useOne<AdminIcsFormDetailDto>({
    resource: "ics-forms",
    id: id as string,
  });

  // Check if user is supervisor/viewer or form is issued/outdated (read-only mode)
  const isSupervisor = identity?.role === "SUPERVISOR";
  const isViewer = identity?.role === "VIEWER";
  const isFormIssued = data?.issued ?? false;
  const isFormOutdated = data?.outdated ?? false;
  const isReadOnly = isSupervisor || isViewer || isFormIssued || isFormOutdated;

  const [status, setStatus] = useState<IcsFormStatus>();
  const [comments, setComments] = useState<IcsCommentsDto>({});
  const [scores, setScores] = useState<IcsScoresDto>({});
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
      setScores(data.scores);
      setIssued(data.issued);
      setHasChanges(false);
      initializedId.current = id;
    }
  }, [data, id]);

  const handleStatusChange = useCallback((newStatus: IcsFormStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  }, []);

  const handleCommentChange = useCallback(
    (field: keyof IcsCommentsDto, value: string) => {
      setComments((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  const handleAdditionalAddressCommentChange = useCallback(
    (index: number, value: string) => {
      setComments((prev) => {
        const additionalAddresses = prev.additionalAddresses
          ? [...prev.additionalAddresses]
          : [];
        additionalAddresses[index] = value;
        return { ...prev, additionalAddresses };
      });
      setHasChanges(true);
    },
    []
  );

  const handleScoreChange = useCallback(
    (field: keyof IcsScoresDto, value: number) => {
      setScores((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  const handleIssuedChange = (value: boolean) => {
    setIssued(value);
    setHasChanges(true);
  };

  const handleSubmit = () => {
    if (!id || !status) return;

    updateForm(
      {
        resource: "ics-forms",
        id: parseInt(id),
        values: {
          status,
          comments,
          scores,
          issued,
        },
      },
      {
        onSuccess: () => {
          setHasChanges(false);
          notify.success("Form review updated successfully");
          list("ics-forms");
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
        <LoadingState label="Loading ICS form…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Panel className="mx-4 w-full max-w-md p-8">
          <QueryErrorState
            size="md"
            title="Couldn't load ICS form"
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </Panel>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Panel className="mx-4 w-full max-w-md p-8">
          <EmptyState
            icon={AlertTriangle}
            tone="destructive"
            size="md"
            title="ICS Form not found"
            description="The requested ICS form could not be found or may have been removed."
            action={
              <Button onClick={() => list("ics-forms")}>
                <ArrowLeft className="size-4" />
                Back to ICS Forms list
              </Button>
            }
          />
        </Panel>
      </div>
    );
  }

  const form = data;

  // Helper function to collect all ethereum addresses
  const getAllAddresses = () => {
    const addresses = [form.form.mainAddress];
    if (form.form.additionalAddresses) {
      addresses.push(...form.form.additionalAddresses);
    }
    return addresses;
  };

  // Command generator functions
  const generatePythonCommand = (addresses: string[]) => {
    return `python main.py ${addresses.join(" ")}`;
  };

  const generateUvRunCommand = (addresses: string[]) => {
    return `uv run ics check ${addresses.join(" ")}`;
  };

  const generateAddressesOnly = (addresses: string[]) => {
    return addresses.join(" ");
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, commandType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success(`${commandType} copied to clipboard`);
    } catch {
      notify.error("Failed to copy to clipboard");
    }
  };

  const DECISIONS: {
    value: IcsFormStatus;
    label: string;
    hint: string;
    tooltip: string;
    Icon: typeof Clock;
    activeClass: string;
    idleClass: string;
  }[] = [
    {
      value: "REVIEW",
      label: "Under Review",
      hint: "Pending decision",
      tooltip: "Mark as under review",
      Icon: Clock,
      activeClass: toneSolid.amber,
      idleClass: toneGhostHover.amber,
    },
    {
      value: "APPROVED",
      label: "Approved",
      hint: "Accept form",
      tooltip: "Approve this submission",
      Icon: CircleCheck,
      activeClass: toneSolid.emerald,
      idleClass: toneGhostHover.emerald,
    },
    {
      value: "REJECTED",
      label: "Rejected",
      hint: "Decline form",
      tooltip: "Reject this submission",
      Icon: CircleX,
      activeClass: toneSolid.red,
      idleClass: toneGhostHover.red,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => list("ics-forms")}
            >
              ICS Forms
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>Form #{form.id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              ICS Form Review
            </h1>
            <span className="text-lg font-medium tabular-nums text-muted-foreground">
              #{form.id}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              Submitted {new Date(form.createdAt).toLocaleDateString()}
            </span>
            {form.lastReviewer && (
              <span className="flex items-center gap-1.5">
                Last reviewed by
                <ReviewerDisplay reviewer={form.lastReviewer} />
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {form.outdated && <StatusPill tone="amber">Outdated</StatusPill>}
          {form.status === "APPROVED" && form.issued && (
            <StatusPill tone="emerald">Issued</StatusPill>
          )}
          <DetailStatusBadge status={form.status} />
          <Button variant="outline" onClick={() => list("ics-forms")}>
            <ArrowLeft className="size-4" />
            Back to list
          </Button>
        </div>
      </div>

      {/* Submitted ICS Form Data */}
      <Panel>
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Submitted ICS form data
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 lg:gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-5">
              <div className={SECTION_LABEL}>Form field data</div>

              {/* Main Address */}
              <div className="space-y-2">
                <label className={SECTION_LABEL}>Main address</label>
                <div className="flex items-center gap-2">
                  <p className="flex-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground">
                    {form.form.mainAddress}
                  </p>
                  <a
                    href={`https://etherscan.io/address/${form.form.mainAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    title="View on Etherscan"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>

              {/* Twitter */}
              {form.form.twitterLink && (
                <div className="space-y-2 border-t pt-4">
                  <label className={cn(SECTION_LABEL, "flex items-center gap-1.5")}>
                    <TwitterGlyph className="size-3" />
                    X / Twitter link
                  </label>
                  <a
                    href={form.form.twitterLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 break-all rounded-md bg-muted px-3 py-2 text-sm text-primary transition-colors hover:bg-accent"
                  >
                    <span className="max-w-xs truncate">
                      {form.form.twitterLink.length > 50
                        ? `${form.form.twitterLink.substring(0, 50)}…`
                        : form.form.twitterLink}
                    </span>
                    <ExternalLink className="size-3 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Discord */}
              {form.form.discordLink && (
                <div className="space-y-2 border-t pt-4">
                  <label className={cn(SECTION_LABEL, "flex items-center gap-1.5")}>
                    <DiscordGlyph className="size-3" />
                    Discord link
                  </label>
                  <a
                    href={form.form.discordLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 break-all rounded-md bg-muted px-3 py-2 text-sm text-primary transition-colors hover:bg-accent"
                  >
                    <span className="max-w-xs truncate">
                      {form.form.discordLink.length > 50
                        ? `${form.form.discordLink.substring(0, 50)}…`
                        : form.form.discordLink}
                    </span>
                    <ExternalLink className="size-3 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Additional Addresses */}
              {form.form.additionalAddresses &&
                form.form.additionalAddresses.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <label className={cn(SECTION_LABEL, "flex items-center gap-2")}>
                      Additional addresses
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                        {form.form.additionalAddresses.length}
                      </span>
                    </label>
                    <div className="space-y-2">
                      {form.form.additionalAddresses.map((address, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-md bg-muted/50 p-2"
                        >
                          <span className="flex-shrink-0 text-xs tabular-nums text-muted-foreground">
                            #{index + 1}
                          </span>
                          <p className="flex-1 break-all font-mono text-xs text-foreground">
                            {address}
                          </p>
                          <a
                            href={`https://etherscan.io/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex size-6 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            title="View on Etherscan"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Right Column - Comments */}
            <div className="space-y-5">
              <div className={SECTION_LABEL}>Related comments</div>

              {/* Main Address Comment */}
              <div className="space-y-2">
                <Label className={SECTION_LABEL}>Main address comment</Label>
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

              {/* Twitter Comment */}
              {form.form.twitterLink && (
                <div className="space-y-2 border-t pt-4">
                  <Label className={cn(SECTION_LABEL, "flex items-center gap-1.5")}>
                    <TwitterGlyph className="size-3" />
                    X / Twitter comment
                  </Label>
                  <Input
                    value={comments.twitterLink || ""}
                    onChange={(e) =>
                      handleCommentChange("twitterLink", e.target.value)
                    }
                    placeholder="Add comment to X/Twitter link"
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                </div>
              )}

              {/* Discord Comment */}
              {form.form.discordLink && (
                <div className="space-y-2 border-t pt-4">
                  <Label className={cn(SECTION_LABEL, "flex items-center gap-1.5")}>
                    <DiscordGlyph className="size-3" />
                    Discord comment
                  </Label>
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
              )}

              {/* Additional Addresses Comments */}
              {form.form.additionalAddresses &&
                form.form.additionalAddresses.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <label className={cn(SECTION_LABEL, "flex items-center gap-2")}>
                      Additional address comments
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                        {form.form.additionalAddresses.length}
                      </span>
                    </label>
                    <div className="space-y-2">
                      {form.form.additionalAddresses.map((address, index) => (
                        <div key={index} className="space-y-1.5">
                          <span className="text-xs text-muted-foreground">
                            Address #{index + 1} comment
                          </span>
                          <Input
                            value={
                              comments.additionalAddresses?.[index] || ""
                            }
                            onChange={(e) =>
                              handleAdditionalAddressCommentChange(
                                index,
                                e.target.value
                              )
                            }
                            placeholder={`Add comment to address ${
                              index + 1
                            }`}
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

          <div className="mt-6 border-t pt-6">
            <div className={cn(SECTION_LABEL, "mb-3")}>
              Copy validation command
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const addresses = getAllAddresses();
                  const command = generatePythonCommand(addresses);
                  copyToClipboard(command, "main.py command");
                }}
              >
                <Copy className="size-3.5" />
                main.py
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const addresses = getAllAddresses();
                  const command = generateUvRunCommand(addresses);
                  copyToClipboard(command, "ics check command");
                }}
              >
                <Copy className="size-3.5" />
                ics check
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const addresses = getAllAddresses();
                  const addressesOnly = generateAddressesOnly(addresses);
                  copyToClipboard(addressesOnly, "addresses");
                }}
              >
                <Copy className="size-3.5" />
                addresses
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {/* Other Forms from Same Address Section */}
      <OtherFormsFromAddress
        currentFormId={form.id}
        mainAddress={form.form.mainAddress}
        resource="ics-forms"
        basePath="/forms"
        proofLabel="ICS Proof"
      />

      {/* Scoring Criteria Section */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Scoring criteria
          </h2>
          <p className="text-sm text-muted-foreground">
            Evaluate the application across three key categories.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
          {SCORE_SOURCES.map((group) => (
            <ScoreGroupCard
              key={group.id}
              group={group}
              scores={scores}
              onScoreChange={handleScoreChange}
              disabled={isUpdating || isReadOnly}
            />
          ))}
        </div>
      </div>

      {/* Save Review Block */}
      <Panel>
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold tracking-tight">Save review</h2>
        </div>
        <div className="space-y-8 p-6">
          {/* Total Score Card */}
          <TotalScoreCard scores={scores} />

          {/* Review Status Selection */}
          <div className="space-y-4">
            <h3 className={SECTION_LABEL}>Review decision</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <TooltipProvider>
                {DECISIONS.map((decision) => {
                  const isActive = status === decision.value;
                  const { Icon } = decision;
                  return (
                    <Tooltip key={decision.value}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? "default" : "outline"}
                          size="lg"
                          onClick={() => handleStatusChange(decision.value)}
                          disabled={isReadOnly}
                          className={cn(
                            "h-auto flex-col gap-2 px-8 py-5",
                            isActive ? decision.activeClass : decision.idleClass
                          )}
                        >
                          <Icon className="size-5" />
                          <div className="text-center">
                            <div className="font-semibold">
                              {decision.label}
                            </div>
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
          </div>

          {/* Set ICS Proof as Issued - Show when status is approved */}
          {status === "APPROVED" && !isReadOnly && (
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 p-4">
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
                    ICS Proof issued
                  </label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Form will be read-only after ICS Proof is issued.
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
            <div className="space-y-3">
              <Label className={cn(SECTION_LABEL, "flex items-center gap-1.5")}>
                <CircleX className={cn("size-3.5", toneIcon.red)} />
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

              {/* Rejection Reason Suggestions */}
              {!isReadOnly &&
                (() => {
                  const suggestions = generateRejectionSuggestions(scores);
                  if (suggestions.length === 0) return null;

                  return (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Suggested rejection reasons (click to apply):
                      </div>
                      <div className="space-y-2">
                        {suggestions.map((suggestion: RejectionSuggestion) => (
                          <button
                            type="button"
                            key={suggestion.id}
                            onClick={() =>
                              handleCommentChange("reason", suggestion.text)
                            }
                            className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                          >
                            <div className="text-sm text-foreground">
                              {suggestion.text}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {suggestion.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}

          {/* Save Button */}
          {!isReadOnly && (
            <div className="space-y-3 border-t pt-6">
              <Button
                onClick={handleSubmit}
                disabled={isUpdating || !hasChanges}
                className="h-11 w-full text-base font-medium"
                size="lg"
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

              {/* Back to List Button */}
              <Button
                variant="outline"
                onClick={() => list("ics-forms")}
                className="h-10 w-full"
                size="lg"
              >
                <ArrowLeft className="size-4" />
                Back to list
              </Button>

              {hasChanges && (
                <SoftBadge
                  tone="amber"
                  icon={AlertTriangle}
                  className="w-full justify-start px-3 py-2"
                >
                  You have unsaved changes
                </SoftBadge>
              )}
            </div>
          )}

          {/* Read-only Notice */}
          {isReadOnly && (
            <div className="space-y-4 border-t pt-6">
              {isFormIssued ? (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4",
                    toneBorder.emerald,
                    toneTint.emerald
                  )}
                >
                  <CheckCircle
                    className={cn(
                      "mt-0.5 size-4 flex-shrink-0",
                      toneIcon.emerald
                    )}
                  />
                  <div>
                    <p className={cn("text-sm font-medium", toneIcon.emerald)}>
                      ICS Proof issued
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      ICS Proof has been issued for this form and can no longer
                      be edited.
                    </p>
                  </div>
                </div>
              ) : isFormOutdated ? (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4",
                    toneBorder.amber,
                    toneTint.amber
                  )}
                >
                  <Archive
                    className={cn(
                      "mt-0.5 size-4 flex-shrink-0",
                      toneIcon.amber
                    )}
                  />
                  <div>
                    <p className={cn("text-sm font-medium", toneIcon.amber)}>
                      Form outdated
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      This form is outdated and has been replaced by a newer
                      submission for the same address. It cannot be modified.
                    </p>
                  </div>
                </div>
              ) : isViewer ? (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                  <Eye className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      View-only access
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Viewer role has read-only access to ICS form reviews.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                  <Shield className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Read-only mode
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Supervisor role has view-only access to ICS form reviews.
                    </p>
                  </div>
                </div>
              )}

              {/* Back to List Button for Read-only Mode */}
              <Button
                variant="outline"
                onClick={() => list("ics-forms")}
                className="h-10 w-full"
                size="lg"
              >
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

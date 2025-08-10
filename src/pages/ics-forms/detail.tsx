import { useOne, useUpdate, useNavigation, useGetIdentity } from "@refinedev/core";
import { useParams } from "react-router";
import { useState } from "react";
import React from "react";
import {
  ArrowLeft,
  CheckCircle,
  User,
  Globe,
  Hash,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const StatusBadge = ({ status }: { status: IcsFormStatus }) => {
  const statusConfig = {
    REVIEW: {
      variant: "secondary" as const,
      className:
        "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold px-3 py-1.5 shadow-sm",
      Icon: Clock,
    },
    APPROVED: {
      variant: "default" as const,
      className:
        "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 font-semibold px-3 py-1.5 shadow-sm",
      Icon: CircleCheck,
    },
    REJECTED: {
      variant: "destructive" as const,
      className:
        "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700 font-semibold px-3 py-1.5 shadow-sm",
      Icon: CircleX,
    },
  } as const;

  const config = statusConfig[status];
  const IconComponent = config.Icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <IconComponent className="w-4 h-4 mr-1.5" />
      {status}
    </Badge>
  );
};

export const IcsFormDetail = () => {
  const { id } = useParams();
  const { list } = useNavigation();
  const { mutate: updateForm, status: updateStatus } = useUpdate();
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const isUpdating = updateStatus === "loading";

  const { data, isLoading } = useOne<AdminIcsFormDetailDto>({
    resource: "ics-forms",
    id: id as string,
  });

  // Check if user is supervisor/viewer or form is issued/outdated (read-only mode)
  const isSupervisor = identity?.role === "SUPERVISOR";
  const isViewer = identity?.role === "VIEWER";
  const isFormIssued = data?.data?.issued ?? false;
  const isFormOutdated = data?.data?.outdated ?? false;
  const isReadOnly = isSupervisor || isViewer || isFormIssued || isFormOutdated;

  const [status, setStatus] = useState<IcsFormStatus>();
  const [comments, setComments] = useState<IcsCommentsDto>({});
  const [scores, setScores] = useState<IcsScoresDto>({});
  const [issued, setIssued] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when loaded
  React.useEffect(() => {
    if (data?.data) {
      setStatus(data.data.status);
      setComments(data.data.comments);
      setScores(data.data.scores);
      setIssued(data.data.issued);
    }
  }, [data?.data]);

  const handleStatusChange = (newStatus: IcsFormStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleCommentChange = (field: keyof IcsCommentsDto, value: string) => {
    setComments((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAdditionalAddressCommentChange = (
    index: number,
    value: string
  ) => {
    setComments((prev) => {
      const additionalAddresses = prev.additionalAddresses
        ? [...prev.additionalAddresses]
        : [];
      additionalAddresses[index] = value;
      return { ...prev, additionalAddresses };
    });
    setHasChanges(true);
  };

  const handleScoreChange = (field: keyof IcsScoresDto, value: number) => {
    setScores((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

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
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="space-y-8">
            {/* Breadcrumb Skeleton */}
            <Skeleton className="h-4 w-48" />

            {/* Header Skeleton */}
            <Card>
              <CardHeader className="pb-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex space-x-3">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/30 dark:to-indigo-900/50 flex items-center justify-center">
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl shadow-slate-200/60 ring-1 ring-slate-200/60 max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                ICS Form Not Found
              </h3>
              <p className="text-slate-600">
                The requested ICS form could not be found or may have been
                removed.
              </p>
            </div>

            <Button
              onClick={() => list("ics-forms")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to ICS Forms List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = data.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
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
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div>
                  <CardTitle className="text-3xl font-bold">
                    ICS Form Review
                  </CardTitle>
                  <div className="text-lg font-semibold text-muted-foreground mt-1">
                    #{form.id}
                  </div>
                </div>
                <CardDescription className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      Submitted on{" "}
                      {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {form.lastReviewer && (
                    <div className="flex items-center space-x-2">
                      <span>
                        Last reviewed by:{" "}
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {form.lastReviewer.startsWith("0x")
                            ? `${form.lastReviewer.slice(
                                0,
                                8
                              )}...${form.lastReviewer.slice(-6)}`
                            : form.lastReviewer}
                        </code>
                      </span>
                    </div>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {form.outdated && (
                    <Badge
                      variant="outline"
                      className="border-amber-200 text-amber-700 bg-amber-50"
                    >
                      <Archive className="w-3 h-3 mr-1" />
                      Outdated
                    </Badge>
                  )}
                  {form.status === "APPROVED" && form.issued && (
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700 bg-green-50"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Issued
                    </Badge>
                  )}
                  <StatusBadge status={form.status} />
                </div>
                <Button variant="outline" onClick={() => list("ics-forms")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Submitted ICS Form Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 text-primary mr-3" />
              Submitted ICS Form Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Column - Form Fields */}
              <div className="space-y-6">
                <div className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-4">
                  Form Field Data
                </div>

                {/* Main Address */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    Main Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm text-foreground bg-muted px-3 py-2 rounded-lg flex-1 break-all">
                      {form.form.mainAddress}
                    </p>
                    <a
                      href={`https://etherscan.io/address/${form.form.mainAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-colors duration-200"
                      title="View on Etherscan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Twitter */}
                {form.form.twitterLink && (
                  <div className="space-y-3 border-t border-slate-200/50 pt-4">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      X/Twitter Link
                    </label>
                    <a
                      href={form.form.twitterLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center bg-muted px-3 py-2 rounded-lg break-all"
                    >
                      <span className="truncate max-w-xs">
                        {form.form.twitterLink.length > 50
                          ? `${form.form.twitterLink.substring(0, 50)}...`
                          : form.form.twitterLink}
                      </span>
                      <svg
                        className="w-3 h-3 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}

                {/* Discord */}
                {form.form.discordLink && (
                  <div className="space-y-3 border-t border-slate-200/50 pt-4">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                      </svg>
                      Discord Link
                    </label>
                    <a
                      href={form.form.discordLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center bg-muted px-3 py-2 rounded-lg break-all"
                    >
                      <span className="truncate max-w-xs">
                        {form.form.discordLink.length > 50
                          ? `${form.form.discordLink.substring(0, 50)}...`
                          : form.form.discordLink}
                      </span>
                      <svg
                        className="w-3 h-3 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}

                {/* Additional Addresses */}
                {form.form.additionalAddresses &&
                  form.form.additionalAddresses.length > 0 && (
                    <div className="border-t border-slate-200/50 pt-4">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center mb-3">
                        <Hash className="w-3 h-3 mr-1" />
                        Additional Addresses
                        <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          {form.form.additionalAddresses.length}
                        </span>
                      </label>
                      <div className="space-y-3">
                        {form.form.additionalAddresses.map((address, index) => (
                          <div
                            key={index}
                            className="bg-muted/50 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                                #{index + 1}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className="font-mono text-xs text-slate-900 bg-white px-2 py-1.5 rounded flex-1 break-all">
                                {address}
                              </p>
                              <a
                                href={`https://etherscan.io/address/${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-6 h-6 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded transition-colors duration-200"
                                title="View on Etherscan"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Right Column - Comments */}
              <div className="space-y-6">
                <div className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-4">
                  Related Comments
                </div>

                {/* Main Address Comment */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    Main Address Comment
                  </Label>
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
                  <div className="space-y-3 border-t border-border pt-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      X/Twitter Comment
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
                  <div className="space-y-3 border-t border-border pt-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                      </svg>
                      Discord Comment
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
                    <div className="border-t border-slate-200/50 pt-4">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center mb-3">
                        <Hash className="w-3 h-3 mr-1" />
                        Additional Address Comments
                        <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          {form.form.additionalAddresses.length}
                        </span>
                      </label>
                      <div className="space-y-3">
                        {form.form.additionalAddresses.map((address, index) => (
                          <div
                            key={index}
                            className="bg-muted/50 rounded-lg p-3"
                          >
                            <div className="mb-2">
                              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                                Address #{index + 1} Comment
                              </span>
                            </div>
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
          </CardContent>
        </Card>

        {/* Scoring Criteria Section */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <div className="mb-4">
              <h2 className="text-3xl font-bold mb-2">Scoring Criteria</h2>
              <p className="text-lg text-muted-foreground">
                Evaluate the application across three key categories
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
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
        <Card>
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold mb-2">
              Save Review
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {/* Enhanced Total Score Card */}
            <div className="mb-10">
              <TotalScoreCard scores={scores} />
            </div>

            {/* Review Status Selection */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-6 text-center">
                Review Decision
              </h3>
              <div className="flex justify-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={status === "REVIEW" ? "default" : "outline"}
                        size="lg"
                        onClick={() => handleStatusChange("REVIEW")}
                        disabled={isReadOnly}
                        className={`h-auto flex flex-col gap-2 px-8 py-5 ${
                          status === "REVIEW"
                            ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                            : "hover:border-amber-200 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/30"
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                        <div className="text-center">
                          <div className="font-semibold">Under Review</div>
                          <div className="text-xs opacity-75 mt-0.5">
                            Pending decision
                          </div>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mark as under review</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={status === "APPROVED" ? "default" : "outline"}
                        size="lg"
                        onClick={() => handleStatusChange("APPROVED")}
                        disabled={isReadOnly}
                        className={`h-auto flex flex-col gap-2 px-8 py-5 ${
                          status === "APPROVED"
                            ? "bg-green-600 hover:bg-green-700 border-green-600 text-white"
                            : "hover:border-green-200 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-900/30"
                        }`}
                      >
                        <CircleCheck className="w-5 h-5" />
                        <div className="text-center">
                          <div className="font-semibold">Approved</div>
                          <div className="text-xs opacity-75 mt-0.5">
                            Accept form
                          </div>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Approve this submission</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={status === "REJECTED" ? "default" : "outline"}
                        size="lg"
                        onClick={() => handleStatusChange("REJECTED")}
                        disabled={isReadOnly}
                        className={`h-auto flex flex-col gap-2 px-8 py-5 ${
                          status === "REJECTED"
                            ? "bg-red-600 hover:bg-red-700 border-red-600 text-white"
                            : "hover:border-red-200 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-900/30"
                        }`}
                      >
                        <CircleX className="w-5 h-5" />
                        <div className="text-center">
                          <div className="font-semibold">Rejected</div>
                          <div className="text-xs opacity-75 mt-0.5">
                            Decline form
                          </div>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reject this submission</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Set ICS Proof as Issued - Show when status is approved */}
            {status === "APPROVED" && !isReadOnly && (
              <>
                <Separator className="my-8" />
                <div className="mt-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {issued ? (
                        <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      )}
                      <div>
                        <label
                          htmlFor="issued-switch"
                          className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          ICS Proof issued
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Form will be read-only after ICS Proof is issued
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="issued-switch"
                      checked={issued}
                      onCheckedChange={handleIssuedChange}
                      disabled={isFormIssued}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Rejection Reason - Only show for rejected status */}
            {status === "REJECTED" && (
              <>
                <Separator className="my-8" />
                <div className="space-y-4">
                  <Label className="text-sm font-semibold flex items-center">
                    <CircleX className="w-4 h-4 text-red-500 mr-2" />
                    Rejection Reason
                  </Label>
                  <Textarea
                    value={comments.reason || ""}
                    onChange={(e) =>
                      handleCommentChange("reason", e.target.value)
                    }
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
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Suggested rejection reasons (click to apply):
                          </div>
                          <div className="space-y-2">
                            {suggestions.map(
                              (suggestion: RejectionSuggestion) => (
                                <div
                                  key={suggestion.id}
                                  onClick={() =>
                                    handleCommentChange(
                                      "reason",
                                      suggestion.text
                                    )
                                  }
                                  className="p-3 border border-border rounded-lg cursor-pointer hover:bg-accent hover:border-accent-foreground/20 transition-colors"
                                >
                                  <div className="text-sm text-foreground">
                                    {suggestion.text}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {suggestion.description}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </>
            )}

            {/* Enhanced Save Button */}
            {!isReadOnly && (
              <>
                <Separator className="my-8" />
                <div className="space-y-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isUpdating || !hasChanges}
                    className="w-full h-14 text-lg font-bold"
                    size="lg"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        <span>Saving Review...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-3" />
                        <span>Save Review</span>
                      </>
                    )}
                  </Button>

                  {/* Back to List Button */}
                  <Button
                    variant="outline"
                    onClick={() => list("ics-forms")}
                    className="w-full h-12 text-base font-medium"
                    size="lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to List
                  </Button>

                  {hasChanges && (
                    <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/30">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm font-medium">
                        You have unsaved changes
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}

            {/* Read-only Notice */}
            {isReadOnly && (
              <div className="py-6 space-y-4">
                {isFormIssued ? (
                  <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-200">
                      ICS Proof Issued
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      ICS Proof has been issued for this form and can no longer
                      be edited.
                    </AlertDescription>
                  </Alert>
                ) : isFormOutdated ? (
                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30">
                    <Archive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200">
                      Form Outdated
                    </AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      This form is outdated and has been replaced by a newer submission for the same address. It cannot be modified.
                    </AlertDescription>
                  </Alert>
                ) : isViewer ? (
                  <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30">
                    <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-800 dark:text-blue-200">
                      View-Only Access
                    </AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      Viewer role has read-only access to ICS form reviews.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30">
                    <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200">
                      Read-Only Mode
                    </AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      Supervisor role has view-only access to ICS form reviews.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Back to List Button for Read-only Mode */}
                <Button
                  variant="outline"
                  onClick={() => list("ics-forms")}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

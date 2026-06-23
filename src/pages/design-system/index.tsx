import { useState, type ReactNode } from "react";
import {
  Beaker,
  Inbox,
  Layers,
  Lock,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  AddressDisplay,
  Button,
  DataPagination,
  DateRangeFilter,
  type DateRange,
  DetailStatusBadge,
  EmptyState,
  Field,
  FilterToolbar,
  IcsStatusBadge,
  Input,
  Label,
  LoadingState,
  Panel,
  ReviewerDisplay,
  RoleBadge,
  SearchInput,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SoftBadge,
  SortableHeader,
  StatusBadge,
  StatusPill,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  Textarea,
  TONES,
  type Tone,
  toneDot,
  toneIcon,
  notify,
} from "@/components/ui";
import type { FormStatus } from "@/types/api";
import { cn } from "@/lib/utils";

/* ── Local layout helpers ──────────────────────────────────────────────────
 * Two tiny presentational helpers kept in-file so the showcase stays a single
 * self-contained reference. `Section` gives every block a consistent titled
 * header + generous rhythm; `Row` lays out labelled component specimens.
 */

const Section = ({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) => (
  <section
    id={id}
    className="scroll-mt-24 border-t border-border pt-12 first:border-t-0 first:pt-0"
  >
    <div className="mb-6 space-y-1">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {children}
  </section>
);

const Row = ({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {children}
    </div>
  </div>
);

/* Semantic color tokens — each renders via its Tailwind utility, never a
 * palette literal, so the swatch is exactly what feature code consumes. */
const SEMANTIC_TOKENS: { name: string; swatch: string; border?: boolean }[] = [
  { name: "background", swatch: "bg-background", border: true },
  { name: "card", swatch: "bg-card", border: true },
  { name: "foreground", swatch: "bg-foreground" },
  { name: "muted", swatch: "bg-muted", border: true },
  { name: "primary", swatch: "bg-primary" },
  { name: "secondary", swatch: "bg-secondary", border: true },
  { name: "accent", swatch: "bg-accent", border: true },
  { name: "destructive", swatch: "bg-destructive" },
  { name: "border", swatch: "bg-border" },
];

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const FORM_STATUSES: FormStatus[] = ["REVIEW", "APPROVED", "REJECTED"];

const SAMPLE_ROWS = [
  {
    id: 1,
    address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    status: "REVIEW" as FormStatus,
    reviewer: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    score: 42,
  },
  {
    id: 2,
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    status: "APPROVED" as FormStatus,
    reviewer: "alice.eth",
    score: 88,
  },
  {
    id: 3,
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    status: "REJECTED" as FormStatus,
    reviewer: null,
    score: 17,
  },
];

type SortKey = "id" | "score";

export const DesignSystemShowcase = () => {
  // Interactive demo state — all local, no backend, no auth.
  const [segment, setSegment] = useState<"all" | "review" | "approved">("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [notifications, setNotifications] = useState(true);

  // Filter-toolbar demo — search, date range, and two segmented filters, all local.
  const [toolbarSearch, setToolbarSearch] = useState("");
  const [toolbarRange, setToolbarRange] = useState<DateRange>({
    from: "",
    to: "",
  });
  const [toolbarStatus, setToolbarStatus] = useState<
    "all" | "review" | "approved" | "rejected"
  >("all");
  const [toolbarIcs, setToolbarIcs] = useState<"any" | "ics" | "not-ics">("any");

  const resetToolbar = () => {
    setToolbarSearch("");
    setToolbarRange({ from: "", to: "" });
    setToolbarStatus("all");
    setToolbarIcs("any");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedRows = [...SAMPLE_ROWS].sort((a, b) => {
    const dir = sortOrder === "asc" ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * dir;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky top bar — title + live theme toggle for reviewers. */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Design System
              </h1>
              <p className="text-sm text-muted-foreground">
                Every component, token, and state — flip the theme to verify
                both modes.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto space-y-12 px-4 py-12">
        {/* (a) Color tokens ───────────────────────────────────────────── */}
        <Section
          id="color-tokens"
          title="Color tokens"
          description="Semantic tokens drive every surface; the five tones drive every status marker."
        >
          <div className="space-y-8">
            <Row label="Semantic tokens" className="gap-6">
              {SEMANTIC_TOKENS.map((token) => (
                <div key={token.name} className="flex flex-col gap-2">
                  <div
                    className={cn(
                      "size-16 rounded-lg",
                      token.swatch,
                      token.border && "border border-border"
                    )}
                  />
                  <code className="text-xs text-muted-foreground">
                    {token.name}
                  </code>
                </div>
              ))}
            </Row>

            <div className="space-y-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tones
              </span>
              <Panel className="divide-y divide-border overflow-hidden">
                {TONES.map((tone) => (
                  <div
                    key={tone}
                    className="grid grid-cols-[7rem_1fr] items-center gap-4 px-4 py-3 sm:grid-cols-[7rem_repeat(3,minmax(0,1fr))]"
                  >
                    <code className="text-sm font-medium">{tone}</code>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("size-2.5 rounded-full", toneDot[tone])}
                        aria-hidden
                      />
                      <span className="text-xs text-muted-foreground">
                        toneDot
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <SoftBadge tone={tone} size="sm">
                        toneSoft
                      </SoftBadge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className={cn("size-4", toneIcon[tone])} />
                      <span className="text-xs text-muted-foreground">
                        toneIcon
                      </span>
                    </div>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        </Section>

        {/* (b) Typography ─────────────────────────────────────────────── */}
        <Section
          id="typography"
          title="Typography scale"
          description="A restrained scale: tight tracking on headings, muted secondary text."
        >
          <div className="space-y-4">
            <p className="text-3xl font-semibold tracking-tight">
              Display · text-3xl semibold
            </p>
            <p className="text-2xl font-semibold tracking-tight">
              Heading · text-2xl semibold
            </p>
            <p className="text-lg font-semibold tracking-tight">
              Subheading · text-lg semibold
            </p>
            <p className="text-base">Body · text-base regular</p>
            <p className="text-sm text-muted-foreground">
              Secondary · text-sm muted-foreground
            </p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Overline · text-xs uppercase tracking-wider
            </p>
            <code className="block font-mono text-sm text-muted-foreground">
              Mono · 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984
            </code>
          </div>
        </Section>

        {/* (c) Buttons ────────────────────────────────────────────────── */}
        <Section
          id="buttons"
          title="Buttons"
          description="All variants across the four sizes, plus icon and disabled states."
        >
          <div className="space-y-6">
            {(["default", "sm", "lg"] as const).map((size) => (
              <Row key={size} label={`size: ${size}`}>
                {BUTTON_VARIANTS.map((variant) => (
                  <Button key={variant} variant={variant} size={size}>
                    {variant}
                  </Button>
                ))}
              </Row>
            ))}
            <Row label="icon + disabled">
              <Button size="icon" aria-label="Add">
                <Plus />
              </Button>
              <Button size="icon" variant="outline" aria-label="Delete">
                <Trash2 />
              </Button>
              <Button>
                <Plus />
                With icon
              </Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
            </Row>
          </div>
        </Section>

        {/* (d) Status markers ─────────────────────────────────────────── */}
        <Section
          id="status-markers"
          title="Status markers"
          description="Pills, soft badges, and the domain status badges — all tone-driven."
        >
          <div className="space-y-8">
            <Row label="StatusPill · size sm">
              {TONES.map((tone) => (
                <StatusPill key={tone} tone={tone} size="sm">
                  {tone}
                </StatusPill>
              ))}
            </Row>
            <Row label="StatusPill · size md">
              {TONES.map((tone) => (
                <StatusPill key={tone} tone={tone} size="md">
                  {tone}
                </StatusPill>
              ))}
            </Row>
            <Row label="SoftBadge · with icon">
              {TONES.map((tone) => (
                <SoftBadge key={tone} tone={tone} icon={Sparkles}>
                  {tone}
                </SoftBadge>
              ))}
            </Row>
            <Row label="SoftBadge · no icon · size sm">
              {TONES.map((tone) => (
                <SoftBadge key={tone} tone={tone} size="sm">
                  {tone}
                </SoftBadge>
              ))}
            </Row>
            <Row label="StatusBadge {status}">
              {FORM_STATUSES.map((status) => (
                <StatusBadge key={status} status={status} />
              ))}
            </Row>
            <Row label="DetailStatusBadge {status}">
              {FORM_STATUSES.map((status) => (
                <DetailStatusBadge key={status} status={status} />
              ))}
            </Row>
            <Row label="RoleBadge {role}">
              {(["VIEWER", "REVIEWER", "SUPERVISOR"] as const).map((role) => (
                <RoleBadge key={role} role={role} />
              ))}
            </Row>
            <Row label="IcsStatusBadge">
              <IcsStatusBadge isLoading isError={false} />
              <IcsStatusBadge isLoading={false} isError />
              <IcsStatusBadge isLoading={false} isError={false} status="ICS" />
              <IcsStatusBadge
                isLoading={false}
                isError={false}
                status="NOT_ICS"
              />
            </Row>
          </div>
        </Section>

        {/* (e) Form controls ──────────────────────────────────────────── */}
        <Section
          id="form-controls"
          title="Form controls"
          description="Field wraps a label, control, and help/error text. Switch toggles a setting."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <Field
              label="Wallet address"
              htmlFor="ds-address"
              description="The applicant's primary staking address."
              required
            >
              <Input
                id="ds-address"
                placeholder="0x…"
                defaultValue="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
              />
            </Field>
            <Field
              label="Review notes"
              htmlFor="ds-notes"
              error="Notes are required before rejecting."
              required
            >
              <Textarea
                id="ds-notes"
                placeholder="Explain the decision…"
                rows={3}
              />
            </Field>
            <Field
              label="Status"
              htmlFor="ds-status"
              description="Set the review outcome."
            >
              <Select defaultValue="REVIEW">
                <SelectTrigger id="ds-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORM_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-start gap-3">
              <Switch
                id="ds-notify"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
              <div className="space-y-1">
                <Label htmlFor="ds-notify">Email notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Send a toast and an email when a form changes status.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* (f) Search ─────────────────────────────────────────────────── */}
        <Section
          id="search"
          title="Search input"
          description="Leading icon; mono variant for addresses and hashes."
        >
          <div className="grid gap-4 sm:max-w-xl sm:grid-cols-2">
            <SearchInput placeholder="Search forms…" />
            <SearchInput mono placeholder="0x address…" />
          </div>
        </Section>

        {/* (g) Segmented control ──────────────────────────────────────── */}
        <Section
          id="segmented-control"
          title="Segmented control"
          description="Compact, mutually-exclusive toggle backed by local state."
        >
          <div className="flex flex-col gap-3">
            <SegmentedControl
              aria-label="Filter by status"
              value={segment}
              onChange={setSegment}
              options={[
                { label: "All", value: "all" },
                { label: "In review", value: "review" },
                { label: "Approved", value: "approved" },
              ]}
            />
            <span className="text-sm text-muted-foreground">
              Current value: <code className="text-foreground">{segment}</code>
            </span>
          </div>
        </Section>

        {/* (h) Filter toolbar ─────────────────────────────────────────── */}
        <Section
          id="filter-toolbar"
          title="Filter toolbar"
          description="The canonical list-page toolbar: search and date range flow left, the Filters cluster pushes right, Reset trails at the edge. Lives at the top of a Panel, above the table."
        >
          <div className="space-y-6">
            <Panel className="overflow-hidden">
              <FilterToolbar onReset={resetToolbar}>
                <SearchInput
                  placeholder="Search forms…"
                  value={toolbarSearch}
                  onChange={(e) => setToolbarSearch(e.target.value)}
                  containerClassName="sm:max-w-xs"
                />
                <DateRangeFilter
                  value={toolbarRange}
                  onChange={setToolbarRange}
                />
                <FilterToolbar.Filters>
                  <SegmentedControl
                    aria-label="Filter by status"
                    value={toolbarStatus}
                    onChange={setToolbarStatus}
                    options={[
                      { label: "All", value: "all" },
                      { label: "In review", value: "review" },
                      { label: "Approved", value: "approved" },
                      { label: "Rejected", value: "rejected" },
                    ]}
                  />
                  <SegmentedControl
                    aria-label="Filter by ICS eligibility"
                    value={toolbarIcs}
                    onChange={setToolbarIcs}
                    options={[
                      { label: "Any", value: "any" },
                      { label: "ICS", value: "ics" },
                      { label: "Not ICS", value: "not-ics" },
                    ]}
                  />
                </FilterToolbar.Filters>
              </FilterToolbar>
              <div className="p-4 text-sm text-muted-foreground">
                Live filter state — search{" "}
                <code className="text-foreground">
                  {toolbarSearch || "∅"}
                </code>
                , from{" "}
                <code className="text-foreground">
                  {toolbarRange.from || "∅"}
                </code>{" "}
                to{" "}
                <code className="text-foreground">{toolbarRange.to || "∅"}</code>
                , status{" "}
                <code className="text-foreground">{toolbarStatus}</code>, ICS{" "}
                <code className="text-foreground">{toolbarIcs}</code>.
              </div>
            </Panel>

            <Row label="DateRangeFilter · standalone">
              <DateRangeFilter
                value={toolbarRange}
                onChange={setToolbarRange}
              />
            </Row>
          </div>
        </Section>

        {/* (i) Data table ─────────────────────────────────────────────── */}
        <Section
          id="data-table"
          title="Data table"
          description="Panel + sortable headers + skeleton + empty state + pagination."
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Switch
                id="ds-skeleton"
                checked={showSkeleton}
                onCheckedChange={setShowSkeleton}
              />
              <Label htmlFor="ds-skeleton">Show loading skeleton</Label>
            </div>

            <Panel className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader
                        label="ID"
                        active={sortKey === "id"}
                        order={sortOrder}
                        onClick={() => toggleSort("id")}
                      />
                    </TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead className="text-right">
                      <SortableHeader
                        label="Score"
                        active={sortKey === "score"}
                        order={sortOrder}
                        onClick={() => toggleSort("score")}
                        className="ml-auto"
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showSkeleton ? (
                    <TableSkeleton
                      rows={3}
                      columns={[
                        { width: "h-4 w-8" },
                        { width: "h-4 w-40" },
                        { width: "h-4 w-20" },
                        { width: "h-4 w-24" },
                        { width: "h-4 w-10", align: "right" },
                      ]}
                    />
                  ) : (
                    sortedRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.id}
                        </TableCell>
                        <TableCell>
                          <AddressDisplay address={row.address} etherscanLink />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell>
                          <ReviewerDisplay reviewer={row.reviewer} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.score}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <DataPagination
                currentPage={page}
                pageSize={pageSize}
                total={248}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </Panel>

            <div className="space-y-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                EmptyState · inside a table
              </span>
              <Panel className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={2} className="py-14">
                        <EmptyState
                          icon={Inbox}
                          title="No forms match these filters"
                          description="Try clearing the search or status filter."
                          action={
                            <Button variant="outline" size="sm">
                              Clear filters
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Panel>
            </div>
          </div>
        </Section>

        {/* (i) Feedback ───────────────────────────────────────────────── */}
        <Section
          id="feedback"
          title="Feedback · notify"
          description="Every notify.* method fires a toast through the centralized wrapper."
        >
          <Row label="notify.*">
            <Button
              variant="outline"
              onClick={() => notify.success("Form approved")}
            >
              success
            </Button>
            <Button
              variant="outline"
              onClick={() => notify.error("Failed to save review")}
            >
              error
            </Button>
            <Button
              variant="outline"
              onClick={() => notify.info("3 new forms awaiting review")}
            >
              info
            </Button>
            <Button
              variant="outline"
              onClick={() => notify.warning("Network mismatch detected")}
            >
              warning
            </Button>
            <Button
              variant="outline"
              onClick={() => notify.message("Saved as draft")}
            >
              message
            </Button>
            <Button
              variant="outline"
              onClick={() => notify.loading("Submitting review…")}
            >
              loading
            </Button>
          </Row>
        </Section>

        {/* (j) States ─────────────────────────────────────────────────── */}
        <Section
          id="states"
          title="States"
          description="Full-panel loading and empty states (neutral + destructive)."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <Panel className="p-8">
              <LoadingState className="min-h-[12rem]" label="Loading forms…" />
            </Panel>
            <Panel className="p-8">
              <EmptyState
                icon={Beaker}
                title="Nothing here yet"
                description="Submitted forms will appear in this list."
                size="md"
                action={
                  <Button size="sm">
                    <Plus />
                    New form
                  </Button>
                }
              />
            </Panel>
            <Panel className="p-8">
              <EmptyState
                icon={ShieldAlert}
                tone="destructive"
                title="Access restricted"
                description="You need the SUPERVISOR role to view this page."
                size="md"
                action={
                  <Button variant="outline" size="sm">
                    <Lock />
                    Request access
                  </Button>
                }
              />
            </Panel>
          </div>
        </Section>

        <footer className="border-t border-border pt-8 text-sm text-muted-foreground">
          One source of truth — imported entirely from{" "}
          <code className="text-foreground">@/components/ui</code>. Tones:{" "}
          {(TONES as Tone[]).join(", ")}.
        </footer>
      </main>
    </div>
  );
};

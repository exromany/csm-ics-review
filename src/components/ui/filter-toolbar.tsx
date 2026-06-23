import { createContext, useContext, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const FilterToolbarContext = createContext<{
  onReset?: () => void
  resetLabel: string
  resetDisabled: boolean
}>({ resetLabel: "Reset", resetDisabled: false })

/**
 * Canonical filter toolbar shared by every list page — the bordered, padded row
 * that sits at the top of a `Panel`, above the table.
 *
 * It owns the layout so pages never re-roll it: a single `flex-wrap` row where
 * primary inputs (search, date range) flow from the left and the `Filters`
 * cluster pushes to the right. The whole row wraps gracefully on narrow screens.
 *
 * The `Reset` button (rendered when `onReset` is given) lives *inside* the
 * `Filters` cluster so it stays grouped with the controls and flush-right —
 * whether the toolbar fits on one line or the cluster wraps below the inputs.
 *
 * ```tsx
 * <FilterToolbar onReset={resetTableState}>
 *   <SearchInput … />
 *   <DateRangeFilter … />
 *   <FilterToolbar.Filters>
 *     <SegmentedControl … />
 *   </FilterToolbar.Filters>
 * </FilterToolbar>
 * ```
 */
function FilterToolbar({
  children,
  onReset,
  resetLabel = "Reset",
  resetDisabled = false,
  className,
}: {
  children: ReactNode
  /** When provided, renders the reset button at the end of the Filters cluster. */
  onReset?: () => void
  resetLabel?: string
  /** Disables the reset button — pass `true` when nothing is filtered/sorted. */
  resetDisabled?: boolean
  className?: string
}) {
  return (
    <FilterToolbarContext.Provider value={{ onReset, resetLabel, resetDisabled }}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 border-b p-3",
          className
        )}
      >
        {children}
      </div>
    </FilterToolbarContext.Provider>
  )
}

/**
 * Right-aligned cluster of filter controls (segmented controls, selects). The
 * `sm:ml-auto` push separates primary inputs on the left from filters on the
 * right; `sm:justify-end` keeps the cluster — and its trailing reset button —
 * flush-right on every wrapped line.
 */
function FilterToolbarFilters({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { onReset, resetLabel, resetDisabled } = useContext(FilterToolbarContext)
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 sm:ml-auto sm:justify-end",
        className
      )}
    >
      {children}
      {onReset ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={resetDisabled}
          title="Reset all filters, sorting, and pagination to defaults"
          className="text-muted-foreground hover:text-foreground"
        >
          {resetLabel}
        </Button>
      ) : null}
    </div>
  )
}

FilterToolbar.Filters = FilterToolbarFilters

export { FilterToolbar }

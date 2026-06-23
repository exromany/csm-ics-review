import * as React from "react"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Clickable, sort-aware header label. Place inside a `<TableHead>`; the caller
 * keeps ownership of the cell (key, alignment). Shows a directional arrow when
 * active and a hover-reveal arrow when not.
 */
function SortableHeader({
  label,
  active,
  order,
  onClick,
  className,
}: {
  label: string
  active: boolean
  order: "asc" | "desc"
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-xs font-medium uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {label}
      {active ? (
        order === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
      )}
    </button>
  )
}

/**
 * Static, non-sortable header label (e.g. "Actions"). Place inside a
 * `<TableHead>` for visual parity with `SortableHeader`.
 */
function ColumnLabel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "text-xs font-medium uppercase tracking-wider text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}

export { SortableHeader, ColumnLabel }

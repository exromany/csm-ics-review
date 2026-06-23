import * as React from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

/**
 * Placeholder rows for a loading table. Render inside a `<TableBody>`; one
 * skeleton cell is produced per column descriptor. Per-column `width` controls
 * the bar size (default `h-4 w-full`); `align: "right"` right-aligns it.
 */
function TableSkeleton({
  rows = 6,
  columns,
}: {
  rows?: number
  columns: { width?: string; align?: "left" | "right" }[]
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`sk-${rowIndex}`} className="hover:bg-transparent">
          {columns.map((col, colIndex) => (
            <TableCell
              key={colIndex}
              className={col.align === "right" ? "text-right" : undefined}
            >
              <Skeleton
                className={cn(
                  col.width ?? "h-4 w-full",
                  col.align === "right" && "ml-auto"
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export { TableSkeleton }

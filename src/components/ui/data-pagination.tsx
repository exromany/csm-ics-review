import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination"

// Build a windowed page-number array (with ellipses) for the pagination control.
const getPageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible = 7
) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = []
  const sidePages = Math.floor((maxVisible - 3) / 2) // Reserve space for first, last, and current

  if (currentPage <= sidePages + 2) {
    // Near the beginning
    for (let i = 1; i <= sidePages + 2; i++) {
      pages.push(i)
    }
    if (sidePages + 3 < totalPages) {
      pages.push("ellipsis")
    }
    pages.push(totalPages)
  } else if (currentPage >= totalPages - sidePages - 1) {
    // Near the end
    pages.push(1)
    if (totalPages - sidePages - 2 > 1) {
      pages.push("ellipsis")
    }
    for (let i = totalPages - sidePages - 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // In the middle
    pages.push(1)
    if (currentPage - sidePages > 2) {
      pages.push("ellipsis")
    }
    for (let i = currentPage - sidePages; i <= currentPage + sidePages; i++) {
      pages.push(i)
    }
    if (currentPage + sidePages < totalPages - 1) {
      pages.push("ellipsis")
    }
    pages.push(totalPages)
  }

  return pages
}

/**
 * List footer combining a range summary, rows-per-page selector, and page
 * navigation. Renders nothing when `total` is 0. The page owns clamping —
 * `onPageSizeChange` receives the raw selected size without adjustment.
 */
function DataPagination({
  currentPage,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
  className,
}: {
  currentPage: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}) {
  if (total === 0) return null

  const totalPages = Math.ceil(total / pageSize)
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {Math.min((currentPage - 1) * pageSize + 1, total)}–
          {Math.min(currentPage * pageSize, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <span>Rows</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => onPageSizeChange(parseInt(v))}
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {total > pageSize && (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {pageNumbers.map((pageNum, index) => (
              <PaginationItem key={index}>
                {pageNum === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={pageNum === currentPage}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export { DataPagination }

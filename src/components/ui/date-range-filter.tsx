import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface DateRange {
  from: string
  to: string
}

/**
 * Paired native date inputs ("from – to") used by list toolbars to filter by
 * submission date. Emits the full `{ from, to }` range on every change so
 * callers update both bounds atomically. Sizing is fixed so the pair reads as a
 * single unit inside a wrapping filter toolbar.
 */
function DateRangeFilter({
  value,
  onChange,
  fromLabel = "From date",
  toLabel = "To date",
  className,
}: {
  value: DateRange
  onChange: (value: DateRange) => void
  fromLabel?: string
  toLabel?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="date"
        aria-label={fromLabel}
        value={value.from}
        onChange={(e) => onChange({ from: e.target.value, to: value.to })}
        className="h-9 w-[150px] text-sm"
      />
      <span className="text-sm text-muted-foreground" aria-hidden>
        –
      </span>
      <Input
        type="date"
        aria-label={toLabel}
        value={value.to}
        onChange={(e) => onChange({ from: value.from, to: e.target.value })}
        className="h-9 w-[150px] text-sm"
      />
    </div>
  )
}

export { DateRangeFilter }

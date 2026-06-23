import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

/**
 * Text input with a leading search icon. Forwards all native input props.
 * Set `mono` for monospaced value display (e.g. addresses, hashes).
 *
 * Pass `onDebouncedChange` to enable debounced mode: the field is locally
 * controlled for instant typing and `onDebouncedChange` fires with the committed
 * text after `debounceMs`. `value` remains the committed source of truth, so an
 * external change (e.g. Reset) re-syncs the field without clobbering typing.
 */
const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    mono?: boolean
    containerClassName?: string
    onDebouncedChange?: (value: string) => void
    debounceMs?: number
  }
>(
  (
    {
      className,
      mono,
      containerClassName,
      value,
      onChange,
      onDebouncedChange,
      debounceMs = 300,
      ...props
    },
    ref
  ) => {
    const debounced = typeof onDebouncedChange === "function"

    const [text, setText] = React.useState((value as string) ?? "")
    // Tracks the last value we received from the parent OR emitted, so we never
    // re-emit a value the parent already has, and external resets re-sync.
    const lastSyncedRef = React.useRef((value as string) ?? "")
    const cbRef = React.useRef(onDebouncedChange)
    cbRef.current = onDebouncedChange

    React.useEffect(() => {
      if (!debounced) return
      const ext = (value as string) ?? ""
      if (ext !== lastSyncedRef.current) {
        lastSyncedRef.current = ext
        setText(ext)
      }
    }, [value, debounced])

    const debouncedText = useDebouncedValue(text, debounceMs)
    React.useEffect(() => {
      if (!debounced) return
      if (debouncedText !== lastSyncedRef.current) {
        lastSyncedRef.current = debouncedText
        cbRef.current?.(debouncedText)
      }
    }, [debouncedText, debounced])

    return (
      <div className={cn("relative", containerClassName)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          value={debounced ? text : value}
          onChange={debounced ? (e) => setText(e.target.value) : onChange}
          className={cn(
            "pl-9",
            mono && "font-mono text-sm placeholder:font-sans",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }

import * as React from "react"

import { cn } from "@/lib/utils"

interface SegmentedControlProps<T> {
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
  "aria-label"?: string
  className?: string
}

/**
 * Compact segmented toggle for mutually-exclusive choices (e.g. status filters).
 * Values are matched with `Object.is`, so `boolean | undefined | string` all work.
 *
 * Keyboard: roving focus — only the selected segment is in the tab order; Arrow
 * keys move to and select the adjacent segment, Home/End jump to the ends.
 */
function SegmentedControl<T>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = options.findIndex((opt) => Object.is(value, opt.value))

  const move = (to: number) => {
    const next = (to + options.length) % options.length
    refs.current[next]?.focus()
    onChange(options[next].value)
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault()
        move(index + 1)
        break
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault()
        move(index - 1)
        break
      case "Home":
        e.preventDefault()
        move(0)
        break
      case "End":
        e.preventDefault()
        move(options.length - 1)
        break
    }
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-md border bg-muted/40 p-0.5",
        className
      )}
    >
      {options.map((opt, index) => {
        const active = Object.is(value, opt.value)
        return (
          <button
            key={opt.label}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            aria-pressed={active}
            tabIndex={active || (activeIndex === -1 && index === 0) ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              "cursor-pointer rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }

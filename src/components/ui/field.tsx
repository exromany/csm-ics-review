import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Presentational form-field wrapper: label + control + help/error text.
 *
 * Composes the shared {@link Label} and renders supplied controls as
 * `children`. Holds no form state — `error` and `description` are passed in by
 * the caller. When `error` is present it takes precedence over `description`.
 */
export interface FieldProps {
  /** The field label, rendered inside a {@link Label}. */
  label: React.ReactNode
  /** Associates the label with a control by its `id`. */
  htmlFor?: string
  /** Helper text shown below the control when there is no `error`. */
  description?: React.ReactNode
  /** Error text shown below the control; takes precedence over `description`. */
  error?: React.ReactNode
  /** Appends a destructive asterisk to the label. */
  required?: boolean
  /** Extra classes merged onto the root element. */
  className?: string
  /** The form control (input, select, etc.). */
  children: React.ReactNode
}

function Field({
  label,
  htmlFor,
  description,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export { Field }

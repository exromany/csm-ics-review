import { toast } from "sonner"

/**
 * Single user-feedback entry point for the app.
 *
 * A thin, faithful wrapper over sonner's `toast`: every method mirrors the
 * corresponding sonner signature, so migrating `toast.success(x, opts)` to
 * `notify.success(x, opts)` is purely mechanical. Routing all toasts through
 * this module keeps feedback styling and behavior centralized.
 */
export const notify = {
  success: (...args: Parameters<typeof toast.success>) => toast.success(...args),
  error: (...args: Parameters<typeof toast.error>) => toast.error(...args),
  info: (...args: Parameters<typeof toast.info>) => toast.info(...args),
  warning: (...args: Parameters<typeof toast.warning>) => toast.warning(...args),
  message: (...args: Parameters<typeof toast>) => toast(...args),
  loading: (...args: Parameters<typeof toast.loading>) => toast.loading(...args),
  promise: toast.promise,
  dismiss: toast.dismiss,
}

export type Notify = typeof notify

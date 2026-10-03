import { toast } from "@/components/ui/toast"

const UNDO_MS = 5000

// Actions waiting out their undo window. Leaving the page runs them now, so
// closing the tab doesn't silently cancel a decision.
const pending = new Map<number, () => void>()
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    for (const [timer, run] of pending) {
      clearTimeout(timer)
      run()
    }
    pending.clear()
  })
}

/**
 * Shows a toast with Undo and runs `action` only once the window closes.
 * `onUndo` restores whatever the UI hid optimistically.
 */
export function undoable({
  title,
  description,
  action,
  onUndo,
}: {
  title: string
  description?: string
  action: () => void
  onUndo?: () => void
}) {
  const timer = window.setTimeout(() => {
    pending.delete(timer)
    action()
  }, UNDO_MS)
  pending.set(timer, action)
  toast.add({
    title,
    description,
    timeout: UNDO_MS,
    actionProps: {
      children: "Undo",
      onClick: () => {
        window.clearTimeout(timer)
        pending.delete(timer)
        onUndo?.()
      },
    },
  })
}

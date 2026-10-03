import { useState } from "react"

/** Ids hidden from a list while their removal waits out its undo window. */
export function useHidden() {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set())
  const hide = (id: string) => setHidden((prev) => new Set(prev).add(id))
  const unhide = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  return { hidden, hide, unhide }
}

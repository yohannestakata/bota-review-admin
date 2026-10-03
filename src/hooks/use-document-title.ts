import { useEffect } from "react"

/** Names the browser tab, so several open admin tabs can be told apart. */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} · Bota Admin`
  }, [title])
}

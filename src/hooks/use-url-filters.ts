import { useSearchParams } from "react-router"

/**
 * List filters kept in the URL, so a filtered view survives reloads and can
 * be shared. Changing any filter other than the page goes back to page 1.
 */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams()

  const get = (key: string, fallback = "") => params.get(key) ?? fallback
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1)

  // Built from the live URL, not this render's params: setters called later
  // (from a toast's Undo, say) must not undo changes made since.
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(window.location.search)
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    if (key !== "page") next.delete("page")
    setParams(next, { replace: true })
  }

  return { get, set, page }
}

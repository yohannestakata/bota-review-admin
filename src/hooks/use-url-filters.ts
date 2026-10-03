import { useSearchParams } from "react-router"

/**
 * List filters kept in the URL, so a filtered view survives reloads and can
 * be shared. Changing any filter other than the page goes back to page 1.
 */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams()

  const get = (key: string, fallback = "") => params.get(key) ?? fallback
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1)

  const set = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!value || value === "all") next.delete(key)
        else next.set(key, value)
        if (key !== "page") next.delete("page")
        return next
      },
      { replace: true }
    )

  return { get, set, page }
}

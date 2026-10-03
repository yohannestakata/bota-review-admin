import type { ApiResult } from "@/lib/api"

export type Page<T> = { rows: T[]; total: number; page: number; limit: number }

/** Lists that put paging in X-Total-Count / X-Page / X-Per-Page headers. */
export function toPage<T>(
  res: ApiResult<T[]>,
  page: number,
  limit: number
): Page<T> {
  return {
    rows: res.data,
    total: Number(res.headers.get("X-Total-Count") ?? res.data.length),
    page,
    limit,
  }
}

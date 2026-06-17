import type { ListSubmissionsParams } from "./types"

export const SUBMISSIONS_PAGE_SIZE = 20

export const submissionKeys = {
  all: ["submissions"] as const,
  list: (params: ListSubmissionsParams) =>
    ["submissions", "list", params] as const,
}

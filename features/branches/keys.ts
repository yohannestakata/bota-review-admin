import type { ListBranchesParams } from "./types"

export const BRANCHES_PAGE_SIZE = 20

export const branchKeys = {
  all: ["branches"] as const,
  list: (params: ListBranchesParams) => ["branches", "list", params] as const,
  detail: (id: string) => ["branches", "detail", id] as const,
}

import type { ListUsersParams } from "./types"

export const USERS_PAGE_SIZE = 20

export const userKeys = {
  all: ["users"] as const,
  list: (params: ListUsersParams) => ["users", "list", params] as const,
}

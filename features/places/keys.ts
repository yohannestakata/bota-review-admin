import type { ListPlacesParams } from "./types"

export const PLACES_PAGE_SIZE = 20

export const placeKeys = {
  all: ["places"] as const,
  list: (params: ListPlacesParams) => ["places", "list", params] as const,
  detail: (id: string) => ["places", "detail", id] as const,
}

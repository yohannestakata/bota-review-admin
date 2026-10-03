import type { DayKey, PlaceType } from "./types"

export const PLACE_TYPES: { value: PlaceType; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "bakery", label: "Bakery" },
  { value: "bar", label: "Bar" },
  { value: "other", label: "Other" },
]

export const typeLabel = (type: PlaceType) =>
  PLACE_TYPES.find((t) => t.value === type)?.label ?? type

export const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
]

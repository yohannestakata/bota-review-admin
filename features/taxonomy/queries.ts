"use client"

import { useQuery } from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import { listAmenities, listCuisines, listNeighborhoods, listTags } from "./api"

// Taxonomy changes rarely — cache it for the session.
const TAXONOMY_STALE_TIME = 60 * 60 * 1000

export function useCuisines() {
  const api = useApi()
  return useQuery({
    queryKey: ["taxonomy", "cuisines"],
    queryFn: () => listCuisines(api),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

export function useTags() {
  const api = useApi()
  return useQuery({
    queryKey: ["taxonomy", "tags"],
    queryFn: () => listTags(api),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

export function useAmenities() {
  const api = useApi()
  return useQuery({
    queryKey: ["taxonomy", "amenities"],
    queryFn: () => listAmenities(api),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

export function useNeighborhoods() {
  const api = useApi()
  return useQuery({
    queryKey: ["taxonomy", "neighborhoods"],
    queryFn: () => listNeighborhoods(api),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

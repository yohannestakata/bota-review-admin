"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import {
  createTag,
  createTaxonomyItem,
  listAmenities,
  listCuisines,
  listFoodCategories,
  listNeighborhoods,
  listTags,
  updateTag,
  updateTaxonomyItem,
} from "./api"
import type {
  CreateTagBody,
  CreateTaxonomyItemBody,
  TaxonomyKind,
  UpdateTagBody,
  UpdateTaxonomyItemBody,
} from "./types"

// Taxonomy changes rarely — cache it for the session.
const TAXONOMY_STALE_TIME = 60 * 60 * 1000
export const taxonomyKeys = {
  all: ["taxonomy"] as const,
  list: (kind: TaxonomyKind) => ["taxonomy", kind] as const,
}

export function useCuisines() {
  const api = useApi()
  return useQuery({
    queryKey: taxonomyKeys.list("cuisines"),
    queryFn: () => listCuisines(api),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

export function useFoodCategories() {
  const api = useApi()
  return useQuery({
    queryKey: taxonomyKeys.list("food-categories"),
    queryFn: () => listFoodCategories(api),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

export function useTags() {
  const api = useApi()
  return useQuery({
    queryKey: taxonomyKeys.list("tags"),
    queryFn: () => listTags(api),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

export function useAmenities() {
  const api = useApi()
  return useQuery({
    queryKey: taxonomyKeys.list("amenities"),
    queryFn: () => listAmenities(api),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

export function useNeighborhoods() {
  const api = useApi()
  return useQuery({
    queryKey: taxonomyKeys.list("neighborhoods"),
    queryFn: () => listNeighborhoods(api),
    staleTime: TAXONOMY_STALE_TIME,
  })
}

export function useCreateTaxonomyItem(kind: Exclude<TaxonomyKind, "tags">) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTaxonomyItemBody) =>
      createTaxonomyItem(api, kind, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxonomyKeys.list(kind) }),
  })
}

export function useUpdateTaxonomyItem(kind: Exclude<TaxonomyKind, "tags">) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTaxonomyItemBody }) =>
      updateTaxonomyItem(api, kind, id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxonomyKeys.list(kind) }),
  })
}

export function useCreateTag() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTagBody) => createTag(api, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxonomyKeys.list("tags") }),
  })
}

export function useUpdateTag() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTagBody }) =>
      updateTag(api, id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taxonomyKeys.list("tags") }),
  })
}

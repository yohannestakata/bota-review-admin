"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import {
  archiveCollection,
  createCollection,
  listCollections,
  publishCollection,
  updateCollection,
} from "./api"
import type { CollectionFormValues } from "./types"

export const collectionKeys = {
  all: ["collections"] as const,
  list: ["collections", "list"] as const,
}

export function useCollections() {
  const api = useApi()
  return useQuery({
    queryKey: collectionKeys.list,
    queryFn: () => listCollections(api),
  })
}

export function useCreateCollection() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CollectionFormValues) => createCollection(api, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: collectionKeys.all }),
  })
}

export function useUpdateCollection() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; values: CollectionFormValues }) =>
      updateCollection(api, vars.id, vars.values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: collectionKeys.all }),
  })
}

export function usePublishCollection() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publishCollection(api, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: collectionKeys.all }),
  })
}

export function useArchiveCollection() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveCollection(api, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: collectionKeys.all }),
  })
}

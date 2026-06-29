"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import {
  addCollectionBranch,
  archiveCollection,
  createCollection,
  getCollection,
  listCollections,
  publishCollection,
  removeCollectionBranch,
  reorderCollectionBranches,
  updateCollection,
} from "./api"
import type { CollectionFormValues } from "./types"

export const collectionKeys = {
  all: ["collections"] as const,
  list: ["collections", "list"] as const,
  detail: (id: string) => ["collections", "detail", id] as const,
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

export function useCollection(id: string, enabled = true) {
  const api = useApi()
  return useQuery({
    queryKey: collectionKeys.detail(id),
    queryFn: () => getCollection(api, id),
    enabled,
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

export function useAddCollectionBranch(id: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { branchId: string; displayOrder?: number }) =>
      addCollectionBranch(api, id, vars.branchId, vars.displayOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(id) })
    },
  })
}

export function useRemoveCollectionBranch(id: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (branchId: string) => removeCollectionBranch(api, id, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(id) })
    },
  })
}

export function useReorderCollectionBranches(id: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (branchIds: string[]) =>
      reorderCollectionBranches(api, id, branchIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(id) })
    },
  })
}

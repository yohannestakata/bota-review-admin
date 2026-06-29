"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import { branchKeys } from "@/features/branches/keys"
import { createPlace, getPlace, listPlaces, updatePlace } from "./api"
import { placeKeys } from "./keys"
import type { CreatePlaceBody, ListPlacesParams, UpdatePlaceBody } from "./types"

export function usePlaces(params: ListPlacesParams) {
  const api = useApi()
  return useQuery({
    queryKey: placeKeys.list(params),
    queryFn: () => listPlaces(api, params),
    placeholderData: keepPreviousData,
  })
}

export function usePlace(id: string) {
  const api = useApi()
  return useQuery({
    queryKey: placeKeys.detail(id),
    queryFn: () => getPlace(api, id),
  })
}

export function useCreatePlace() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePlaceBody) => createPlace(api, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.all })
    },
  })
}

export function useSavePlace(id: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdatePlaceBody) => updatePlace(api, id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.all })
      queryClient.invalidateQueries({ queryKey: placeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import {
  archiveMenu,
  archiveMenuItem,
  createMenu,
  createMenuItem,
  listBranchMenus,
  updateMenu,
  updateMenuItem,
  updateMenuItemAvailability,
} from "./api"
import type { MenuFormValues, MenuItemFormValues } from "./types"

export const menuKeys = {
  all: ["menus"] as const,
  branch: (branchId: string) => ["menus", "branch", branchId] as const,
}

export function useBranchMenus(branchId: string) {
  const api = useApi()
  return useQuery({
    queryKey: menuKeys.branch(branchId),
    queryFn: () => listBranchMenus(api, branchId),
  })
}

export function useCreateMenu(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: MenuFormValues) => createMenu(api, branchId, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.branch(branchId) }),
  })
}

export function useUpdateMenu(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MenuFormValues }) =>
      updateMenu(api, id, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.branch(branchId) }),
  })
}

export function useArchiveMenu(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveMenu(api, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.branch(branchId) }),
  })
}

export function useCreateMenuItem(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      menuId,
      values,
    }: {
      menuId: string
      values: MenuItemFormValues
    }) => createMenuItem(api, menuId, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.branch(branchId) }),
  })
}

export function useUpdateMenuItem(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MenuItemFormValues }) =>
      updateMenuItem(api, id, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.branch(branchId) }),
  })
}

export function useArchiveMenuItem(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveMenuItem(api, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.branch(branchId) }),
  })
}

export function useUpdateMenuItemAvailability(branchId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      updateMenuItemAvailability(api, id, isAvailable),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.branch(branchId) }),
  })
}

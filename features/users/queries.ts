"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useApi } from "@/lib/use-api"
import {
  listUsers,
  reinstateUser,
  suspendUser,
  updateUserRole,
  updateUserTrustLevel,
} from "./api"
import { userKeys } from "./keys"
import type { ListUsersParams, UserRole, UserTrustLevel } from "./types"

export function useUsers(params: ListUsersParams) {
  const api = useApi()
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(api, params),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateUserRole() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      updateUserRole(api, id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useUpdateUserTrustLevel() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      trustLevel,
    }: {
      id: string
      trustLevel: UserTrustLevel
    }) => updateUserTrustLevel(api, id, trustLevel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

function useUserStatusMutation(
  action: (api: ReturnType<typeof useApi>, id: string) => Promise<unknown>
) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => action(api, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useSuspendUser() {
  return useUserStatusMutation(suspendUser)
}

export function useReinstateUser() {
  return useUserStatusMutation(reinstateUser)
}

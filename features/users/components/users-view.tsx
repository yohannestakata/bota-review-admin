/* eslint-disable @next/next/no-img-element */
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { BanIcon, CheckCircle2Icon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiErrorMessage } from "@/lib/api-client"
import { USERS_PAGE_SIZE as PAGE_SIZE } from "../keys"
import {
  useReinstateUser,
  useSuspendUser,
  useUpdateUserRole,
  useUpdateUserTrustLevel,
  useUsers,
} from "../queries"
import type { AdminUser, UserRole, UserStatus, UserTrustLevel } from "../types"

const ROLES: UserRole[] = ["user", "business_owner", "editor", "admin"]
const TRUST_LEVELS: UserTrustLevel[] = ["new", "trusted", "flagged"]
const STATUSES: UserStatus[] = ["active", "suspended"]

const ROLE_LABEL: Record<UserRole, string> = {
  user: "User",
  business_owner: "Business owner",
  editor: "Editor",
  admin: "Admin",
}

const TRUST_VARIANT: Record<
  UserTrustLevel,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "secondary",
  trusted: "default",
  flagged: "destructive",
}

const STATUS_VARIANT: Record<
  UserStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  suspended: "destructive",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function UserIdentity({ user }: { user: AdminUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
          {user.displayName.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{user.displayName}</div>
        <div className="truncate text-xs text-muted-foreground">
          {user.email ?? user.clerkId}
        </div>
      </div>
    </div>
  )
}

export function UsersView() {
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [role, setRole] = useState<UserRole | "all">("all")
  const [trustLevel, setTrustLevel] = useState<UserTrustLevel | "all">("all")
  const [status, setStatus] = useState<UserStatus | "all">("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [debouncedQ, role, trustLevel, status])

  const params = {
    q: debouncedQ || undefined,
    role: role === "all" ? undefined : role,
    trustLevel: trustLevel === "all" ? undefined : trustLevel,
    status: status === "all" ? undefined : status,
    page,
    limit: PAGE_SIZE,
  }
  const { data, isError, error, isFetching } = useUsers(params)
  const updateRole = useUpdateUserRole()
  const updateTrust = useUpdateUserTrustLevel()
  const suspend = useSuspendUser()
  const reinstate = useReinstateUser()
  const busy =
    updateRole.isPending ||
    updateTrust.isPending ||
    suspend.isPending ||
    reinstate.isPending

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => <UserIdentity user={row.original} />,
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => (
          <Select
            value={row.original.role}
            onValueChange={(value) =>
              updateRole.mutate(
                { id: row.original.id, role: (value ?? "user") as UserRole },
                {
                  onSuccess: () => toast.success("Role updated"),
                  onError: (e) => toast.error(apiErrorMessage(e)),
                }
              )
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((value) => (
                <SelectItem key={value} value={value}>
                  {ROLE_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        id: "trust",
        header: "Trust",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant={TRUST_VARIANT[row.original.trustLevel]}>
              {row.original.trustLevel}
            </Badge>
            <Select
              value={row.original.trustLevel}
              onValueChange={(value) =>
                updateTrust.mutate(
                  {
                    id: row.original.id,
                    trustLevel: (value ?? "new") as UserTrustLevel,
                  },
                  {
                    onSuccess: () => toast.success("Trust level updated"),
                    onError: (e) => toast.error(apiErrorMessage(e)),
                  }
                )
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRUST_LEVELS.map((value) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ),
      },
      {
        id: "approvals",
        header: "Approvals",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.consecutiveApprovals}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "joined",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          row.original.status === "suspended" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                reinstate.mutate(row.original.id, {
                  onSuccess: () => toast.success("User reinstated"),
                  onError: (e) => toast.error(apiErrorMessage(e)),
                })
              }
            >
              <CheckCircle2Icon className="size-4" />
              Reinstate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                suspend.mutate(row.original.id, {
                  onSuccess: () => toast.success("User suspended"),
                  onError: (e) => toast.error(apiErrorMessage(e)),
                })
              }
            >
              <BanIcon className="size-4" />
              Suspend
            </Button>
          ),
      },
    ],
    [busy, reinstate, suspend, updateRole, updateTrust]
  )

  const toolbar = (
    <Input
      placeholder="Search users..."
      value={q}
      onChange={(event) => setQ(event.target.value)}
      className="h-8 max-w-xs"
    />
  )

  const toolbarEnd = (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={role}
        onValueChange={(value) => setRole((value ?? "all") as UserRole | "all")}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          {ROLES.map((value) => (
            <SelectItem key={value} value={value}>
              {ROLE_LABEL[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={trustLevel}
        onValueChange={(value) =>
          setTrustLevel((value ?? "all") as UserTrustLevel | "all")
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All trust</SelectItem>
          {TRUST_LEVELS.map((value) => (
            <SelectItem key={value} value={value} className="capitalize">
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={status}
        onValueChange={(value) =>
          setStatus((value ?? "all") as UserStatus | "all")
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((value) => (
            <SelectItem key={value} value={value} className="capitalize">
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {isError && !data ? (
          <div className="px-4 py-10 text-center text-sm text-destructive lg:px-6">
            {apiErrorMessage(error)}
          </div>
        ) : (
          <div className="px-4 lg:px-6">
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              getRowId={(row) => row.id}
              loading={isFetching}
              toolbar={toolbar}
              toolbarEnd={toolbarEnd}
              serverPagination={{
                page,
                pageSize: PAGE_SIZE,
                total: data?.total ?? 0,
                onPageChange: setPage,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

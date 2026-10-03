import { MoreHorizontalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"

import { useMe } from "@/app/auth-gate"
import { ApiErrorAlert } from "@/components/api-error-alert"
import { Pager } from "@/components/pager"
import { SearchInput } from "@/components/search-input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ago, initials } from "@/features/inbox/format"
import { useUrlFilters } from "@/hooks/use-url-filters"

import {
  ROLES,
  TRUST,
  useUserAction,
  useUsers,
  type Role,
  type TrustLevel,
  type User,
  type UserStatus,
} from "./queries"

const roleLabel = (role: Role) =>
  ROLES.find((r) => r.value === role)?.label ?? role
const trustLabel = (trust: TrustLevel) =>
  TRUST.find((t) => t.value === trust)?.label ?? trust

type Pending =
  | { user: User; action: "role"; role: Role }
  | { user: User; action: "suspend" | "reinstate" }

export function PeoplePage() {
  const me = useMe()
  const { get, set, page } = useUrlFilters()
  const q = get("q")
  const role = get("role", "all") as "all" | Role
  const status = get("status", "all") as "all" | UserStatus
  const users = useUsers({
    q,
    role: role === "all" ? undefined : role,
    status: status === "all" ? undefined : status,
    page,
  })
  const act = useUserAction()
  // Role changes and suspensions are confirmed first; trust changes are not.
  const [pending, setPending] = useState<Pending | null>(null)

  const run = (input: Parameters<typeof act.mutate>[0], done: string) =>
    act.mutate(input, {
      onSuccess: () => toast.add({ title: done, type: "success" }),
      onError: (error) =>
        toast.add({
          title: "That didn't go through",
          description: error.message,
          type: "error",
        }),
    })

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={q}
          onChange={(v) => set("q", v)}
          placeholder="Search name or email"
          className="w-72"
        />
        <ToggleGroup
          value={[role]}
          onValueChange={(v) => v[0] && set("role", v[0])}
          variant="outline"
          size="sm"
          spacing={1}
        >
          <ToggleGroupItem value="all">Everyone</ToggleGroupItem>
          <ToggleGroupItem value="editor">Editors</ToggleGroupItem>
          <ToggleGroupItem value="admin">Admins</ToggleGroupItem>
          <ToggleGroupItem value="business_owner">Owners</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          value={[status]}
          onValueChange={(v) => v[0] && set("status", v[0])}
          variant="outline"
          size="sm"
          spacing={1}
        >
          <ToggleGroupItem value="all">Any status</ToggleGroupItem>
          <ToggleGroupItem value="suspended">Suspended</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ApiErrorAlert error={users.error} title="Couldn't load people" />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Trust</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isPending
              ? Array.from({ length: 10 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8" />
                    </TableCell>
                  </TableRow>
                ))
              : users.data?.rows.map((user) => {
                  const isMe = user.id === me?.id
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Item size="xs" className="p-0">
                          <ItemMedia>
                            <Avatar>
                              {user.avatarUrl ? (
                                <AvatarImage src={user.avatarUrl} alt="" />
                              ) : null}
                              <AvatarFallback>
                                {initials(user.displayName)}
                              </AvatarFallback>
                            </Avatar>
                          </ItemMedia>
                          <ItemContent className="min-w-0">
                            <ItemTitle>
                              {user.displayName}
                              {isMe ? (
                                <Badge variant="outline">You</Badge>
                              ) : null}
                              {user.status === "suspended" ? (
                                <Badge variant="destructive">Suspended</Badge>
                              ) : null}
                            </ItemTitle>
                            <ItemDescription className="truncate">
                              {user.email}
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                      </TableCell>
                      <TableCell>{roleLabel(user.role)}</TableCell>
                      <TableCell
                        className={
                          user.trustLevel === "flagged"
                            ? "text-destructive"
                            : undefined
                        }
                      >
                        {trustLabel(user.trustLevel)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ago(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        {isMe ? null : (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Manage ${user.displayName}`}
                                />
                              }
                            >
                              <HugeiconsIcon
                                icon={MoreHorizontalIcon}
                                strokeWidth={2}
                              />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  Role
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuRadioGroup
                                    value={user.role}
                                    onValueChange={(value: Role) =>
                                      value !== user.role &&
                                      setPending({
                                        user,
                                        action: "role",
                                        role: value,
                                      })
                                    }
                                  >
                                    {ROLES.map((r) => (
                                      <DropdownMenuRadioItem
                                        key={r.value}
                                        value={r.value}
                                      >
                                        {r.label}
                                      </DropdownMenuRadioItem>
                                    ))}
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  Trust
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuGroup>
                                    <DropdownMenuLabel>
                                      How their posts are handled
                                    </DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                      value={user.trustLevel}
                                      onValueChange={(value: TrustLevel) =>
                                        value !== user.trustLevel &&
                                        run(
                                          {
                                            id: user.id,
                                            action: "trust",
                                            trustLevel: value,
                                          },
                                          `${user.displayName} is now ${trustLabel(value).toLowerCase()}`
                                        )
                                      }
                                    >
                                      {TRUST.map((t) => (
                                        <DropdownMenuRadioItem
                                          key={t.value}
                                          value={t.value}
                                        >
                                          <div className="flex flex-col">
                                            <span>{t.label}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {t.description}
                                            </span>
                                          </div>
                                        </DropdownMenuRadioItem>
                                      ))}
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              {user.status === "active" ? (
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={user.role === "admin"}
                                  onClick={() =>
                                    setPending({ user, action: "suspend" })
                                  }
                                >
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setPending({ user, action: "reinstate" })
                                  }
                                >
                                  Reinstate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
          </TableBody>
        </Table>
        {users.data?.rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nobody matches</EmptyTitle>
              <EmptyDescription>Try another search or filter.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </div>

      {users.data ? (
        <div className="flex justify-end">
          <Pager
            page={page}
            limit={users.data.limit}
            total={users.data.total}
            onPageChange={(p) => set("page", String(p))}
          />
        </div>
      ) : null}

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        {pending ? (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pending.action === "role"
                  ? `Make ${pending.user.displayName} ${roleLabel(pending.role).toLowerCase()}?`
                  : pending.action === "suspend"
                    ? `Suspend ${pending.user.displayName}?`
                    : `Reinstate ${pending.user.displayName}?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pending.action === "role"
                  ? ROLES.find((r) => r.value === pending.role)?.description
                  : pending.action === "suspend"
                    ? "They're signed out of everything until reinstated. Nothing they wrote is removed."
                    : "They can sign in and post again."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant={
                  pending.action === "suspend" ? "destructive" : "default"
                }
                onClick={() => {
                  if (pending.action === "role") {
                    run(
                      {
                        id: pending.user.id,
                        action: "role",
                        role: pending.role,
                      },
                      "Role changed"
                    )
                  } else {
                    run(
                      { id: pending.user.id, action: pending.action },
                      pending.action === "suspend" ? "Suspended" : "Reinstated"
                    )
                  }
                  setPending(null)
                }}
              >
                {pending.action === "role"
                  ? "Change role"
                  : pending.action === "suspend"
                    ? "Suspend"
                    : "Reinstate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </div>
  )
}

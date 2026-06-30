"use client"

import { MoreHorizontalIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiErrorMessage } from "@/lib/api-client"
import {
  useArchiveBranch,
  usePublishBranch,
  useUnpublishBranch,
} from "../queries"
import type { AdminBranch } from "../types"

export function BranchActions({ branch }: { branch: AdminBranch }) {
  const publish = usePublishBranch()
  const unpublish = useUnpublishBranch()
  const archive = useArchiveBranch()
  const busy = publish.isPending || unpublish.isPending || archive.isPending

  function run(
    mutation: { mutate: (id: string, opts: object) => void },
    successMessage: string
  ) {
    mutation.mutate(branch.id, {
      onSuccess: () => toast.success(successMessage),
      onError: (error: unknown) => toast.error(apiErrorMessage(error)),
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={busy}
          />
        }
      >
        <MoreHorizontalIcon className="size-4" />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {branch.status !== "published" ? (
          <DropdownMenuItem onClick={() => run(publish, "Published")}>
            Publish
          </DropdownMenuItem>
        ) : null}
        {branch.status === "published" ? (
          <DropdownMenuItem onClick={() => run(unpublish, "Unpublished")}>
            Unpublish
          </DropdownMenuItem>
        ) : null}
        {branch.status !== "archived" ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => run(archive, "Archived")}
            >
              Archive
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import {
  ArrowDown01Icon,
  Cancel01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"

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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Kbd } from "@/components/ui/kbd"
import { Textarea } from "@/components/ui/textarea"

import { REJECTION_REASONS } from "./format"
import type { Decision } from "./queries"
import type { InboxItem } from "./types"

type Labels = { approve: string; reject: string }

function labels(item: InboxItem): Labels {
  const reported = item.reason === "reported"
  switch (item.kind) {
    case "review":
    case "reply":
      return reported
        ? { approve: "Keep", reject: "Remove" }
        : { approve: "Approve", reject: "Reject" }
    case "photo":
      return { approve: "Approve", reject: "Reject" }
    case "submission":
      return { approve: "Apply", reject: "Dismiss" }
    case "claim":
      return { approve: "Verify", reject: "Reject" }
  }
}

/**
 * Approve / reject for one item. Reviews and replies need a reason to reject
 * (menu); a claim needs a written reason and a confirmed verify; edits can
 * carry an optional note either way.
 */
export function ItemActions({
  item,
  busy,
  onDecide,
  rejectOpen,
  onRejectOpenChange,
}: {
  item: InboxItem
  busy: boolean
  onDecide: (decision: Decision) => void
  rejectOpen: boolean
  onRejectOpenChange: (open: boolean) => void
}) {
  const { approve, reject } = labels(item)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [note, setNote] = useState("")
  const needsReason = item.kind === "review" || item.kind === "reply"
  const needsNote = item.kind === "claim" || item.kind === "submission"

  return (
    <div className="flex items-center gap-2">
      {needsReason ? (
        <DropdownMenu open={rejectOpen} onOpenChange={onRejectOpenChange}>
          <DropdownMenuTrigger
            render={<Button variant="outline" disabled={busy} />}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            {reject}
            <Kbd>R</Kbd>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              data-icon="inline-end"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Reason</DropdownMenuLabel>
              {REJECTION_REASONS.map((r) => (
                <DropdownMenuItem
                  key={r.value}
                  onClick={() =>
                    onDecide({ action: "reject", reason: r.value })
                  }
                >
                  {r.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : needsNote ? (
        <>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onRejectOpenChange(true)}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            {reject}
            <Kbd>R</Kbd>
          </Button>
          <Dialog
            open={rejectOpen}
            onOpenChange={(open) => {
              onRejectOpenChange(open)
              if (!open) setNote("")
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {item.kind === "claim"
                    ? "Reject this claim"
                    : "Dismiss this edit"}
                </DialogTitle>
                <DialogDescription>
                  {item.kind === "claim"
                    ? "The person who asked will see this reason."
                    : "Nothing changes on the place."}
                </DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="decision-note">
                    {item.kind === "claim" ? "Reason" : "Reason (optional)"}
                  </FieldLabel>
                  <Textarea
                    id="decision-note"
                    value={note}
                    maxLength={item.kind === "claim" ? 500 : 200}
                    onChange={(e) => setNote(e.target.value)}
                    autoFocus
                  />
                  {item.kind === "claim" ? (
                    <FieldDescription>
                      For example: couldn't confirm the phone number.
                    </FieldDescription>
                  ) : null}
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => onRejectOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={item.kind === "claim" && note.trim().length === 0}
                  onClick={() => {
                    onDecide({
                      action: "reject",
                      note: note.trim() || undefined,
                    })
                    setNote("")
                  }}
                >
                  {reject}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => onDecide({ action: "reject" })}
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          {reject}
          <Kbd>R</Kbd>
        </Button>
      )}

      <Button
        disabled={busy}
        onClick={() =>
          item.kind === "claim"
            ? setVerifyOpen(true)
            : onDecide({ action: "approve" })
        }
      >
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        {approve}
        <Kbd>A</Kbd>
      </Button>

      {item.kind === "claim" ? (
        <AlertDialog open={verifyOpen} onOpenChange={setVerifyOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Verify {item.data.contactName}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Their account becomes the business owner of{" "}
                {item.data.branch.placeName ?? item.data.branch.label}, and the
                listing is marked business verified.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDecide({ action: "approve" })}
              >
                Verify
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  )
}

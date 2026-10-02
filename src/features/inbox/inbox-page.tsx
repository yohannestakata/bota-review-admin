import {
  CheckmarkBadge01Icon,
  Edit02Icon,
  Flag02Icon,
  Image02Icon,
  InboxCheckIcon,
  Message01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import { ago, KIND_LABEL, summary, title } from "./format"
import { ItemActions } from "./item-actions"
import { ItemDetail } from "./item-details"
import { useDecide, useInbox, type Decision } from "./queries"
import type { InboxItem, InboxKind } from "./types"

type Filter = "all" | InboxKind

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "review", label: "Reviews" },
  { value: "reply", label: "Replies" },
  { value: "photo", label: "Photos" },
  { value: "submission", label: "Edits" },
  { value: "claim", label: "Claims" },
]

const KIND_ICON = {
  review: StarIcon,
  reply: Message01Icon,
  photo: Image02Icon,
  submission: Edit02Icon,
  claim: CheckmarkBadge01Icon,
} as const

const DONE_TOAST: Record<Decision["action"], string> = {
  approve: "Done",
  reject: "Removed",
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return (
    !!el &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
  )
}

export function InboxPage() {
  const inbox = useInbox()
  const decide = useDecide()
  const [filter, setFilter] = useState<Filter>("all")
  // Decided items leave the list at once, before the server confirms.
  const [decided, setDecided] = useState<Set<string>>(() => new Set())
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)

  const open = useMemo(
    () => inbox.items.filter((item) => !decided.has(item.key)),
    [inbox.items, decided]
  )
  const visible = useMemo(
    () => (filter === "all" ? open : open.filter((item) => item.kind === filter)),
    [open, filter]
  )
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: open.length, review: 0, reply: 0, photo: 0, submission: 0, claim: 0 }
    for (const item of open) c[item.kind]++
    return c
  }, [open])

  const selected =
    visible.find((item) => item.key === selectedKey) ?? visible[0] ?? null
  const index = selected ? visible.indexOf(selected) : -1

  function run(item: InboxItem, decision: Decision) {
    setRejectOpen(false)
    const next = visible[index + 1] ?? visible[index - 1] ?? null
    setDecided((prev) => new Set(prev).add(item.key))
    setSelectedKey(next?.key ?? null)
    decide.mutate(
      { item, decision },
      {
        onSuccess: () => toast.add({ title: DONE_TOAST[decision.action], description: title(item), type: "success" }),
        onError: (error) => {
          setDecided((prev) => {
            const copy = new Set(prev)
            copy.delete(item.key)
            return copy
          })
          toast.add({ title: "That didn't go through", description: error.message, type: "error" })
        },
      }
    )
  }

  // j/k or arrows to move, a to approve, r to reject.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey || rejectOpen) return
      if (document.querySelector("[role=dialog], [role=alertdialog]")) return
      const key = e.key.toLowerCase()
      if (key === "j" || key === "arrowdown") {
        e.preventDefault()
        const next = visible[Math.min(index + 1, visible.length - 1)]
        if (next) setSelectedKey(next.key)
      } else if (key === "k" || key === "arrowup") {
        e.preventDefault()
        const prev = visible[Math.max(index - 1, 0)]
        if (prev) setSelectedKey(prev.key)
      } else if (key === "a" && selected && selected.kind !== "claim") {
        e.preventDefault()
        run(selected, { action: "approve" })
      } else if (key === "r" && selected) {
        e.preventDefault()
        if (selected.kind === "photo") run(selected, { action: "reject" })
        else setRejectOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex w-96 shrink-0 flex-col border-r">
        <div className="flex flex-col gap-3 border-b p-3">
          <ToggleGroup
            value={[filter]}
            onValueChange={(value) => {
              const next = value[0] as Filter | undefined
              if (next) setFilter(next)
            }}
            variant="outline"
            size="sm"
            spacing={1}
            className="flex-wrap"
          >
            {FILTERS.map((f) => (
              <ToggleGroupItem key={f.value} value={f.value}>
                {f.label}
                {counts[f.value] > 0 ? (
                  <span className="text-muted-foreground tabular-nums">{counts[f.value]}</span>
                ) : null}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {inbox.hiddenSubmissions > 0 ? (
            <p className="text-xs text-muted-foreground">
              {inbox.hiddenSubmissions} more edits load as you clear these.
            </p>
          ) : null}
        </div>
        <ScrollArea className="min-h-0 flex-1">
          {inbox.isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <ul className="flex flex-col p-1.5" aria-label="Waiting for review">
              {visible.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(item.key)}
                    aria-current={item === selected}
                    className={cn(
                      "flex w-full gap-3 rounded-md p-2.5 text-left transition-colors hover:bg-muted",
                      item === selected && "bg-muted"
                    )}
                  >
                    <HugeiconsIcon
                      icon={item.reason === "reported" ? Flag02Icon : KIND_ICON[item.kind]}
                      strokeWidth={2}
                      className={cn(
                        "mt-0.5 shrink-0 text-muted-foreground",
                        item.reason === "reported" && "text-destructive"
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{title(item)}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{ago(item.createdAt)}</span>
                      </span>
                      <span className="truncate text-sm text-muted-foreground">{summary(item)}</span>
                      <span className="flex gap-1.5 pt-1">
                        <Badge variant="outline">{KIND_LABEL[item.kind]}</Badge>
                        {item.reason === "reported" ? <Badge variant="destructive">Reported</Badge> : null}
                        {item.reason === "spot-check" ? <Badge variant="secondary">Spot check</Badge> : null}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </section>

      <section className="flex min-w-0 flex-1 flex-col">
        {inbox.error ? (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertTitle>Some queues didn't load</AlertTitle>
              <AlertDescription className="flex items-center gap-3">
                {inbox.error.message}
                <Button size="sm" variant="outline" onClick={() => void inbox.refetch()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        {selected ? (
          <>
            <ScrollArea className="min-h-0 flex-1">
              <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
                <ItemDetail key={selected.key} item={selected} />
              </div>
            </ScrollArea>
            <footer className="flex items-center gap-3 border-t px-6 py-3">
              <span className="hidden text-sm text-muted-foreground md:inline">
                <Kbd>J</Kbd> <Kbd>K</Kbd> to move
              </span>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {index + 1} of {visible.length}
              </span>
              <ItemActions
                key={selected.key}
                item={selected}
                busy={false}
                onDecide={(decision) => run(selected, decision)}
                rejectOpen={rejectOpen}
                onRejectOpenChange={setRejectOpen}
              />
            </footer>
          </>
        ) : inbox.isLoading ? null : (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={InboxCheckIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>All clear</EmptyTitle>
              <EmptyDescription>
                {filter === "all"
                  ? "Nothing is waiting for review."
                  : `No ${FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} waiting.`}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  )
}

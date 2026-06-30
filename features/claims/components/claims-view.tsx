"use client"

import {
  CheckIcon,
  ExternalLinkIcon,
  GlobeIcon,
  MailIcon,
  PhoneCallIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { apiErrorMessage } from "@/lib/api-client"
import { useClaims, useRejectClaim, useVerifyClaim } from "../queries"
import type { AdminClaim, ClaimStatus } from "../types"

const STATUS_TABS: { value: ClaimStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
]

const STATUS_VARIANT: Record<
  ClaimStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  verified: "default",
  rejected: "destructive",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatRole(role: string): string {
  return role.replaceAll("_", " ")
}

const VERIFICATION_METHOD_META: Record<
  string,
  { label: string; icon: React.ElementType; actionHint: string }
> = {
  business_email: {
    label: "Business email",
    icon: MailIcon,
    actionHint: "Send a verification link to the address below.",
  },
  social_media: {
    label: "Social media",
    icon: GlobeIcon,
    actionHint: "Check for a DM from the handle below.",
  },
  phone_call: {
    label: "Verification call",
    icon: PhoneCallIcon,
    actionHint: "Call the publicly listed business number.",
  },
  manual_review: {
    label: "Manual review",
    icon: UserCheckIcon,
    actionHint: "Review the information provided.",
  },
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
}

function socialUrl(platform: string, handle: string): string | null {
  const h = handle.trim().replace(/^@/, "")
  if (!h) return null
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${h}`
    case "facebook":
      return `https://facebook.com/${h}`
    case "tiktok":
      return `https://tiktok.com/@${h}`
    default:
      return null
  }
}

function ClaimActions({
  busy,
  disabled,
  onReject,
  onVerify,
}: {
  busy: boolean
  disabled: boolean
  onReject: () => void
  onVerify: () => void
}) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        disabled={busy || disabled}
        onClick={onReject}
      >
        <XIcon className="size-4" />
        Reject
      </Button>
      <Button
        size="sm"
        className="flex-1"
        disabled={busy || disabled}
        onClick={onVerify}
      >
        <CheckIcon className="size-4" />
        Verify
      </Button>
    </div>
  )
}

function ClaimCard({
  claim,
  busy,
  onReject,
  onVerify,
}: {
  claim: AdminClaim
  busy: boolean
  onReject: (claim: AdminClaim) => void
  onVerify: (claim: AdminClaim) => void
}) {
  const decided = claim.status !== "pending"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0">
          <span className="block truncate text-sm">{claim.branch.label}</span>
        </CardTitle>
        <CardAction>
          <Badge variant={STATUS_VARIANT[claim.status]} className="capitalize">
            {claim.status}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4 text-sm">
        <div className="grid gap-1">
          <div className="font-medium">{claim.contactName}</div>
          <div className="text-muted-foreground capitalize">
            {formatRole(claim.contactRole)} · submitted{" "}
            {formatDate(claim.createdAt)}
          </div>
        </div>

        <div className="grid gap-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <MailIcon className="size-4" />
            <span className="break-all">{claim.contactEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="size-4" />
            <span>{claim.contactPhone}</span>
          </div>
        </div>

        {(() => {
          const meta = VERIFICATION_METHOD_META[claim.verificationMethod]
          if (!meta) return null
          const Icon = meta.icon
          const platform = claim.verificationPlatform
            ? PLATFORM_LABEL[claim.verificationPlatform]
            : null
          const isSocial = claim.verificationMethod === "social_media"
          const isCall = claim.verificationMethod === "phone_call"
          const evidence = claim.verificationEvidence?.trim() ?? null
          const externalUrl =
            evidence && isSocial && claim.verificationPlatform
              ? socialUrl(claim.verificationPlatform, evidence)
              : null
          const mailto =
            evidence && claim.verificationMethod === "business_email"
              ? `mailto:${evidence}`
              : null
          return (
            <div className="grid gap-1 rounded-md border p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                {meta.label}
                {platform ? (
                  <span className="text-muted-foreground">· {platform}</span>
                ) : null}
              </div>
              <div className="text-muted-foreground">
                {isSocial && platform
                  ? `Check for a DM from the ${platform} account below.`
                  : meta.actionHint}
              </div>

              {isCall ? (
                <div className="mt-1">
                  <span className="text-xs text-muted-foreground">
                    Publicly listed number to call:{" "}
                  </span>
                  {claim.branch.phone ? (
                    <a
                      href={`tel:${claim.branch.phone}`}
                      className="font-medium underline underline-offset-2"
                    >
                      {claim.branch.phone}
                    </a>
                  ) : (
                    <span className="italic">none on file for this branch</span>
                  )}
                </div>
              ) : evidence ? (
                externalUrl ? (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 font-medium break-all underline underline-offset-2"
                  >
                    {evidence}
                    <ExternalLinkIcon className="size-3 shrink-0" />
                  </a>
                ) : mailto ? (
                  <a
                    href={mailto}
                    className="mt-1 font-medium break-all underline underline-offset-2"
                  >
                    {evidence}
                  </a>
                ) : (
                  <div className="mt-1 font-medium break-all">{evidence}</div>
                )
              ) : null}
            </div>
          )
        })()}

        <div className="grid gap-1">
          <div className="text-xs font-medium text-muted-foreground">
            Claimant
          </div>
          <div>
            {claim.claimant.displayName ?? "Unknown"} ·{" "}
            <span className="capitalize">{claim.claimant.role}</span> ·{" "}
            <span className="capitalize">{claim.claimant.trustLevel}</span>
          </div>
          {claim.claimant.email ? (
            <div className="text-xs break-all text-muted-foreground">
              {claim.claimant.email}
            </div>
          ) : null}
        </div>

        {claim.note ? (
          <p className="rounded-md bg-muted p-3 text-muted-foreground">
            {claim.note}
          </p>
        ) : null}

        {claim.rejectionReason ? (
          <p className="rounded-md border border-destructive/20 p-3 text-destructive">
            {claim.rejectionReason}
          </p>
        ) : null}

        {claim.reviewedAt ? (
          <div className="text-xs text-muted-foreground">
            Reviewed {formatDate(claim.reviewedAt)}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <ClaimActions
          busy={busy}
          disabled={decided}
          onReject={() => onReject(claim)}
          onVerify={() => onVerify(claim)}
        />
        <Button
          size="sm"
          variant="ghost"
          className="w-full"
          nativeButton={false}
          render={<Link href={`/branches/${claim.branchId}`} />}
        >
          <ExternalLinkIcon className="size-4" />
          Open branch
        </Button>
      </CardFooter>
    </Card>
  )
}

function RejectDialog({
  claim,
  busy,
  onClose,
  onConfirm,
}: {
  claim: AdminClaim | null
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")

  function close() {
    setReason("")
    onClose()
  }

  function confirm() {
    const trimmed = reason.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <Dialog open={claim !== null} onOpenChange={(open) => !open && close()}>
      {claim ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject claim</DialogTitle>
            <DialogDescription>
              Give a clear reason so the claimant knows what to fix or provide.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Contact information did not match the business."
          />
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              disabled={busy || !reason.trim()}
              onClick={confirm}
            >
              {busy ? "Rejecting..." : "Reject claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

export function ClaimsView() {
  const [status, setStatus] = useState<ClaimStatus>("pending")
  const [rejecting, setRejecting] = useState<AdminClaim | null>(null)
  const { data, isPending, isError, error } = useClaims(status)
  const verify = useVerifyClaim()
  const reject = useRejectClaim()
  const busy = verify.isPending || reject.isPending
  const claims = data ?? []

  function onVerify(claim: AdminClaim) {
    verify.mutate(claim.id, {
      onSuccess: () => toast.success("Claim verified"),
      onError: (e) => toast.error(apiErrorMessage(e)),
    })
  }

  function onReject(reason: string) {
    if (!rejecting) return
    reject.mutate(
      { id: rejecting.id, rejectionReason: reason },
      {
        onSuccess: () => {
          toast.success("Claim rejected")
          setRejecting(null)
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      }
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as ClaimStatus)}
      >
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <ShieldCheckIcon className="size-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Verify ownership claims before granting authoritative branch access.
        </p>
        <Badge variant="outline">{claims.length} claims</Badge>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>
      ) : isPending || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-96 rounded-lg" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No claims in this queue.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {claims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              busy={busy}
              onReject={setRejecting}
              onVerify={onVerify}
            />
          ))}
        </div>
      )}

      <RejectDialog
        claim={rejecting}
        busy={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={onReject}
      />
    </div>
  )
}

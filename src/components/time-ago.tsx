import { ago } from "@/features/inbox/format"

const exact = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

/** "3 days ago", with the exact date and time on hover. */
export function TimeAgo({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={exact.format(new Date(iso))}>
      {ago(iso)}
    </time>
  )
}

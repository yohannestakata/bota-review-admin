import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>Being rebuilt. Coming next.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

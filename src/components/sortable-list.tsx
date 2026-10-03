import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"

/**
 * Drag-to-reorder for a vertical list. Rows call `useSortable({ id })` and
 * render a <DragHandle>. Works with the mouse and the keyboard (Space to pick
 * up, arrows to move, Space to drop), and screen readers hear item names.
 * Wrap it around a <Table> or list; it adds no markup of its own besides a
 * screen-reader live region.
 */
export function SortableList<T extends { id: string }>({
  items,
  nameOf,
  onReorder,
  children,
}: {
  items: T[]
  nameOf: (item: T) => string
  onReorder: (next: T[]) => void
  children: React.ReactNode
}) {
  const sensors = useSensors(
    // A small move starts a drag, so clicks on the handle still work.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const name = (id: string | number) => {
    const item = items.find((i) => i.id === id)
    return item ? nameOf(item) : String(id)
  }
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${name(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${name(active.id)} is over ${name(over.id)}.` : `${name(active.id)} isn't over a row.`,
    onDragEnd: ({ active, over }) =>
      over ? `${name(active.id)} dropped at ${name(over.id)}.` : `${name(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Moving ${name(active.id)} was cancelled.`,
  }
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    onReorder(arrayMove(items, from, to))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements }}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

/** The grip a row is dragged by. Pass the pieces from `useSortable`. */
export function DragHandle({
  label,
  handleRef,
  attributes,
  listeners,
}: {
  label: string
  handleRef: (element: HTMLElement | null) => void
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
}) {
  return (
    <Button
      ref={handleRef}
      size="icon-sm"
      variant="ghost"
      className="cursor-grab touch-none"
      aria-label={label}
      {...attributes}
      {...listeners}
    >
      <HugeiconsIcon icon={DragDropVerticalIcon} strokeWidth={2} aria-hidden="true" />
    </Button>
  )
}

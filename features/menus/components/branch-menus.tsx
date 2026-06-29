"use client"

import {
  ArchiveIcon,
  PencilIcon,
  PlusIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiErrorMessage } from "@/lib/api-client"
import {
  useArchiveMenu,
  useArchiveMenuItem,
  useBranchMenus,
  useCreateMenu,
  useCreateMenuItem,
  useUpdateMenu,
  useUpdateMenuItem,
  useUpdateMenuItemAvailability,
} from "../queries"
import type { Menu, MenuFormValues, MenuItem, MenuItemFormValues } from "../types"

function emptyMenu(): MenuFormValues {
  return { name: "", displayOrder: "0" }
}

function menuForm(menu: Menu): MenuFormValues {
  return { name: menu.name, displayOrder: String(menu.displayOrder) }
}

function emptyItem(): MenuItemFormValues {
  return {
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    isAvailable: true,
    displayOrder: "0",
  }
}

function itemForm(item: MenuItem): MenuItemFormValues {
  return {
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    category: item.category ?? "",
    imageUrl: item.imageUrl ?? "",
    isAvailable: item.isAvailable,
    displayOrder: String(item.displayOrder),
  }
}

function MenuDialog({
  menu,
  open,
  saving,
  onOpenChange,
  onSubmit,
}: {
  menu: Menu | null
  open: boolean
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: MenuFormValues) => void
}) {
  const [form, setForm] = useState<MenuFormValues>(() =>
    menu ? menuForm(menu) : emptyMenu()
  )

  function set<K extends keyof MenuFormValues>(
    key: K,
    value: MenuFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function reset(nextOpen: boolean) {
    if (nextOpen) setForm(menu ? menuForm(menu) : emptyMenu())
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{menu ? "Edit menu" : "New menu"}</DialogTitle>
          <DialogDescription>
            Menus group items for the branch profile.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="menu-name">Name</FieldLabel>
            <Input
              id="menu-name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="menu-order">Display order</FieldLabel>
            <Input
              id="menu-order"
              inputMode="numeric"
              value={form.displayOrder}
              onChange={(event) => set("displayOrder", event.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter showCloseButton>
          <Button
            disabled={saving || !form.name.trim()}
            onClick={() => onSubmit(form)}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ItemDialog({
  item,
  open,
  saving,
  onOpenChange,
  onSubmit,
}: {
  item: MenuItem | null
  open: boolean
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: MenuItemFormValues) => void
}) {
  const [form, setForm] = useState<MenuItemFormValues>(() =>
    item ? itemForm(item) : emptyItem()
  )

  function set<K extends keyof MenuItemFormValues>(
    key: K,
    value: MenuItemFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function reset(nextOpen: boolean) {
    if (nextOpen) setForm(item ? itemForm(item) : emptyItem())
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "New item"}</DialogTitle>
          <DialogDescription>
            Item details shown in the mobile menu view.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="item-name">Name</FieldLabel>
            <Input
              id="item-name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="item-price">Price</FieldLabel>
              <Input
                id="item-price"
                inputMode="decimal"
                value={form.price}
                onChange={(event) => set("price", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="item-category">Category</FieldLabel>
              <Input
                id="item-category"
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="item-description">Description</FieldLabel>
            <Textarea
              id="item-description"
              rows={3}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="item-image">Image URL</FieldLabel>
              <Input
                id="item-image"
                value={form.imageUrl}
                onChange={(event) => set("imageUrl", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="item-order">Display order</FieldLabel>
              <Input
                id="item-order"
                inputMode="numeric"
                value={form.displayOrder}
                onChange={(event) => set("displayOrder", event.target.value)}
              />
            </Field>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => set("isAvailable", !form.isAvailable)}
          >
            {form.isAvailable ? (
              <ToggleRightIcon className="size-4" />
            ) : (
              <ToggleLeftIcon className="size-4" />
            )}
            {form.isAvailable ? "Available" : "Unavailable"}
          </Button>
        </FieldGroup>
        <DialogFooter showCloseButton>
          <Button
            disabled={saving || !form.name.trim() || !form.price.trim()}
            onClick={() => onSubmit(form)}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function BranchMenus({ branchId }: { branchId: string }) {
  const { data, isPending, isError, error } = useBranchMenus(branchId)
  const createMenu = useCreateMenu(branchId)
  const updateMenu = useUpdateMenu(branchId)
  const archiveMenu = useArchiveMenu(branchId)
  const createItem = useCreateMenuItem(branchId)
  const updateItem = useUpdateMenuItem(branchId)
  const archiveItem = useArchiveMenuItem(branchId)
  const availability = useUpdateMenuItemAvailability(branchId)
  const [menuDialog, setMenuDialog] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [itemDialog, setItemDialog] = useState(false)
  const [targetMenuId, setTargetMenuId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const busy =
    createMenu.isPending ||
    updateMenu.isPending ||
    archiveMenu.isPending ||
    createItem.isPending ||
    updateItem.isPending ||
    archiveItem.isPending ||
    availability.isPending

  function openNewMenu() {
    setEditingMenu(null)
    setMenuDialog(true)
  }

  function openEditMenu(menu: Menu) {
    setEditingMenu(menu)
    setMenuDialog(true)
  }

  function openNewItem(menuId: string) {
    setTargetMenuId(menuId)
    setEditingItem(null)
    setItemDialog(true)
  }

  function openEditItem(item: MenuItem) {
    setTargetMenuId(item.menuId)
    setEditingItem(item)
    setItemDialog(true)
  }

  function saveMenu(values: MenuFormValues) {
    if (editingMenu) {
      updateMenu.mutate(
        { id: editingMenu.id, values },
        {
          onSuccess: () => {
            toast.success("Menu saved")
            setMenuDialog(false)
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        }
      )
      return
    }
    createMenu.mutate(values, {
      onSuccess: () => {
        toast.success("Menu created")
        setMenuDialog(false)
      },
      onError: (e) => toast.error(apiErrorMessage(e)),
    })
  }

  function saveItem(values: MenuItemFormValues) {
    if (editingItem) {
      updateItem.mutate(
        { id: editingItem.id, values },
        {
          onSuccess: () => {
            toast.success("Item saved")
            setItemDialog(false)
          },
          onError: (e) => toast.error(apiErrorMessage(e)),
        }
      )
      return
    }
    if (!targetMenuId) return
    createItem.mutate(
      { menuId: targetMenuId, values },
      {
        onSuccess: () => {
          toast.success("Item created")
          setItemDialog(false)
        },
        onError: (e) => toast.error(apiErrorMessage(e)),
      }
    )
  }

  if (isError) {
    return <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading menus...</p>
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={openNewMenu}>
          <PlusIcon className="size-4" />
          New menu
        </Button>
      </div>
      {(data ?? []).length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No menus yet.
        </div>
      ) : (
        (data ?? []).map((menu) => (
          <div key={menu.id} className="grid gap-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-medium">{menu.name}</div>
              <Badge variant="outline">Order {menu.displayOrder}</Badge>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openNewItem(menu.id)}
                >
                  <PlusIcon className="size-4" />
                  Item
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEditMenu(menu)}
                >
                  <PencilIcon className="size-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    archiveMenu.mutate(menu.id, {
                      onSuccess: () => toast.success("Menu archived"),
                      onError: (e) => toast.error(apiErrorMessage(e)),
                    })
                  }
                >
                  <ArchiveIcon className="size-4" />
                  Archive
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              {menu.items.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No active items.
                </div>
              ) : (
                menu.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {item.name}
                        </span>
                        <Badge variant={item.isAvailable ? "default" : "outline"}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.price} Br
                        {item.category ? ` · ${item.category}` : ""}
                        {item.description ? ` · ${item.description}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          availability.mutate(
                            { id: item.id, isAvailable: !item.isAvailable },
                            {
                              onSuccess: () =>
                                toast.success("Availability updated"),
                              onError: (e) => toast.error(apiErrorMessage(e)),
                            }
                          )
                        }
                      >
                        {item.isAvailable ? (
                          <ToggleRightIcon className="size-4" />
                        ) : (
                          <ToggleLeftIcon className="size-4" />
                        )}
                        Toggle
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditItem(item)}
                      >
                        <PencilIcon className="size-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          archiveItem.mutate(item.id, {
                            onSuccess: () => toast.success("Item archived"),
                            onError: (e) => toast.error(apiErrorMessage(e)),
                          })
                        }
                      >
                        <ArchiveIcon className="size-4" />
                        Archive
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}
      <MenuDialog
        key={editingMenu?.id ?? "new-menu"}
        menu={editingMenu}
        open={menuDialog}
        saving={createMenu.isPending || updateMenu.isPending}
        onOpenChange={setMenuDialog}
        onSubmit={saveMenu}
      />
      <ItemDialog
        key={editingItem?.id ?? `${targetMenuId ?? "menu"}-new-item`}
        item={editingItem}
        open={itemDialog}
        saving={createItem.isPending || updateItem.isPending}
        onOpenChange={setItemDialog}
        onSubmit={saveItem}
      />
    </div>
  )
}

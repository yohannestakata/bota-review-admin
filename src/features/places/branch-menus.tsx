import { Cancel01Icon, Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRef, useState } from "react"

import { ApiErrorAlert } from "@/components/api-error-alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { useHidden } from "@/hooks/use-hidden"
import { thumbnail } from "@/lib/cloudinary"
import { undoable } from "@/lib/undoable"

import { useBranchMenus, useMenuItemAction } from "./queries"
import type { Menu, MenuItem, MenuItemSize } from "./types"

const birr = new Intl.NumberFormat("en", { maximumFractionDigits: 2 })

const priceText = (item: MenuItem) =>
  item.sizes
    ? item.sizes
        .map((size) => `${size.label} ${birr.format(Number(size.price))}`)
        .join(" · ")
    : birr.format(Number(item.price))

/** "Small 545, Large 890" → sizes; null unless every part has a name and price. */
function parseSizes(text: string): MenuItemSize[] | null {
  const sizes = text
    .split(",")
    .map((part) => part.trim().match(/^(.+?)\s+(\d+(?:\.\d{1,2})?)$/))
  if (sizes.length < 2 || sizes.some((m) => !m)) return null
  return sizes.map((m) => ({ label: m![1], price: m![2] }))
}

export function BranchMenus({ branchId }: { branchId: string }) {
  const menus = useBranchMenus(branchId)
  const act = useMenuItemAction(branchId)
  const [menuName, setMenuName] = useState("Menu")

  if (menus.isPending) return <Skeleton className="h-40" />
  if (menus.error)
    return <ApiErrorAlert error={menus.error} title="Couldn't load the menu" />

  if (menus.data.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No menu yet</EmptyTitle>
          <EmptyDescription>
            Start one, then add dishes and prices in birr.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              act.mutate({ action: "create-menu", name: menuName.trim() })
            }}
          >
            <Input
              aria-label="Menu name"
              required
              autoComplete="off"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
            />
            <Button type="submit" disabled={act.isPending}>
              Start menu
            </Button>
          </form>
          <ApiErrorAlert error={act.error} title="Couldn't start the menu" />
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {menus.data.map((menu) => (
        <MenuTable
          key={menu.id}
          menu={menu}
          branchId={branchId}
          showName={menus.data.length > 1}
        />
      ))}
    </div>
  )
}

function MenuTable({
  menu,
  branchId,
  showName,
}: {
  menu: Menu
  branchId: string
  showName: boolean
}) {
  const act = useMenuItemAction(branchId)
  const { hidden, hide, unhide } = useHidden()
  const dishInput = useRef<HTMLInputElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  // The dish a picked photo is for, and the one uploading now.
  const photoFor = useRef<MenuItem | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const setPhoto = (item: MenuItem, file: File | null) => {
    setUploadingId(item.id)
    act.mutate(
      { action: "photo", itemId: item.id, file },
      {
        onSuccess: () =>
          toast.add({
            title: file ? "Photo added" : "Photo removed",
            description: item.name,
            type: "success",
          }),
        onError,
        onSettled: () => setUploadingId(null),
      }
    )
  }
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [sizesText, setSizesText] = useState("")
  const [category, setCategory] = useState("")

  const onError = (error: Error) =>
    toast.add({
      title: "That didn't go through",
      description: error.message,
      type: "error",
    })

  return (
    <div className="flex flex-col gap-2">
      {showName ? <h3 className="font-medium">{menu.name}</h3> : null}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Photo</TableHead>
              <TableHead>Dish</TableHead>
              <TableHead>Section</TableHead>
              <TableHead className="text-right">Price (birr)</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {menu.items
              .filter((item) => !hidden.has(item.id))
              .map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label={`Photo of ${item.name}`}
                            disabled={uploadingId === item.id}
                          />
                        }
                      >
                        {uploadingId === item.id ? (
                          <Spinner />
                        ) : item.imageUrl ? (
                          <img
                            src={thumbnail(item.imageUrl, 80)}
                            alt=""
                            className="size-full rounded-md object-cover"
                          />
                        ) : (
                          <HugeiconsIcon
                            aria-hidden="true"
                            icon={Image01Icon}
                            strokeWidth={2}
                          />
                        )}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => {
                              photoFor.current = item
                              photoInput.current?.click()
                            }}
                          >
                            {item.imageUrl ? "Change photo…" : "Add photo…"}
                          </DropdownMenuItem>
                          {item.imageUrl ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setPhoto(item, null)}
                            >
                              Remove photo
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.category}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {priceText(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      aria-label={`${item.name} available`}
                      checked={item.isAvailable}
                      onCheckedChange={(checked) =>
                        act.mutate(
                          {
                            action: "availability",
                            itemId: item.id,
                            isAvailable: checked,
                          },
                          { onError }
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => {
                        hide(item.id)
                        undoable({
                          title: "Dish removed",
                          description: item.name,
                          onUndo: () => unhide(item.id),
                          action: () =>
                            act.mutate(
                              { action: "remove", itemId: item.id },
                              {
                                onError: (error) => {
                                  unhide(item.id)
                                  onError(error)
                                },
                              }
                            ),
                        })
                      }}
                    >
                      <HugeiconsIcon
                        aria-hidden="true"
                        icon={Cancel01Icon}
                        strokeWidth={2}
                      />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <input
          ref={photoInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (file && photoFor.current) setPhoto(photoFor.current, file)
          }}
        />
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const sizes = sizesText.trim() ? parseSizes(sizesText) : null
          if (sizesText.trim() && !sizes) {
            toast.add({
              title: "Sizes need a name and price each",
              description: "Like Small 545, Medium 885, Large 1290",
              type: "error",
            })
            return
          }
          act.mutate(
            {
              action: "add",
              menuId: menu.id,
              name: name.trim(),
              ...(sizes ? { sizes } : { price }),
              category: category.trim() || undefined,
            },
            {
              onSuccess: () => {
                setName("")
                setPrice("")
                setSizesText("")
                // Ready for the next dish.
                dishInput.current?.focus()
              },
              onError,
            }
          )
        }}
      >
        <Input
          ref={dishInput}
          aria-label="Dish"
          required
          autoComplete="off"
          placeholder="Dish"
          className="w-56"
          maxLength={160}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          aria-label="Section"
          placeholder="Section, like Mains"
          className="w-44"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          aria-label="Price in birr"
          required={!sizesText.trim()}
          disabled={Boolean(sizesText.trim())}
          autoComplete="off"
          pattern="[0-9]+([.][0-9]{1,2})?"
          title="A price in birr, like 120 or 89.50"
          placeholder="Price"
          inputMode="decimal"
          className="w-28"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Input
          aria-label="Sizes"
          autoComplete="off"
          placeholder="Or sizes: Small 545, Large 890"
          className="w-64"
          value={sizesText}
          onChange={(e) => setSizesText(e.target.value)}
        />
        <Button type="submit" variant="outline" disabled={act.isPending}>
          Add dish
        </Button>
      </form>
    </div>
  )
}

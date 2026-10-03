import { useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

import type { Branch } from "@/features/places/types"

import { useBranchSearch } from "./queries"

const branchName = (b: Branch) => `${b.place.name} · ${b.label}`

/** Search live branches by name, area or address, and add one on pick. */
export function BranchAdder({
  exclude,
  onAdd,
}: {
  exclude: Set<string>
  onAdd: (branch: Branch) => void
}) {
  const [q, setQ] = useState("")
  const search = useBranchSearch(q)
  const items = (search.data ?? []).filter((b) => !exclude.has(b.id))

  return (
    <Combobox
      items={items}
      value={null}
      inputValue={q}
      onInputValueChange={setQ}
      onValueChange={(b: Branch | null) => {
        if (b) {
          onAdd(b)
          setQ("")
        }
      }}
      itemToStringLabel={branchName}
      filter={null}
    >
      <ComboboxInput
        placeholder="Add a place: search by name or area"
        showTrigger={false}
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {q.trim().length < 2
            ? "Type at least 2 letters."
            : "No live places match."}
        </ComboboxEmpty>
        <ComboboxList>
          {(b: Branch) => (
            <ComboboxItem key={b.id} value={b}>
              {b.place.name} · {b.label}
              {b.neighborhood && b.neighborhood.name !== b.label
                ? `, ${b.neighborhood.name}`
                : ""}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

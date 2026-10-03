import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"

import { useTaxonomy, type TaxonomyKind } from "./queries"
import type { Taxon } from "./types"

/** Active options, plus anything already chosen (even if since archived). */
function useOptions(kind: TaxonomyKind, chosen: Taxon[]) {
  const { data = [] } = useTaxonomy(kind)
  const ids = new Set(chosen.map((t) => t.id))
  return [
    ...chosen,
    ...data.filter((t) => t.status === "active" && !ids.has(t.id)),
  ].sort((a, b) => a.name.localeCompare(b.name))
}

const sameTaxon = (a: Taxon, b: Taxon) => a.id === b.id
const taxonName = (t: Taxon) => t.name

export function TaxonMultiPicker({
  id,
  kind,
  value,
  onChange,
  placeholder,
}: {
  id?: string
  kind: TaxonomyKind
  value: Taxon[]
  onChange: (value: Taxon[]) => void
  placeholder: string
}) {
  const options = useOptions(kind, value)
  const anchor = useComboboxAnchor()
  return (
    <Combobox
      multiple
      items={options}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={taxonName}
      isItemEqualToValue={sameTaxon}
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(chosen: Taxon[]) =>
            chosen.map((t) => <ComboboxChip key={t.id}>{t.name}</ComboboxChip>)
          }
        </ComboboxValue>
        <ComboboxChipsInput
          id={id}
          placeholder={value.length ? "" : placeholder}
        />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>Nothing matches.</ComboboxEmpty>
        <ComboboxList>
          {(t: Taxon) => (
            <ComboboxItem key={t.id} value={t}>
              {t.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function TaxonPicker({
  id,
  kind,
  value,
  onChange,
  placeholder,
}: {
  id?: string
  kind: TaxonomyKind
  value: Taxon | null
  onChange: (value: Taxon | null) => void
  placeholder: string
}) {
  const options = useOptions(kind, value ? [value] : [])
  return (
    <Combobox
      items={options}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={taxonName}
      isItemEqualToValue={sameTaxon}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        showClear={Boolean(value)}
      />
      <ComboboxContent>
        <ComboboxEmpty>Nothing matches.</ComboboxEmpty>
        <ComboboxList>
          {(t: Taxon) => (
            <ComboboxItem key={t.id} value={t}>
              {t.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

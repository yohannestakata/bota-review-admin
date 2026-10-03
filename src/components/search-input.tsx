import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

/** Search box that reports its value after typing pauses (300ms). */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  // Follow outside changes (Back/Forward, cleared filters) without fighting typing.
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    if (value !== draft.trim()) setDraft(value)
  }
  useEffect(() => {
    if (draft === value) return
    const t = setTimeout(() => onChange(draft.trim()), 300)
    return () => clearTimeout(t)
  }, [draft, value, onChange])

  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <HugeiconsIcon aria-hidden="true" icon={Search01Icon} strokeWidth={2} />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setDraft(e.target.value)}
      />
    </InputGroup>
  )
}

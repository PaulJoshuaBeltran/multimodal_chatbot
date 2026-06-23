// src/components/ui/numeric-updown.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type NumericUpDownProps = {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number) => void
  className?: string
}

function NumericUpDown({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className,
}: NumericUpDownProps) {
  const [internalValue, setInternalValue] = React.useState<number>(
    value ?? defaultValue
  )

  const isControlled = value !== undefined
  const currentValue = isControlled ? (value as number) : internalValue

  const setValue = (newValue: number) => {
    const clamped = Math.min(max, Math.max(min, newValue))

    if (!isControlled) {
      setInternalValue(clamped)
    }

    onValueChange?.(clamped)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value

    // allow empty input temporarily
    if (raw === "") {
      onValueChange?.(NaN)
      return
    }

    const parsed = Number(raw)

    if (!Number.isNaN(parsed)) {
      setValue(parsed)
    }
  }

  return (
    <div
      className={cn(
        "flex items-stretch gap-1 rounded-md border bg-background p-1",
        className
      )}
    >
      {/* Textarea (number only) */}
      <textarea
        value={Number.isNaN(currentValue) ? "" : String(currentValue)}
        onChange={handleInputChange}
        className="h-6 w-full resize-none bg-transparent px-2 py-1 text-xs outline-none"
        inputMode="numeric"
      />

      {/* Buttons */}
      <div className="flex flex-col">
        <button
          type="button"
          className="h-3 w-6 text-xs leading-none hover:bg-muted"
          onClick={() => setValue(currentValue + step)}
        >
          ▲
        </button>
        <button
          type="button"
          className="h-3 w-6 text-xs leading-none hover:bg-muted"
          onClick={() => setValue(currentValue - step)}
        >
          ▼
        </button>
      </div>
    </div>
  )
}

export { NumericUpDown }
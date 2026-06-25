// src/components/dialogs/SystemPromptDialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Slider } from '../ui/slider'
import { NumericUpDown } from '../ui/numeric-updown'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { SystemPromptDialogProps } from '@/src/types/props'

export function getThinkingQuality(temp: number, topP: number, topK: number) {
  const score =
    temp * 0.5 +
    (1 - topP) * 0.3 +
    Math.min(topK / 100, 1) * 0.2

  if (score < 0.33) return 'Low'
  if (score < 0.66) return 'Medium'
  return 'High'
}

export function SystemPromptDialog({
  open,
  onOpenChange,
  value,
  onChange,
  temperature,
  setTemperature,
  topP,
  setTopP,
  topK,
  setTopK,
}: SystemPromptDialogProps) {
  const [draft, setDraft] = useState(value)
  const thinkingQuality = getThinkingQuality(temperature[0], topP[0], topK)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Set a custom system prompt &amp; settings to guide the assistant behaviour.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Label htmlFor="system-prompt">System settings</Label>
          <Textarea
            id="system-prompt"
            rows={6}
            placeholder="You are a helpful assistant…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          />
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="generation-settings">
              <AccordionTrigger>
                More Settings (Think {thinkingQuality})
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <Label className="w-32 shrink-0">Temperature ({temperature}):</Label>
                    <Slider
                      className="flex-1"
                      value={temperature}
                      min={0}
                      max={2}
                      step={0.1}
                      onValueChange={setTemperature}
                    />
                  </div>
                  <div className="flex items-center">
                    <Label className="w-32 shrink-0">Top-P ({topP}):</Label>
                    <Slider
                      className="flex-1"
                      value={topP}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={setTopP}
                    />
                  </div>
                  <div className="flex items-center">
                    <Label className="w-32 shrink-0">Top-K:</Label>
                    <NumericUpDown
                      className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                      value={topK}
                      min={0}
                      step={1}
                      onValueChange={setTopK}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => { onChange(draft); onOpenChange(false) }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              Save
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

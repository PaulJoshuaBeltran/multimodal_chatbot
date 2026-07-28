// src/components/dialogs/SettingsDialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { Slider } from '../ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { SettingsDialogProps } from '@/src/types/props'

async function subscribeToPlus() {
  const res = await fetch('/api/subscription', {
    method: 'POST',
  })
  const data = await res.json()
  window.location.href = data.url
}

const PLUS_PERKS = [
  'Access to larger, more capable models',
  'Longer conversation memory',
  'Priority response speed',
  'Early access to new features',
]

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  // General
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('en')
  const [sendOnEnter, setSendOnEnter] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Chat display
  const [fontSize, setFontSize] = useState([14])
  const [density, setDensity] = useState('comfortable')
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [markdownRendering, setMarkdownRendering] = useState(true)

  // Subscription
  const [isSubscribing, setIsSubscribing] = useState(false)

  async function handleSubscribeClick() {
    setIsSubscribing(true)
    try {
      await subscribeToPlus()
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your preferences, chat display, and plan.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" orientation="vertical" className="min-h-[360px]">
          <TabsList className="w-40 shrink-0">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          {/* General tab */}
          <TabsContent value="general" className="flex flex-col gap-4 px-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme-select" className="w-32">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="language-select">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language-select" className="w-32">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="send-on-enter"
                checked={sendOnEnter}
                onCheckedChange={(checked) => setSendOnEnter(checked === true)}
              />
              <Label htmlFor="send-on-enter" className="font-normal">
                Send message on Enter
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="sound-enabled"
                checked={soundEnabled}
                onCheckedChange={(checked) => setSoundEnabled(checked === true)}
              />
              <Label htmlFor="sound-enabled" className="font-normal">
                Play sound on new message
              </Label>
            </div>
          </TabsContent>

          {/* Chat display tab */}
          <TabsContent value="chat" className="flex flex-col gap-4 px-1">
            <div className="flex items-center">
              <Label className="w-32 shrink-0">Font size ({fontSize}px)</Label>
              <Slider
                className="flex-1"
                value={fontSize}
                min={12}
                max={20}
                step={1}
                onValueChange={setFontSize}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="density-select">Message density</Label>
              <Select value={density} onValueChange={setDensity}>
                <SelectTrigger id="density-select" className="w-40">
                  <SelectValue placeholder="Density" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="show-timestamps"
                checked={showTimestamps}
                onCheckedChange={(checked) => setShowTimestamps(checked === true)}
              />
              <Label htmlFor="show-timestamps" className="font-normal">
                Show message timestamps
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="markdown-rendering"
                checked={markdownRendering}
                onCheckedChange={(checked) => setMarkdownRendering(checked === true)}
              />
              <Label htmlFor="markdown-rendering" className="font-normal">
                Render Markdown &amp; code blocks
              </Label>
            </div>
          </TabsContent>

          {/* Subscription tab */}
          <TabsContent value="subscription" className="flex flex-col gap-3 px-1">
            <div
              className="flex flex-col gap-3 rounded-lg border p-4"
              style={{ backgroundColor: 'var(--gray2)' }}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-4 h-4" />
                Upgrade to Plus
              </div>

              <ul className="flex flex-col gap-1.5">
                {PLUS_PERKS.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>

              <Button
                className="w-fit"
                disabled={isSubscribing}
                onClick={handleSubscribeClick}
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  'Subscribe to Plus'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  )
}
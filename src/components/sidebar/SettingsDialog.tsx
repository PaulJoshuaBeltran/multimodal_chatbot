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
import { Textarea } from '../ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { NumericUpDown } from '../ui/numeric-updown'

import 'dotenv/config'

async function subscribeToPlus() {
  const res = await fetch('/api/subscription', {
    method: 'POST',
  })
  const data = await res.json()
  window.location.href = data.url
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  // Account
  const [username, setUsername] = useState('Username')
  const [email, setEmail] = useState('Email')
  const [isDeactivateAccount, setDeactivateAccount] = useState(false)
  const [isSignout, setSignout] = useState(false)

  // General
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('en')
  const [sendOnEnter, setSendOnEnter] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Subscription
  const PLUS_PERKS = [
    'Access to larger, more capable models',
    'Longer conversation memory',
    'Priority response speed',
    'Early access to new features',
  ]
  const [isSubscribing, setIsSubscribing] = useState(false)
  async function handleSubscribeClick() {
    setIsSubscribing(true)
    try {
      await subscribeToPlus()
    } finally {
      setIsSubscribing(false)
    }
  }

  // Chat display
  const [fontSize, setFontSize] = useState([14])
  const [density, setDensity] = useState('comfortable')
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [markdownRendering, setMarkdownRendering] = useState(true)

  // System prompt
  const NUM_CTX_OPTIONS = [2048, 4096, 8192, 16384, 32768, 65536, 131072] as const
  function formatCtx(n: number) {
    return n >= 1024 ? `${n / 1024}k` : `${n}`
  }
  function getThinkingQuality(temp: number, topP: number, topK: number) {
    const score =
      temp * 0.5 +
      (1 - topP) * 0.3 +
      Math.min(topK / 100, 1) * 0.2

    if (score < 0.33) return 'Low'
    if (score < 0.66) return 'Medium'
    return 'High'
  }
  
  const [systemPrompt, setSystemPrompt] = useState('')
  const [numCtx, setNumCtx] = useState(2048)
  const [maxReplyTokens, setMaxReplyTokens] = useState(2048)
  const [temperature, setTemperature] = useState([0.3])
  const [topP, setTopP] = useState([0.3])
  const [topK, setTopK] = useState(0.3)
  const thinkingQuality = getThinkingQuality(temperature[0], topP[0], topK)

  // RAG
  const [similaritySearchModel, setSimilaritySearchModel] = useState(process.env.OLLAMA_EMBED_MODEL || "OLLAMA_EMBED_MODEL")
  const [similaritySearchTopK, setSimilaritySearchTopK] = useState(5)
  const [rerankActive, setRerankActive] = useState(true)
  const [rerankModel, setRerankModel] = useState(process.env.HF_RERANK_MODEL || "HF_RERANK_MODEL")
  const [rerankTopK, setRerankTopK] = useState(5)

  // Toolcall
  const ASK_PERMISSION = ["No", "Per Access", "Single Batch"] as const
  const [dbReadAccess, setDbReadAccess] = useState(true)
  const [dbWriteAccess, setDbWriteAccess] = useState(true)
  const [dbAskPermission, setDbAskPermission] = useState("Per Access")
  const [fileReadAccess, setFileReadAccess] = useState(true)
  const [fileWriteAccess, setFileWriteAccess] = useState(true)
  const [fileAskPermission, setFileAskPermission] = useState("Per Access")

  // LLM Engineering
  const CONTEXT_COMPRESSION = ["None", "Sliding Window", "Summarization on Threshold"] as const
  const [llmEngActive, setLlmEngActive] = useState(true)
  const [maxRetries, setMaxRetries] = useState(3)
  const [llmTimeout, setLlmTimeout] = useState(30000)
  const [retryMemDepth, setRetryMemDepth] = useState(3)
  const [contextCompress, setContextCompress] = useState("None")
  const [fileMgmtCorrectness, setFileMgmtCorrectness] = useState(true)
  const [dbMgmtCorrectness, setDBMgmtCorrectness] = useState(true)
  const [guardrailActive, setGuardrailActive] = useState(true)
  const [monitorActive, setMonitorActive] = useState(true)
  const [evalActive, setEvalActive] = useState(true)

  const CHECK_ASSIST_RESPONSE = ["Each time", "Manual"] as const

  // Guardrail
  const [checkAIResponseGuardrail, setCheckAIResponseGuardrail] = useState("Each time")
  const [checkInappropriateContent, setCheckInappropriateContent] = useState(false)
  const [checkOffensiveLanguage, setCheckOffensiveLanguage] = useState(false)
  const [checkPromptInjection, setCheckPromptInjection] = useState(false)
  const [checkSensitiveContent, setCheckSensitiveContent] = useState(false)
  const [checkRelevanceCheck, setCheckRelevanceCheck] = useState(false)
  const [checkPromptAddressConfirmation, setCheckPromptAddressConfirmation] = useState(false)
  const [checkURLAvailability, setCheckURLAvailability] = useState(false)
  const [checkFactCheck, setCheckFactCheck] = useState(false)
  const [checkCompetitorMentionBlocking, setCheckCompetitorMentionBlocking] = useState(false)
  const [checkPriceQuoteValidation, setCheckPriceQuoteValidation] = useState(false)
  const [checkSourceContextGrounding, setCheckSourceContextGrounding] = useState(false)
  const [checkGibberishDetection, setCheckGibberishDetection] = useState(false)
  const [checkResponseQualityScoring, setCheckResponseQualityScoring] = useState(false)
  const [checkTranslationAccuracy, setCheckTranslationAccuracy] = useState(false)
  const [checkDuplicateSentenceDetection, setCheckDuplicateSentenceDetection] = useState(false)
  const [checkReadabilityLevel, setCheckReadabilityLevel] = useState(false)
  const [checkSQLQueryValidation, setCheckSQLQueryValidation] = useState(false)
  const [checkOllamaResponseValidation, setCheckOllamaResponseValidation] = useState(false)
  const [checkLogicFlowValidation, setCheckLogicFlowValidation] = useState(false)
  const [checkJSONFormatValidation, setCheckJSONFormatValidation] = useState(false)

  // Monitoring & Evaluation
  const [checkAIResponseMonitorEval, setCheckAIResponseMonitorEval] = useState("Each time")
  const [checkQualityTrends, setCheckQualityTrends] = useState(false)
  const [checkLatency, setCheckLatency] = useState(false)
  const [checkCost, setCheckCost] = useState(false)
  const [checkModelDataDrift, setCheckModelDataDrift] = useState(false)
  const [checkUserFeedback, setCheckUserFeedback] = useState(false)
  const [checkAccuracy, setCheckAccuracy] = useState(false)
  const [checkHallucinationRate, setCheckHallucinationRate] = useState(false)
  const [checkRegression, setCheckRegression] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        style={{ backgroundColor: 'var(--gray3)' }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your preferences, chat display, and plan.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" orientation="vertical" className="min-h-[360px]">
          <TabsList className="w-40 shrink-0">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="system_prompt">System Prompt</TabsTrigger>
            <TabsTrigger value="rag">RAG</TabsTrigger>
            <TabsTrigger value="toolcall">Tool Call</TabsTrigger>
            <TabsTrigger value="llm_engineering">LLM Engineering</TabsTrigger>
            <TabsTrigger value="guardrail">Guardrail</TabsTrigger>
            <TabsTrigger value="monitor_eval">Monitor & Eval</TabsTrigger>
          </TabsList>

          {/* Account tab */}
          <TabsContent value="account" className="flex flex-col gap-4 px-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select">Username: {username}</Label>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select">Email: {email}</Label>
            </div>
            <div className="flex items-center justify-between">
              <Button
                className="w-fit"
                disabled={isSubscribing}
                // onClick={handleSubscribeClick}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >Deactivate account</Button>
            </div>
            <div className="flex items-center justify-between">
              <Button
                className="w-fit"
                disabled={isSubscribing}
                // onClick={handleSubscribeClick}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >Sign-out</Button>
            </div>
          </TabsContent>

          {/* General tab */}
          <TabsContent value="general" className="flex flex-col gap-4 px-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger
                    id="theme-select"
                    className="w-32"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                  <SelectItem
                    value="system"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    System
                  </SelectItem>
                  <SelectItem
                    value="light"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Light
                  </SelectItem>
                  <SelectItem
                    value="dark"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Dark
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="language-select">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger
                    id="language-select" className="w-32"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                  <SelectItem
                    value="en"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    English
                  </SelectItem>
                  <SelectItem
                    value="es"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Español
                  </SelectItem>
                  <SelectItem
                    value="fr"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Français
                  </SelectItem>
                  <SelectItem
                    value="ja"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    日本語
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="send-on-enter"
                checked={sendOnEnter}
                onCheckedChange={(checked) => setSendOnEnter(checked === true)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
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
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              />
              <Label htmlFor="sound-enabled" className="font-normal">
                Play sound on new message
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
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
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

          {/* Chat tab */}
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
              <Select
                value={density}
                onValueChange={setDensity}
              >
                <SelectTrigger
                    id="density-select"
                    className="w-40"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <SelectValue placeholder="Density" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                  <SelectItem
                    value="compact"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Compact
                  </SelectItem>
                  <SelectItem
                    value="comfortable"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Comfortable
                  </SelectItem>
                  <SelectItem
                    value="spacious"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Spacious
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="show-timestamps"
                checked={showTimestamps}
                onCheckedChange={(checked) => setShowTimestamps(checked === true)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
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
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              />
              <Label htmlFor="markdown-rendering" className="font-normal">
                Render Markdown &amp; code blocks
              </Label>
            </div>
          </TabsContent>

          {/* System Prompt tab */}
          <TabsContent value="system_prompt" className="flex flex-col gap-3 px-1">
            <div className="flex flex-col gap-3 py-2">
              <Label htmlFor="system-prompt">System settings</Label>
              <Textarea
                id="system-prompt"
                rows={6}
                placeholder="You are a helpful assistant…"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              />

              <div className="flex flex-col">
                {/* Context length — separate from the collapsible accordion since it
                affects VRAM at load time, not just generation behaviour */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="generation-settings">
                    <AccordionTrigger>
                      Context Window
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-3">
                        
                        <div className="flex items-center">
                          <Label className="w-32 shrink-0">Context length:</Label>
                          <Select
                            value={String(numCtx)}
                            onValueChange={(v) => setNumCtx(Number(v))}
                          >
                            <SelectTrigger className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {NUM_CTX_OPTIONS.map((n) => (
                                <SelectItem
                                  key={n}
                                  value={String(n)}
                                  style = {{ backgroundColor: 'var(--gray3)' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
                                >
                                  {formatCtx(n)} tokens
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center">
                          <Label className="w-32 shrink-0">Max reply tokens:</Label>
                          <NumericUpDown
                            className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                            value={maxReplyTokens}
                            min={64}
                            max={numCtx}
                            step={64}
                            onValueChange={setMaxReplyTokens}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="generation-settings">
                    <AccordionTrigger>
                      More Settings (Think {thinkingQuality})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-4">
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
              </div>
            </div>
          </TabsContent>

          {/* RAG tab */}
          <TabsContent value="rag" className="flex flex-col gap-3 px-1">
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="similarity-search-settings">
                  <AccordionTrigger>
                    Similarity Search
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <Label className="w-full shrink-0">Model: {similaritySearchModel}</Label>
                      <div className="flex items-center">
                        <Label className="w-32 shrink-0">TopK ({similaritySearchTopK}):</Label>
                        <NumericUpDown
                          className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                          value={similaritySearchTopK}
                          min={0}
                          step={1}
                          onValueChange={setTopK}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="rerank-settings">
                  <AccordionTrigger>
                    Rerank
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="rerank-active"
                          checked={rerankActive}
                          onCheckedChange={(checked) => setRerankActive(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="rerank-active" className="font-normal">
                          Active
                        </Label>
                      </div>
                      <Label className="w-full shrink-0">Model: {rerankModel}</Label>
                      <div className="flex items-center">
                        <Label className="w-32 shrink-0">TopK ({rerankTopK}):</Label>
                        <NumericUpDown
                          className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                          value={rerankTopK}
                          min={0}
                          step={1}
                          onValueChange={setRerankTopK}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Toolcall tab */}
          <TabsContent value="toolcall" className="flex flex-col gap-3 px-1">
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="database-management-settings">
                  <AccordionTrigger>
                    Database Management
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="read-db-access"
                          checked={dbReadAccess}
                          onCheckedChange={(checked) => setDbReadAccess(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="read-db-access" className="font-normal">
                          Read Access
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="write-db-access"
                          checked={dbWriteAccess}
                          onCheckedChange={(checked) => setDbWriteAccess(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="write-db-access" className="font-normal">
                          Write Access
                        </Label>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="db-ask-permission">Ask Permission</Label>
                        <Select value={dbAskPermission} onValueChange={setDbAskPermission}>
                          <SelectTrigger
                              id="db-ask-permission" className="w-32"
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                          >
                            <SelectValue placeholder="Per Access" />
                          </SelectTrigger>
                          <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                            <SelectItem
                              value="No"
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            >
                              No
                            </SelectItem>
                            <SelectItem
                              value="Per Access"
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            >
                              Per Access
                            </SelectItem>
                            <SelectItem
                              value="Single Batch"
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            >
                              Single Batch
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="file-management-settings">
                  <AccordionTrigger>
                    File Management
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="read-file-access"
                          checked={fileReadAccess}
                          onCheckedChange={(checked) => setFileReadAccess(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="read-file-access" className="font-normal">
                          Read Access
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="write-file-access"
                          checked={fileWriteAccess}
                          onCheckedChange={(checked) => setFileWriteAccess(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="write-file-access" className="font-normal">
                          Write Access
                        </Label>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="file-ask-permission">Ask Permission</Label>
                        <Select value={fileAskPermission} onValueChange={setFileAskPermission}>
                          <SelectTrigger
                              id="file-ask-permission" className="w-32"
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                          >
                            <SelectValue placeholder="Per Access" />
                          </SelectTrigger>
                          <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                            <SelectItem
                              value="No"
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            >
                              No
                            </SelectItem>
                            <SelectItem
                              value="Per Access"
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            >
                              Per Access
                            </SelectItem>
                            <SelectItem
                              value="Single Batch"
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            >
                              Single Batch
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* LLM Engineering tab */}
          <TabsContent value="llm_engineering" className="flex flex-col gap-3 px-1">
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="general-llm-settings">
                  <AccordionTrigger>
                    General
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="active-llm-engineering"
                        checked={llmEngActive}
                        onCheckedChange={(checked) => setLlmEngActive(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="active-llm-engineering" className="font-normal">
                        Active
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <Label className="w-32 shrink-0">Max retries:</Label>
                      <NumericUpDown
                        className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                        value={maxRetries}
                        min={0}
                        step={1}
                        onValueChange={setMaxRetries}
                      />
                    </div>
                    <div className="flex items-center">
                      <Label className="w-32 shrink-0">Timeout (sec):</Label>
                      <NumericUpDown
                        className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                        value={llmTimeout}
                        min={1}
                        step={0.1}
                        onValueChange={setLlmTimeout}
                      />
                    </div>
                    <div className="flex items-center">
                      <Label className="w-32 shrink-0">Retry memory depth:</Label>
                      <NumericUpDown
                        className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                        value={retryMemDepth}
                        min={1}
                        step={1}
                        onValueChange={setRetryMemDepth}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="context-permission">Context Compression</Label>
                      <Select value={contextCompress} onValueChange={setContextCompress}>
                        <SelectTrigger
                            id="context-permission" className="w-32"
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        >
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                          <SelectItem
                            value="None"
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                          >
                            None
                          </SelectItem>
                          <SelectItem
                            value="Sliding Window"
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                          >
                            Sliding Window
                          </SelectItem>
                          <SelectItem
                            value="Summarization on Threshold"
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                          >
                            Summarization on Threshold
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tester-settings">
                  <AccordionTrigger>
                    Tester
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="file-management-correctness"
                          checked={fileMgmtCorrectness}
                          onCheckedChange={(checked) => setFileMgmtCorrectness(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="file-management-correctness" className="font-normal">
                          File management correctness
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="db-management-correctness"
                          checked={dbMgmtCorrectness}
                          onCheckedChange={(checked) => setDBMgmtCorrectness(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="db-management-correctness" className="font-normal">
                          Database management correctness
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="guardrail-active"
                          checked={guardrailActive}
                          onCheckedChange={(checked) => setGuardrailActive(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="guardrail-active" className="font-normal">
                          Guardrails
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="monitor-active"
                          checked={monitorActive}
                          onCheckedChange={(checked) => setMonitorActive(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="monitor-active" className="font-normal">
                          Monitoring
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="eval-active"
                          checked={evalActive}
                          onCheckedChange={(checked) => setEvalActive(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                        <Label htmlFor="eval-active" className="font-normal">
                          Evaluation
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Guardrail tab */}
          <TabsContent value="guardrail" className="flex flex-col gap-3 px-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="check-response-guardrail">Check assistant response:</Label>
              <Select value={checkAIResponseGuardrail} onValueChange={setCheckAIResponseGuardrail}>
                <SelectTrigger
                    id="check-response-guardrail" className="w-32"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <SelectValue placeholder="Each Time" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                  <SelectItem
                    value="Each Time"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Each Time
                  </SelectItem>
                  <SelectItem
                    value="Manual"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Manual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Security & Privacy */}
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="security-privacy">
                  <AccordionTrigger>
                    Security & Privacy
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkInappropriateContent"
                        checked={checkInappropriateContent}
                        onCheckedChange={(checked) => setCheckInappropriateContent(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkInappropriateContent" className="font-normal">
                        Inappropriate content
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkOffensiveLanguage"
                        checked={checkOffensiveLanguage}
                        onCheckedChange={(checked) => setCheckOffensiveLanguage(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkOffensiveLanguage" className="font-normal">
                        Offensive language
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkPromptInjection"
                        checked={checkPromptInjection}
                        onCheckedChange={(checked) => setCheckPromptInjection(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkPromptInjection" className="font-normal">
                        Prompt Injection
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkSensitiveContent"
                        checked={checkSensitiveContent}
                        onCheckedChange={(checked) => setCheckSensitiveContent(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkSensitiveContent" className="font-normal">
                        Inappropriate content
                      </Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            {/* Response & Relevance */}
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="response-relevance">
                  <AccordionTrigger>
                    Response & Relevance
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkRelevanceCheck"
                        checked={checkRelevanceCheck}
                        onCheckedChange={(checked) => setCheckRelevanceCheck(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkRelevanceCheck" className="font-normal">
                        Relevance check
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkPromptAddressConfirmation"
                        checked={checkPromptAddressConfirmation}
                        onCheckedChange={(checked) => setCheckPromptAddressConfirmation(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkPromptAddressConfirmation" className="font-normal">
                        Prompt-address confirmation
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkURLAvailability"
                        checked={checkURLAvailability}
                        onCheckedChange={(checked) => setCheckURLAvailability(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkURLAvailability" className="font-normal">
                        URL availability
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkFactCheck"
                        checked={checkFactCheck}
                        onCheckedChange={(checked) => setCheckFactCheck(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkFactCheck" className="font-normal">
                        Fact-check
                      </Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            {/* Content Validation & Integrity */}
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="response-relevance">
                  <AccordionTrigger>
                    Content validation & integrity
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkCompetitorMentionBlocking"
                        checked={checkCompetitorMentionBlocking}
                        onCheckedChange={(checked) => setCheckCompetitorMentionBlocking(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkCompetitorMentionBlocking" className="font-normal">
                        Competitor-mention blocking
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkPriceQuoteValidation"
                        checked={checkPriceQuoteValidation}
                        onCheckedChange={(checked) => setCheckPriceQuoteValidation(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkPriceQuoteValidation" className="font-normal">
                        Price-quote validation
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkSourceContextGrounding"
                        checked={checkSourceContextGrounding}
                        onCheckedChange={(checked) => setCheckSourceContextGrounding(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkSourceContextGrounding" className="font-normal">
                        Source/context grounding
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkGibberishDetection"
                        checked={checkGibberishDetection}
                        onCheckedChange={(checked) => setCheckGibberishDetection(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkGibberishDetection" className="font-normal">
                        Gibberish detection
                      </Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            {/* Language Quality */}
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="response-relevance">
                  <AccordionTrigger>
                    Language quality
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkResponseQualityScoring"
                        checked={checkResponseQualityScoring}
                        onCheckedChange={(checked) => setCheckResponseQualityScoring(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkResponseQualityScoring" className="font-normal">
                        Response quality scoring
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkTranslationAccuracy"
                        checked={checkTranslationAccuracy}
                        onCheckedChange={(checked) => setCheckTranslationAccuracy(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkTranslationAccuracy" className="font-normal">
                        Translation accuracy
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkDuplicateSentenceDetection"
                        checked={checkDuplicateSentenceDetection}
                        onCheckedChange={(checked) => setCheckDuplicateSentenceDetection(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkDuplicateSentenceDetection" className="font-normal">
                        Duplicate-sentence detection
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkReadabilityLevel"
                        checked={checkReadabilityLevel}
                        onCheckedChange={(checked) => setCheckReadabilityLevel(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkReadabilityLevel" className="font-normal">
                        Readability level
                      </Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            {/* Logic & Functionality */}
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="response-relevance">
                  <AccordionTrigger>
                    Logic & functionality
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkSQLQueryValidation"
                        checked={checkSQLQueryValidation}
                        onCheckedChange={(checked) => setCheckSQLQueryValidation(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkSQLQueryValidation" className="font-normal">
                        SQL query validation
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkOllamaResponseValidation"
                        checked={checkOllamaResponseValidation}
                        onCheckedChange={(checked) => setCheckOllamaResponseValidation(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkOllamaResponseValidation" className="font-normal">
                        Ollama response validation
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkLogicFlowValidation"
                        checked={checkLogicFlowValidation}
                        onCheckedChange={(checked) => setCheckLogicFlowValidation(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkLogicFlowValidation" className="font-normal">
                        Logic-flow validation
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkJSONFormatValidation"
                        checked={checkJSONFormatValidation}
                        onCheckedChange={(checked) => setCheckJSONFormatValidation(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkJSONFormatValidation" className="font-normal">
                        JSON format validation
                      </Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* Monitoring & Evaluation tab */}
          <TabsContent value="monitor_eval" className="flex flex-col gap-3 px-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="check-response-monitor-eval">Check assistant response:</Label>
              <Select value={checkAIResponseMonitorEval} onValueChange={setCheckAIResponseMonitorEval}>
                <SelectTrigger
                    id="check-response-monitor-eval" className="w-32"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  <SelectValue placeholder="Each Time" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: 'var(--gray3)' }}>
                  <SelectItem
                    value="Each Time"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Each Time
                  </SelectItem>
                  <SelectItem
                    value="Manual"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    Manual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Monitoring */}
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="monitoring">
                  <AccordionTrigger>
                    Monitoring
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkQualityTrends"
                        checked={checkQualityTrends}
                        onCheckedChange={(checked) => setCheckQualityTrends(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkQualityTrends" className="font-normal">
                        Quality trends
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkLatency"
                        checked={checkLatency}
                        onCheckedChange={(checked) => setCheckLatency(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkLatency" className="font-normal">
                        Latency
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkCost"
                        checked={checkCost}
                        onCheckedChange={(checked) => setCheckCost(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkCost" className="font-normal">
                        Cost
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkModelDataDrift"
                        checked={checkModelDataDrift}
                        onCheckedChange={(checked) => setCheckModelDataDrift(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkModelDataDrift" className="font-normal">
                        Model/data drift
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkSensitivecheckUserFeedbackContent"
                        checked={checkUserFeedback}
                        onCheckedChange={(checked) => setCheckUserFeedback(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkUserFeedback" className="font-normal">
                        User feedback
                      </Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            {/* Evaluation */}
            <div className="flex flex-col">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="evaluation">
                  <AccordionTrigger>
                    Evaluation
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkAccuracy"
                        checked={checkAccuracy}
                        onCheckedChange={(checked) => setCheckAccuracy(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkAccuracy" className="font-normal">
                        Accuracy
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkHallucinationRate"
                        checked={checkHallucinationRate}
                        onCheckedChange={(checked) => setCheckHallucinationRate(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkHallucinationRate" className="font-normal">
                        Hallucination rate
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="checkRegression"
                        checked={checkRegression}
                        onCheckedChange={(checked) => setCheckRegression(checked === true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      />
                      <Label htmlFor="checkRegression" className="font-normal">
                        Regression
                      </Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
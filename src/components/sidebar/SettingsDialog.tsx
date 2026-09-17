// src/components/dialogs/SettingsDialog.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { SettingsDialogProps } from '@/src/types/props'

import { Separator } from '../ui/separator'

import { AccountTab } from '../settings/account'
import { GeneralTab } from '../settings/general'
import { SubscriptionTab } from '../settings/subscription'
import { ChatTab } from '../settings/chat'
import { SystemPromptTab } from '../settings/systemPrompt'
import { RAGTab } from '../settings/rag'
import { ToolcallTab } from '../settings/toolcall'
import { LLMEngineeringTab } from '../settings/llmEngineering'
import { GuardrailTab } from '../settings/guardrail'
import { MonitorEvalTab } from '../settings/monitorEval'

async function subscribeToPlus() {
  const res = await fetch('/api/subscription', {
    method: 'POST',
  })
  const data = await res.json()
  window.location.href = data.url
}

export function SettingsDialog({
  open,
  onOpenChange,
  activeTab,
  temperature,
  setTemperature,
  topP,
  setTopP,
  topK,
  setTopK,
  numCtx,
  setNumCtx,
  numPredict,
  setNumPredict
}: SettingsDialogProps) {
  const [tab, setTab] = useState(activeTab)

  // Account
  const [username, setUsername] = useState('(username)')
  const [email, setEmail] = useState('(email)')
  const [isDeactivateAccount, setDeactivateAccount] = useState(false)
  const [isSignout, setSignout] = useState(false)

  // General
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('en')
  const [sendOnEnter, setSendOnEnter] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

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

  // Chat display
  const [fontSize, setFontSize] = useState(14)
  const [density, setDensity] = useState('comfortable')
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [markdownRendering, setMarkdownRendering] = useState(true)

  // System prompt
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
  const thinkingQuality = getThinkingQuality(temperature, topP, topK)

  // RAG
  const [similaritySearchModel, setSimilaritySearchModel] = useState(process.env.OLLAMA_EMBED_MODEL || "(OLLAMA_EMBED_MODEL)")
  const [similaritySearchTopK, setSimilaritySearchTopK] = useState(5)
  const [rerankActive, setRerankActive] = useState(true)
  const [rerankModel, setRerankModel] = useState(process.env.HF_RERANK_MODEL || "(HF_RERANK_MODEL)")
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
  const [checkAIResponseGuardrail, setCheckAIResponseGuardrail] = useState("Each Time")
  const [checkInappropriateContent, setCheckInappropriateContent] = useState(true)
  const [checkOffensiveLanguage, setCheckOffensiveLanguage] = useState(true)
  const [checkPromptInjection, setCheckPromptInjection] = useState(true)
  const [checkSensitiveContent, setCheckSensitiveContent] = useState(true)
  const [checkRelevanceCheck, setCheckRelevanceCheck] = useState(true)
  const [checkPromptAddressConfirmation, setCheckPromptAddressConfirmation] = useState(true)
  const [checkURLAvailability, setCheckURLAvailability] = useState(true)
  const [checkFactCheck, setCheckFactCheck] = useState(true)
  const [checkCompetitorMentionBlocking, setCheckCompetitorMentionBlocking] = useState(true)
  const [checkPriceQuoteValidation, setCheckPriceQuoteValidation] = useState(true)
  const [checkSourceContextGrounding, setCheckSourceContextGrounding] = useState(true)
  const [checkGibberishDetection, setCheckGibberishDetection] = useState(true)
  const [checkResponseQualityScoring, setCheckResponseQualityScoring] = useState(true)
  const [checkTranslationAccuracy, setCheckTranslationAccuracy] = useState(true)
  const [checkDuplicateSentenceDetection, setCheckDuplicateSentenceDetection] = useState(true)
  const [checkReadabilityLevel, setCheckReadabilityLevel] = useState(true)
  const [checkSQLQueryValidation, setCheckSQLQueryValidation] = useState(true)
  const [checkOllamaResponseValidation, setCheckOllamaResponseValidation] = useState(true)
  const [checkLogicFlowValidation, setCheckLogicFlowValidation] = useState(true)
  const [checkJSONFormatValidation, setCheckJSONFormatValidation] = useState(true)

  // Monitoring & Evaluation
  const [checkAIResponseMonitorEval, setCheckAIResponseMonitorEval] = useState("Each Time")
  const [checkQualityTrends, setCheckQualityTrends] = useState(true)
  const [checkLatency, setCheckLatency] = useState(true)
  const [checkCost, setCheckCost] = useState(true)
  const [checkModelDataDrift, setCheckModelDataDrift] = useState(true)
  const [checkUserFeedback, setCheckUserFeedback] = useState(true)
  const [checkAccuracy, setCheckAccuracy] = useState(true)
  const [checkHallucinationRate, setCheckHallucinationRate] = useState(true)
  const [checkRegression, setCheckRegression] = useState(true)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => onOpenChange(isOpen)}>
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

        <Separator className="bg-[var(--gray2)] -mt-2"/>

        <Tabs
          defaultValue={activeTab}
          onValueChange={setTab}
          orientation="vertical"
          className="min-h-[360px]"
        >
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

          <AccountTab
            username={username}
            email={email}
          />

          <GeneralTab
            theme={theme}
            language={language}
            sendOnEnter={sendOnEnter}
            soundEnabled={soundEnabled}
            setTheme={setTheme}
            setLanguage={setLanguage}
            setSendOnEnter={setSendOnEnter}
            setSoundEnabled={setSoundEnabled}
          />

          <SubscriptionTab
            isSubscribing={isSubscribing}
            handleSubscribeClick={handleSubscribeClick}
          />

          <ChatTab
            fontSize={fontSize}
            density={density}
            showTimestamps={showTimestamps}
            markdownRendering={markdownRendering}
            setFontSize={setFontSize}
            setDensity={setDensity}
            setShowTimestamps={setShowTimestamps}
            setMarkdownRendering={setMarkdownRendering}
          />

          <SystemPromptTab
            systemPrompt={systemPrompt}
            numCtx={numCtx}
            maxReplyTokens={numPredict}
            thinkingQuality={thinkingQuality}
            temperature={temperature}
            topP={topP}
            topK={topK}
            setSystemPrompt={setSystemPrompt}
            setNumCtx={setNumCtx}
            setMaxReplyTokens={setNumPredict}
            setTemperature={setTemperature}
            setTopP={setTopP}
            setTopK={setTopK}
          />

          <RAGTab
            similaritySearchModel={similaritySearchModel}
            similaritySearchTopK={similaritySearchTopK}
            rerankActive={rerankActive}
            rerankModel={rerankModel}
            rerankTopK={rerankTopK}
            setSimilaritySearchTopK={setSimilaritySearchTopK}
            setRerankActive={setRerankActive}
            setRerankTopK={setRerankTopK}
          />

          <ToolcallTab
            dbReadAccess={dbReadAccess}
            dbWriteAccess={dbWriteAccess}
            dbAskPermission={dbAskPermission}
            fileReadAccess={fileReadAccess}
            fileWriteAccess={fileWriteAccess}
            fileAskPermission={fileAskPermission}
            setDbReadAccess={setDbReadAccess}
            setDbWriteAccess={setDbWriteAccess}
            setDbAskPermission={setDbAskPermission}
            setFileReadAccess={setFileReadAccess}
            setFileWriteAccess={setFileWriteAccess}
            setFileAskPermission={setFileAskPermission}
          />

          <LLMEngineeringTab
            llmEngActive={llmEngActive}
            maxRetries={maxRetries}
            llmTimeout={llmTimeout}
            retryMemDepth={retryMemDepth}
            contextCompress={contextCompress}
            fileMgmtCorrectness={fileMgmtCorrectness}
            dbMgmtCorrectness={dbMgmtCorrectness}
            guardrailActive={guardrailActive}
            monitorActive={monitorActive}
            evalActive={evalActive}
            setLlmEngActive={setLlmEngActive}
            setMaxRetries={setMaxRetries}
            setLlmTimeout={setLlmTimeout}
            setRetryMemDepth={setRetryMemDepth}
            setContextCompress={setContextCompress}
            setFileMgmtCorrectness={setFileMgmtCorrectness}
            setDBMgmtCorrectness={setDBMgmtCorrectness}
            setGuardrailActive={setGuardrailActive}
            setMonitorActive={setMonitorActive}
            setEvalActive={setEvalActive}
          />

          <GuardrailTab
            checkAIResponseGuardrail={checkAIResponseGuardrail}
            checkInappropriateContent={checkInappropriateContent}
            checkOffensiveLanguage={checkOffensiveLanguage}
            checkPromptInjection={checkPromptInjection}
            checkSensitiveContent={checkSensitiveContent}
            checkRelevanceCheck={checkRelevanceCheck}
            checkPromptAddressConfirmation={checkPromptAddressConfirmation}
            checkURLAvailability={checkURLAvailability}
            checkFactCheck={checkFactCheck}
            checkCompetitorMentionBlocking={checkCompetitorMentionBlocking}
            checkPriceQuoteValidation={checkPriceQuoteValidation}
            checkSourceContextGrounding={checkSourceContextGrounding}
            checkGibberishDetection={checkGibberishDetection}
            checkResponseQualityScoring={checkResponseQualityScoring}
            checkTranslationAccuracy={checkTranslationAccuracy}
            checkDuplicateSentenceDetection={checkDuplicateSentenceDetection}
            checkReadabilityLevel={checkReadabilityLevel}
            checkSQLQueryValidation={checkSQLQueryValidation}
            checkOllamaResponseValidation={checkOllamaResponseValidation}
            checkLogicFlowValidation={checkLogicFlowValidation}
            checkJSONFormatValidation={checkJSONFormatValidation}
            setCheckAIResponseGuardrail={setCheckAIResponseGuardrail}
            setCheckInappropriateContent={setCheckInappropriateContent}
            setCheckOffensiveLanguage={setCheckOffensiveLanguage}
            setCheckPromptInjection={setCheckPromptInjection}
            setCheckSensitiveContent={setCheckSensitiveContent}
            setCheckRelevanceCheck={setCheckRelevanceCheck}
            setCheckPromptAddressConfirmation={setCheckPromptAddressConfirmation}
            setCheckURLAvailability={setCheckURLAvailability}
            setCheckFactCheck={setCheckFactCheck}
            setCheckCompetitorMentionBlocking={setCheckCompetitorMentionBlocking}
            setCheckPriceQuoteValidation={setCheckPriceQuoteValidation}
            setCheckSourceContextGrounding={setCheckSourceContextGrounding}
            setCheckGibberishDetection={setCheckGibberishDetection}
            setCheckResponseQualityScoring={setCheckResponseQualityScoring}
            setCheckTranslationAccuracy={setCheckTranslationAccuracy}
            setCheckDuplicateSentenceDetection={setCheckDuplicateSentenceDetection}
            setCheckReadabilityLevel={setCheckReadabilityLevel}
            setCheckSQLQueryValidation={setCheckSQLQueryValidation}
            setCheckOllamaResponseValidation={setCheckOllamaResponseValidation}
            setCheckLogicFlowValidation={setCheckLogicFlowValidation}
            setCheckJSONFormatValidation={setCheckJSONFormatValidation}
          />

          <MonitorEvalTab
            checkAIResponseMonitorEval={checkAIResponseMonitorEval}
            checkQualityTrends={checkQualityTrends}
            checkLatency={checkLatency}
            checkCost={checkCost}
            checkModelDataDrift={checkModelDataDrift}
            checkUserFeedback={checkUserFeedback}
            checkAccuracy={checkAccuracy}
            checkHallucinationRate={checkHallucinationRate}
            checkRegression={checkRegression}
            setCheckAIResponseMonitorEval={setCheckAIResponseMonitorEval}
            setCheckQualityTrends={setCheckQualityTrends}
            setCheckLatency={setCheckLatency}
            setCheckCost={setCheckCost}
            setCheckModelDataDrift={setCheckModelDataDrift}
            setCheckUserFeedback={setCheckUserFeedback}
            setCheckAccuracy={setCheckAccuracy}
            setCheckHallucinationRate={setCheckHallucinationRate}
            setCheckRegression={setCheckRegression}
          />
        </Tabs>

        <div className="flex justify-end gap-2 pt-2 pr-2">
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
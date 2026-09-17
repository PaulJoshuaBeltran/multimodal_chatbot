// src/types/settings.ts
export interface AccountTabProps{
    username: string
    email: string
}

export interface GeneralTabProps{
    theme: string
    language: string
    sendOnEnter: boolean
    soundEnabled: boolean
    setTheme: (theme: string) => void
    setLanguage: (language: string) => void
    setSendOnEnter: (checked: boolean) => void
    setSoundEnabled: (checked: boolean) => void
}

export interface SubscriptionTabProps{
    isSubscribing: boolean
    handleSubscribeClick: () => void
}

export interface ChatTabProps{
    fontSize: number
    density: string
    showTimestamps: boolean
    markdownRendering: boolean
    setFontSize: (fontSize: number) => void
    setDensity: (density: string) => void
    setShowTimestamps: (checked: boolean) => void
    setMarkdownRendering: (checked: boolean) => void
}
export interface SystemPromptTabProps{
    systemPrompt: string
    numCtx: number
    maxReplyTokens: number
    thinkingQuality: string
    temperature: number
    topP: number
    topK: number
    setSystemPrompt: (systemPrompt: string) => void
    setNumCtx: (numCtx: number) => void
    setMaxReplyTokens: (maxReplyTokens: number) => void
    setTemperature: (temperature: number) => void
    setTopP: (topP: number) => void
    setTopK: (topK: number) => void
}

export interface RAGTabProps{
    similaritySearchModel: string
    similaritySearchTopK: number
    rerankActive: boolean
    rerankModel: string
    rerankTopK: number
    setSimilaritySearchTopK: (similaritySearchTopK: number) => void
    setRerankActive: (rerankActive: boolean) => void
    setRerankTopK: (rerankTopK: number) => void
}

export interface ToolcallTabProps{
    dbReadAccess: boolean
    dbWriteAccess: boolean
    dbAskPermission: string
    fileReadAccess: boolean
    fileWriteAccess: boolean
    fileAskPermission: string
    setDbReadAccess: (dbReadAccess: boolean) => void
    setDbWriteAccess: (dbWriteAccess: boolean) => void
    setDbAskPermission: (dbAskPermission: string) => void
    setFileReadAccess: (fileReadAccess: boolean) => void
    setFileWriteAccess: (fileWriteAccess: boolean) => void
    setFileAskPermission: (fileAskPermission: string) => void
}

export interface LLMEngineeringTabProps{
    llmEngActive: boolean
    maxRetries: number
    llmTimeout: number
    retryMemDepth: number
    contextCompress: string
    fileMgmtCorrectness: boolean
    dbMgmtCorrectness: boolean
    guardrailActive: boolean
    monitorActive: boolean
    evalActive: boolean
    setLlmEngActive: (llmEngActive: boolean) => void
    setMaxRetries: (maxRetries: number) => void
    setLlmTimeout: (llmTimeout: number) => void
    setRetryMemDepth: (retryMemDepth: number) => void
    setContextCompress: (contextCompress: string) => void
    setFileMgmtCorrectness: (fileMgmtCorrectness: boolean) => void
    setDBMgmtCorrectness: (dbMgmtCorrectness: boolean) => void
    setGuardrailActive: (guardrailActive: boolean) => void
    setMonitorActive: (monitorActive: boolean) => void
    setEvalActive: (evalActive: boolean) => void
}

export interface GuardrailTabProps{
    checkAIResponseGuardrail: string
    checkInappropriateContent: boolean
    checkOffensiveLanguage: boolean
    checkPromptInjection: boolean
    checkSensitiveContent: boolean
    checkRelevanceCheck: boolean
    checkPromptAddressConfirmation: boolean
    checkURLAvailability: boolean
    checkFactCheck: boolean
    checkCompetitorMentionBlocking: boolean
    checkPriceQuoteValidation: boolean
    checkSourceContextGrounding: boolean
    checkGibberishDetection: boolean
    checkResponseQualityScoring: boolean
    checkTranslationAccuracy: boolean
    checkDuplicateSentenceDetection: boolean
    checkReadabilityLevel: boolean
    checkSQLQueryValidation: boolean
    checkOllamaResponseValidation: boolean
    checkLogicFlowValidation: boolean
    checkJSONFormatValidation: boolean
    setCheckAIResponseGuardrail: (checkAIResponseGuardrail: string) => void
    setCheckInappropriateContent: (checkInappropriateContent: boolean) => void
    setCheckOffensiveLanguage: (checkOffensiveLanguage: boolean) => void
    setCheckPromptInjection: (checkPromptInjection: boolean) => void
    setCheckSensitiveContent: (checkSensitiveContent: boolean) => void
    setCheckRelevanceCheck: (checkRelevanceCheck: boolean) => void
    setCheckPromptAddressConfirmation: (checkRelevanceCheck: boolean) => void
    setCheckURLAvailability: (checkURLAvailability: boolean) => void
    setCheckFactCheck: (checkFactCheck: boolean) => void
    setCheckCompetitorMentionBlocking: (checkCompetitorMentionBlocking: boolean) => void
    setCheckPriceQuoteValidation: (checkPriceQuoteValidation: boolean) => void
    setCheckSourceContextGrounding: (checkSourceContextGrounding: boolean) => void
    setCheckGibberishDetection: (checkGibberishDetection: boolean) => void
    setCheckResponseQualityScoring: (checkResponseQualityScoring: boolean) => void
    setCheckTranslationAccuracy: (checkTranslationAccuracy: boolean) => void
    setCheckDuplicateSentenceDetection: (checkDuplicateSentenceDetection: boolean) => void
    setCheckReadabilityLevel: (checkReadabilityLevel: boolean) => void
    setCheckSQLQueryValidation: (checkSQLQueryValidation: boolean) => void
    setCheckOllamaResponseValidation: (checkOllamaResponseValidation: boolean) => void
    setCheckLogicFlowValidation: (checkLogicFlowValidation: boolean) => void
    setCheckJSONFormatValidation: (checkJSONFormatValidation: boolean) => void
}

export interface MonitorEvalTabProps{
    checkAIResponseMonitorEval: string
    checkQualityTrends: boolean
    checkLatency: boolean
    checkCost: boolean
    checkModelDataDrift: boolean
    checkUserFeedback: boolean
    checkAccuracy: boolean
    checkHallucinationRate: boolean
    checkRegression: boolean
    setCheckAIResponseMonitorEval: (checkAIResponseMonitorEval: string) => void
    setCheckQualityTrends: (checkQualityTrends: boolean) => void
    setCheckLatency: (checkLatency: boolean) => void
    setCheckCost: (checkCost: boolean) => void
    setCheckModelDataDrift: (checkModelDataDrift: boolean) => void
    setCheckUserFeedback: (checkUserFeedback: boolean) => void
    setCheckAccuracy: (checkAccuracy: boolean) => void
    setCheckHallucinationRate: (checkHallucinationRate: boolean) => void
    setCheckRegression: (checkRegression: boolean) => void
}
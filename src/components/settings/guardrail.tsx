import { TabsContent } from "../ui/tabs";
import { GuardrailTabProps } from "../../types/settings"
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";

export function GuardrailTab({ 
    checkAIResponseGuardrail,
    checkInappropriateContent,
    checkOffensiveLanguage,
    checkPromptInjection,
    checkSensitiveContent,
    checkRelevanceCheck,
    checkPromptAddressConfirmation,
    checkURLAvailability,
    checkFactCheck,
    checkCompetitorMentionBlocking,
    checkPriceQuoteValidation,
    checkSourceContextGrounding,
    checkGibberishDetection,
    checkResponseQualityScoring,
    checkTranslationAccuracy,
    checkDuplicateSentenceDetection,
    checkReadabilityLevel,
    checkSQLQueryValidation,
    checkOllamaResponseValidation,
    checkLogicFlowValidation,
    checkJSONFormatValidation,
    setCheckAIResponseGuardrail,
    setCheckInappropriateContent,
    setCheckOffensiveLanguage,
    setCheckPromptInjection,
    setCheckSensitiveContent,
    setCheckRelevanceCheck,
    setCheckPromptAddressConfirmation,
    setCheckURLAvailability,
    setCheckFactCheck,
    setCheckCompetitorMentionBlocking,
    setCheckPriceQuoteValidation,
    setCheckSourceContextGrounding,
    setCheckGibberishDetection,
    setCheckResponseQualityScoring,
    setCheckTranslationAccuracy,
    setCheckDuplicateSentenceDetection,
    setCheckReadabilityLevel,
    setCheckSQLQueryValidation,
    setCheckOllamaResponseValidation,
    setCheckLogicFlowValidation,
    setCheckJSONFormatValidation
}: GuardrailTabProps
){
    return (
        <TabsContent value="guardrail" className="flex flex-col gap-4 px-1">
            <ScrollArea type="auto" className="min-h-[360px] max-h-[450px] pr-5">
                <div className="flex items-center justify-between">
                <Label htmlFor="check-response-guardrail">Check assistant response:</Label>
                <Select value={checkAIResponseGuardrail} onValueChange={setCheckAIResponseGuardrail}>
                    <SelectTrigger
                        id="check-response-guardrail" className="w-33"
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
                <Separator className="bg-[var(--gray2)] mt-2"/>
                <div className="flex flex-col">
                <Accordion type="multiple" className="w-full">
                    {/* Security & Privacy */}
                    <AccordionItem value="security-privacy">
                    <AccordionTrigger>
                        Security & Privacy
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkInappropriateContent" className="font-normal">
                            Inappropriate content
                            </Label>
                            <Switch
                            id="checkInappropriateContent"
                            checked={checkInappropriateContent}
                            onCheckedChange={(checked) => setCheckInappropriateContent(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkOffensiveLanguage" className="font-normal">
                            Offensive language
                            </Label>
                            <Switch
                            id="checkOffensiveLanguage"
                            checked={checkOffensiveLanguage}
                            onCheckedChange={(checked) => setCheckOffensiveLanguage(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkPromptInjection" className="font-normal">
                            Prompt Injection
                            </Label>
                            <Switch
                            id="checkPromptInjection"
                            checked={checkPromptInjection}
                            onCheckedChange={(checked) => setCheckPromptInjection(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkSensitiveContent" className="font-normal">
                            Inappropriate content
                            </Label>
                            <Switch
                            id="checkSensitiveContent"
                            checked={checkSensitiveContent}
                            onCheckedChange={(checked) => setCheckSensitiveContent(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        </div>
                    </AccordionContent>
                    </AccordionItem>

                    {/* Response & Relevance */}
                    <AccordionItem value="response-relevance">
                    <AccordionTrigger>
                        Response & Relevance
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkRelevanceCheck" className="font-normal">
                            Relevance check
                            </Label>
                            <Switch
                            id="checkRelevanceCheck"
                            checked={checkRelevanceCheck}
                            onCheckedChange={(checked) => setCheckRelevanceCheck(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkPromptAddressConfirmation" className="font-normal">
                            Prompt-address confirmation
                            </Label>
                            <Switch
                            id="checkPromptAddressConfirmation"
                            checked={checkPromptAddressConfirmation}
                            onCheckedChange={(checked) => setCheckPromptAddressConfirmation(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkURLAvailability" className="font-normal">
                            URL availability
                            </Label>
                            <Switch
                            id="checkURLAvailability"
                            checked={checkURLAvailability}
                            onCheckedChange={(checked) => setCheckURLAvailability(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkFactCheck" className="font-normal">
                            Fact-check
                            </Label>
                            <Switch
                            id="checkFactCheck"
                            checked={checkFactCheck}
                            onCheckedChange={(checked) => setCheckFactCheck(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        </div>
                    </AccordionContent>
                    </AccordionItem>

                    {/* Content Validation & Integrity */}
                    <AccordionItem value="content-validation-integrity">
                    <AccordionTrigger>
                        Content validation & integrity
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkCompetitorMentionBlocking" className="font-normal">
                            Competitor-mention blocking
                            </Label>
                            <Switch
                            id="checkCompetitorMentionBlocking"
                            checked={checkCompetitorMentionBlocking}
                            onCheckedChange={(checked) => setCheckCompetitorMentionBlocking(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkPriceQuoteValidation" className="font-normal">
                            Price-quote validation
                            </Label>
                            <Switch
                            id="checkPriceQuoteValidation"
                            checked={checkPriceQuoteValidation}
                            onCheckedChange={(checked) => setCheckPriceQuoteValidation(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkSourceContextGrounding" className="font-normal">
                            Source/context grounding
                            </Label>
                            <Switch
                            id="checkSourceContextGrounding"
                            checked={checkSourceContextGrounding}
                            onCheckedChange={(checked) => setCheckSourceContextGrounding(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkGibberishDetection" className="font-normal">
                            Gibberish detection
                            </Label>
                            <Switch
                            id="checkGibberishDetection"
                            checked={checkGibberishDetection}
                            onCheckedChange={(checked) => setCheckGibberishDetection(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        </div>
                    </AccordionContent>
                    </AccordionItem>

                    {/* Language Quality */}
                    <AccordionItem value="language-quality">
                    <AccordionTrigger>
                        Language quality
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkResponseQualityScoring" className="font-normal">
                            Response quality scoring
                            </Label>
                            <Switch
                            id="checkResponseQualityScoring"
                            checked={checkResponseQualityScoring}
                            onCheckedChange={(checked) => setCheckResponseQualityScoring(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkTranslationAccuracy" className="font-normal">
                            Translation accuracy
                            </Label>
                            <Switch
                            id="checkTranslationAccuracy"
                            checked={checkTranslationAccuracy}
                            onCheckedChange={(checked) => setCheckTranslationAccuracy(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkDuplicateSentenceDetection" className="font-normal">
                            Duplicate-sentence detection
                            </Label>
                            <Switch
                            id="checkDuplicateSentenceDetection"
                            checked={checkDuplicateSentenceDetection}
                            onCheckedChange={(checked) => setCheckDuplicateSentenceDetection(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkReadabilityLevel" className="font-normal">
                            Readability level
                            </Label>
                            <Switch
                            id="checkReadabilityLevel"
                            checked={checkReadabilityLevel}
                            onCheckedChange={(checked) => setCheckReadabilityLevel(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        </div>
                    </AccordionContent>
                    </AccordionItem>

                    {/* Logic & Functionality */}
                    <AccordionItem value="logic-functionality">
                    <AccordionTrigger>
                        Logic & functionality
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkSQLQueryValidation" className="font-normal">
                            SQL query validation
                            </Label>
                            <Switch
                            id="checkSQLQueryValidation"
                            checked={checkSQLQueryValidation}
                            onCheckedChange={(checked) => setCheckSQLQueryValidation(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkOllamaResponseValidation" className="font-normal">
                            Ollama response validation
                            </Label>
                            <Switch
                            id="checkOllamaResponseValidation"
                            checked={checkOllamaResponseValidation}
                            onCheckedChange={(checked) => setCheckOllamaResponseValidation(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkLogicFlowValidation" className="font-normal">
                            Logic-flow validation
                            </Label>
                            <Switch
                            id="checkLogicFlowValidation"
                            checked={checkLogicFlowValidation}
                            onCheckedChange={(checked) => setCheckLogicFlowValidation(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="checkJSONFormatValidation" className="font-normal">
                            JSON format validation
                            </Label>
                            <Switch
                            id="checkJSONFormatValidation"
                            checked={checkJSONFormatValidation}
                            onCheckedChange={(checked) => setCheckJSONFormatValidation(checked === true)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            />
                        </div>
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                </Accordion>
                </div>
                <Separator className="bg-[var(--gray2)]"/>
            </ScrollArea>
        </TabsContent>
    )
}
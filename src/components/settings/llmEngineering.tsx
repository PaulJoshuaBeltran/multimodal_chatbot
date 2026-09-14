import { TabsContent } from "../ui/tabs";
import { LLMEngineeringTabProps } from "../../types/settings"
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { NumericUpDown } from "../ui/numeric-updown";

export function LLMEngineeringTab({ 
    llmEngActive,
    maxRetries,
    llmTimeout,
    retryMemDepth,
    contextCompress,
    fileMgmtCorrectness,
    dbMgmtCorrectness,
    guardrailActive,
    monitorActive,
    evalActive,
    setLlmEngActive,
    setMaxRetries,
    setLlmTimeout,
    setRetryMemDepth,
    setContextCompress,
    setFileMgmtCorrectness,
    setDBMgmtCorrectness,
    setGuardrailActive,
    setMonitorActive,
    setEvalActive
}: LLMEngineeringTabProps
){
    return (
        <TabsContent value="llm_engineering" className="flex flex-col gap-4 px-1 pr-5">
            <Separator className="bg-[var(--gray2)] -mb-3"/>
            <div className="flex flex-col  -translate-y-1.25">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="general-llm-settings">
                  <AccordionTrigger>
                    General
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="active-llm-engineering" className="font-normal">
                          Active
                        </Label>
                        <Switch
                          id="active-llm-engineering"
                          checked={llmEngActive}
                          onCheckedChange={(checked) => setLlmEngActive(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="w-82.5 shrink-0">Max retries:</Label>
                        <NumericUpDown
                          className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                          value={maxRetries}
                          min={0}
                          step={1}
                          onValueChange={setMaxRetries}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="w-82.5 shrink-0">Timeout (sec):</Label>
                        <NumericUpDown
                          className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                          value={llmTimeout}
                          min={1}
                          step={0.1}
                          onValueChange={setLlmTimeout}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="w-82.5 shrink-0">Retry memory depth:</Label>
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
                              id="context-permission" className="w-33"
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tester-settings">
                  <AccordionTrigger>
                    Tester
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="file-management-correctness" className="font-normal">
                          File management correctness
                        </Label>
                        <Switch
                          id="file-management-correctness"
                          checked={fileMgmtCorrectness}
                          onCheckedChange={(checked) => setFileMgmtCorrectness(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="db-management-correctness" className="font-normal">
                          Database management correctness
                        </Label>
                        <Switch
                          id="db-management-correctness"
                          checked={dbMgmtCorrectness}
                          onCheckedChange={(checked) => setDBMgmtCorrectness(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="guardrail-active" className="font-normal">
                          Guardrails
                        </Label>
                        <Switch
                          id="guardrail-active"
                          checked={guardrailActive}
                          onCheckedChange={(checked) => setGuardrailActive(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="monitor-active" className="font-normal">
                          Monitoring
                        </Label>
                        <Switch
                          id="monitor-active"
                          checked={monitorActive}
                          onCheckedChange={(checked) => setMonitorActive(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="eval-active" className="font-normal">
                          Evaluation
                        </Label>
                        <Switch
                          id="eval-active"
                          checked={evalActive}
                          onCheckedChange={(checked) => setEvalActive(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <Separator className="bg-[var(--gray2)] -mt-5"/>
        </TabsContent>
    )
}
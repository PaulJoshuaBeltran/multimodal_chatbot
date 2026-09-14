import { TabsContent } from "../ui/tabs";
import { MonitorEvalTabProps } from "../../types/settings"
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function MonitorEvalTab({ 
    checkAIResponseMonitorEval,
    checkQualityTrends,
    checkLatency,
    checkCost,
    checkModelDataDrift,
    checkUserFeedback,
    checkAccuracy,
    checkHallucinationRate,
    checkRegression,
    setCheckAIResponseMonitorEval,
    setCheckQualityTrends,
    setCheckLatency,
    setCheckCost,
    setCheckModelDataDrift,
    setCheckUserFeedback,
    setCheckAccuracy,
    setCheckHallucinationRate,
    setCheckRegression
}: MonitorEvalTabProps
){
    return (
        <TabsContent value="monitor_eval" className="flex flex-col gap-4 px-1 pr-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="check-response-monitor-eval">Check assistant response:</Label>
              <Select value={checkAIResponseMonitorEval} onValueChange={setCheckAIResponseMonitorEval}>
                <SelectTrigger
                    id="check-response-monitor-eval" className="w-33"
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
            <Separator className="bg-[var(--gray2)] -mb-3"/>
            <div className="flex flex-col -translate-y-1.25">
              <Accordion type="multiple" className="w-full">
                {/* Monitoring */}
                <AccordionItem value="monitoring">
                  <AccordionTrigger>
                    Monitoring
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="checkQualityTrends" className="font-normal">
                          Quality trends
                        </Label>
                        <Switch
                          id="checkQualityTrends"
                          checked={checkQualityTrends}
                          onCheckedChange={(checked) => setCheckQualityTrends(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="checkLatency" className="font-normal">
                          Latency
                        </Label>
                        <Switch
                          id="checkLatency"
                          checked={checkLatency}
                          onCheckedChange={(checked) => setCheckLatency(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="checkCost" className="font-normal">
                          Cost
                        </Label>
                        <Switch
                          id="checkCost"
                          checked={checkCost}
                          onCheckedChange={(checked) => setCheckCost(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="checkModelDataDrift" className="font-normal">
                          Model/data drift
                        </Label>
                        <Switch
                          id="checkModelDataDrift"
                          checked={checkModelDataDrift}
                          onCheckedChange={(checked) => setCheckModelDataDrift(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="checkUserFeedback" className="font-normal">
                          User feedback
                        </Label>
                        <Switch
                          id="checkSensitivecheckUserFeedbackContent"
                          checked={checkUserFeedback}
                          onCheckedChange={(checked) => setCheckUserFeedback(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Evaluation */}
                <AccordionItem value="evaluation">
                  <AccordionTrigger>
                    Evaluation
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="checkAccuracy" className="font-normal">
                          Accuracy
                        </Label>
                        <Switch
                          id="checkAccuracy"
                          checked={checkAccuracy}
                          onCheckedChange={(checked) => setCheckAccuracy(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="checkHallucinationRate" className="font-normal">
                          Hallucination rate
                        </Label>
                        <Switch
                          id="checkHallucinationRate"
                          checked={checkHallucinationRate}
                          onCheckedChange={(checked) => setCheckHallucinationRate(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="checkRegression" className="font-normal">
                          Regression
                        </Label>
                        <Switch
                          id="checkRegression"
                          checked={checkRegression}
                          onCheckedChange={(checked) => setCheckRegression(checked === true)}
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
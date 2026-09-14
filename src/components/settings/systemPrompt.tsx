import { TabsContent } from "../ui/tabs";
import { SystemPromptTabProps } from "../../types/settings"
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { NumericUpDown } from "../ui/numeric-updown";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

export function SystemPromptTab({ 
    systemPrompt,
    numCtx,
    maxReplyTokens,
    thinkingQuality,
    temperature,
    topP,
    topK,
    setSystemPrompt,
    setNumCtx,
    setMaxReplyTokens,
    setTemperature,
    setTopP,
    setTopK
}: SystemPromptTabProps
){
    const NUM_CTX_OPTIONS = [2048, 4096, 8192, 16384, 32768, 65536, 131072] as const
    function formatCtx(n: number) {
        return n >= 1024 ? `${n / 1024}k` : `${n}`
    }

    return (
        <TabsContent value="system_prompt" className="flex flex-col gap-4 px-1">
            <ScrollArea type="auto" className="min-h-[360px] max-h-[450px] pr-5">
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
                <Separator className="bg-[var(--gray2)] -mb-3"/>
                <div className="flex flex-col">
                  {/* Context length — separate from the collapsible accordion since it
                  affects VRAM at load time, not just generation behaviour */}
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="context-window">
                      <AccordionTrigger>
                        Context Window
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-3 px-1">
                          <div className="flex items-center justify-between">
                            <Label className="w-82.5 shrink-0">Context length:</Label>
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
                          <div className="flex items-center justify-between">
                            <Label className="w-82.5 shrink-0">Max reply tokens:</Label>
                            <NumericUpDown
                              className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                              value={numCtx}
                              min={64}
                              max={maxReplyTokens}
                              step={64}
                              onValueChange={setMaxReplyTokens}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="more-prompt-settings">
                      <AccordionTrigger>
                        More Settings (Think {thinkingQuality})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center">
                            <Label className="w-82.5 shrink-0">Temperature ({temperature}):</Label>
                            <NumericUpDown
                              className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                              value={temperature}
                              min={0}
                              max={2}
                              step={0.1}
                              onValueChange={setTemperature}
                            />
                          </div>
                          <div className="flex items-center">
                            <Label className="w-82.5 shrink-0">Top-P ({topP}):</Label>
                            <NumericUpDown
                              className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                              value={topP}
                              min={0}
                              max={1}
                              step={0.1}
                              onValueChange={setTopP}
                            />
                          </div>
                          <div className="flex items-center">
                            <Label className="w-82.5 shrink-0">Top-K:</Label>
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
                <Separator className="bg-[var(--gray2)] -mt-3"/>
              </div>
            </ScrollArea>
        </TabsContent>
    )
}
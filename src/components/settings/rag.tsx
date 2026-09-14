import { TabsContent } from "../ui/tabs";
import { RAGTabProps } from "../../types/settings"
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { NumericUpDown } from "../ui/numeric-updown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Switch } from "../ui/switch";

export function RAGTab({ 
    similaritySearchModel,
    similaritySearchTopK,
    rerankActive,
    rerankModel,
    rerankTopK,
    setSimilaritySearchTopK,
    setRerankActive,
    setRerankTopK
}: RAGTabProps
){
    return (
        <TabsContent value="rag" className="flex flex-col gap-4 px-1 pr-5">
            <Separator className="bg-[var(--gray2)] -mb-3"/>
            <div className="flex flex-col ">
              <Accordion type="multiple" className="w-full -translate-y-1.25">
                <AccordionItem value="similarity-search-settings">
                  <AccordionTrigger>
                    Similarity Search
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <Label className="w-full shrink-0">Model: {similaritySearchModel}</Label>
                      <div className="flex items-center">
                        <Label className="w-82.5 shrink-0">TopK:</Label>
                        <NumericUpDown
                          className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
                          value={similaritySearchTopK}
                          min={0}
                          step={1}
                          onValueChange={setSimilaritySearchTopK}
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="rerank-active" className="font-normal">
                          Active
                        </Label>
                        <Switch
                          id="rerank-active"
                          checked={rerankActive}
                          onCheckedChange={(checked) => setRerankActive(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <Label className="w-full shrink-0">Model: {rerankModel}</Label>
                      <div className="flex items-center">
                        <Label className="w-82.5 shrink-0">TopK:</Label>
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
            <Separator className="bg-[var(--gray2)] -mt-5"/>
        </TabsContent>
    )
}
import { TabsContent } from "../ui/tabs";
import { ToolcallTabProps } from "../../types/settings"
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function ToolcallTab({ 
    dbReadAccess,
    dbWriteAccess,
    dbAskPermission,
    fileReadAccess,
    fileWriteAccess,
    fileAskPermission,
    setDbReadAccess,
    setDbWriteAccess,
    setDbAskPermission,
    setFileReadAccess,
    setFileWriteAccess,
    setFileAskPermission
}: ToolcallTabProps
){
    return (
        <TabsContent value="toolcall" className="flex flex-col gap-4 px-1 pr-5">
            <Separator className="bg-[var(--gray2)] -mb-3"/>
            <div className="flex flex-col -translate-y-1.25">
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="database-management-settings">
                  <AccordionTrigger>
                    Database Management
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="read-db-access" className="font-normal">
                          Read Access
                        </Label>
                        <Switch
                          id="read-db-access"
                          checked={dbReadAccess}
                          onCheckedChange={(checked) => setDbReadAccess(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="write-db-access" className="font-normal">
                          Write Access
                        </Label>
                        <Switch
                          id="write-db-access"
                          checked={dbWriteAccess}
                          onCheckedChange={(checked) => setDbWriteAccess(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center">
                        <Label  className="w-82.5 shrink-0" htmlFor="db-ask-permission">Ask Permission</Label>
                        <Select value={dbAskPermission} onValueChange={setDbAskPermission}>
                          <SelectTrigger
                              id="db-ask-permission" className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="read-file-access" className="font-normal">
                          Read Access
                        </Label>
                        <Switch
                          id="read-file-access"
                          checked={fileReadAccess}
                          onCheckedChange={(checked) => setFileReadAccess(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="write-file-access" className="font-normal">
                          Write Access
                        </Label>
                        <Switch
                          id="write-file-access"
                          checked={fileWriteAccess}
                          onCheckedChange={(checked) => setFileWriteAccess(checked === true)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        />
                      </div>
                      <div className="flex items-center">
                        <Label className="w-82.5 shrink-0" htmlFor="file-ask-permission">Ask Permission</Label>
                        <Select value={fileAskPermission} onValueChange={setFileAskPermission}>
                          <SelectTrigger
                              id="file-ask-permission" className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
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
            <Separator className="bg-[var(--gray2)] -mt-5"/>
        </TabsContent>
    )
}
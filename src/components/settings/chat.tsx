import { TabsContent } from "../ui/tabs";
import { ChatTabProps } from "../../types/settings"
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { NumericUpDown } from "../ui/numeric-updown";

export function ChatTab({ 
    fontSize,
    density,
    showTimestamps,
    markdownRendering,
    setFontSize,
    setDensity,
    setShowTimestamps,
    setMarkdownRendering
}: ChatTabProps
){
    return (
        <TabsContent value="chat" className="flex flex-col gap-4 px-1 pr-5">
            <div className="flex items-center mt-2">
              <Label className="w-82.5 shrink-0">Font size</Label>
              <NumericUpDown
                className="flex-1 bg-[var(--gray3)] border-white hover:bg-[var(--gray2)]"
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
                    className="w-33"
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
            <Separator className="bg-[var(--gray2)]"/>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-timestamps" className="font-normal">
                Show message timestamps
              </Label>
              <Switch
                id="show-timestamps"
                checked={showTimestamps}
                onCheckedChange={(checked) => setShowTimestamps(checked === true)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="markdown-rendering" className="font-normal">
                Render Markdown &amp; code blocks
              </Label>
              <Switch
                id="markdown-rendering"
                checked={markdownRendering}
                onCheckedChange={(checked) => setMarkdownRendering(checked === true)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              />
            </div>
        </TabsContent>
    )
}
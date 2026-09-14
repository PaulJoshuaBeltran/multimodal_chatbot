import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { TabsContent } from "../ui/tabs";
import { GeneralTabProps } from "../../types/settings"


export function GeneralTab({ 
    theme,
    language,
    sendOnEnter,
    soundEnabled,
    setTheme,
    setLanguage,
    setSendOnEnter,
    setSoundEnabled
}: GeneralTabProps
){
    return (
        <TabsContent value="general" className="flex flex-col gap-4 px-1 pr-5">
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
            <Separator className="bg-[var(--gray2)]"/>
            <div className="flex items-center justify-between">
              <Label htmlFor="send-on-enter" className="font-normal">
                Send message on Enter
              </Label>
              <Switch
                id="send-on-enter"
                checked={sendOnEnter}
                onCheckedChange={(checked) => setSendOnEnter(checked === true)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-enabled" className="font-normal">
                Play sound on new message
              </Label>
              <Switch
                id="sound-enabled"
                checked={soundEnabled}
                onCheckedChange={(checked) => setSoundEnabled(checked === true)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              />
            </div>
        </TabsContent>
    )
}
import { TabsContent } from "../ui/tabs";
import { SubscriptionTabProps } from "../../types/settings"
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "../ui/button";


export function SubscriptionTab({ 
    isSubscribing,
    handleSubscribeClick
}: SubscriptionTabProps
){
    const PLUS_PERKS = [
        'Access to larger, more capable models',
        'Longer conversation memory',
        'Priority response speed',
        'Early access to new features',
    ]
      
    return (
        <TabsContent value="subscription" className="flex flex-col gap-3 px-1 pr-5">
            <div
              className="flex flex-col gap-3 rounded-lg border p-4"
              style={{ backgroundColor: 'var(--gray2)' }}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-4 h-4" />
                Upgrade to Plus
              </div>

              <ul className="flex flex-col gap-1.5">
                {PLUS_PERKS.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>

              <Button
                className="w-fit"
                disabled={isSubscribing}
                onClick={handleSubscribeClick}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  'Subscribe to Plus'
                )}
              </Button>
            </div>
        </TabsContent>
    )
}
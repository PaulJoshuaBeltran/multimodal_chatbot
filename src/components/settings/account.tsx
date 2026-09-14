import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { TabsContent } from "../ui/tabs";
import { AccountTabProps } from "../../types/settings"

export function AccountTab({ username, email }: AccountTabProps
){
    return (
        <TabsContent value="account" className="flex flex-col gap-4 px-1 pr-5">
            <div className="flex items-center justify-between mt-2">
              <Label>Username</Label>
              <Label>{username}</Label>
            </div>
            <Separator className="bg-[var(--gray2)]"/>
            <div className="flex items-center justify-between">
              <Label>Email</Label>
              <Label>{email}</Label>
            </div>
            <Separator className="bg-[var(--gray2)]"/>
            <div className="flex items-center justify-between">
              <Label>Deactive account</Label>
              <Button
                className="w-fit bg-[var(--red2)]"
                // disabled={isSubscribing}
                // onClick={handleSubscribeClick}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--red1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >Deactivate account</Button>
            </div>
            <Separator className="bg-[var(--gray2)]"/>
            <div className="flex items-center justify-between">
              <p></p>
              <Button
                className="w-fit bg-[var(--gray2)]"
                // disabled={isSubscribing}
                // onClick={handleSubscribeClick}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >Sign-out</Button>
            </div>
        </TabsContent>
    )
}
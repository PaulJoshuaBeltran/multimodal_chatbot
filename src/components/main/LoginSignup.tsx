import { LoginSignupProps } from "@/src/types/props";
import { Bot } from "lucide-react";
import { Button } from "../ui/button";
import { AuthDialog } from "../dialogs/OtherDialogs";

export function LoginSignup({
    authDialogOpen,
    authDialogMode,
    setAuthDialogOpen,
    setAuthDialogMode,
    handleLogin
}: LoginSignupProps) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm px-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
                    <Bot className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sign in to start chatting with your AI assistant.
                    </p>
                </div>
                <div className="flex gap-3 w-full">
                <Button
                    className="flex-1"
                    onClick={() => { setAuthDialogMode('login'); setAuthDialogOpen(true) }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                    Sign in
                </Button>
                <Button
                    className="flex-1"
                    onClick={() => { setAuthDialogMode('signup'); setAuthDialogOpen(true) }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                    Create account
                </Button>
                </div>
            </div>
            <AuthDialog
                open={authDialogOpen}
                mode={authDialogMode}
                onOpenChange={setAuthDialogOpen}
                onLogin={handleLogin}
            />
        </div>
    )
}
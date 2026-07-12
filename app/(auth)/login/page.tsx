"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending} className="w-full">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, null);
  return (
    <div className="min-h-dvh grid place-items-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-[46px] h-[46px] rounded-[13px] bg-dark-panel flex items-center justify-center rotate-45 mb-4">
            <div className="w-[16px] h-[16px] bg-amber rounded-[3px]" />
          </div>
          <h1 className="font-serif text-[36px] leading-none">Vault</h1>
          <div className="font-mono text-[9.5px] tracking-[0.2em] text-muted-foreground mt-2">FINANCE OS</div>
          <p className="text-[13px] text-muted-foreground mt-4">Sign in to your personal books</p>
        </div>

        <div className="bg-card border border-border-soft rounded-lg p-6">
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email" className="eyebrow">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password" className="eyebrow">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-2"
              />
            </div>
            {state?.error && <p className="text-[13px] text-expense">{state.error}</p>}
            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, null);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto size-10 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">V</div>
          <div>
            <h1 className="text-xl font-semibold">Vault</h1>
            <p className="text-sm text-muted-foreground">Sign in to your finance OS</p>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

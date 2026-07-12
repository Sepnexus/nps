import { KeyRound, User, Lock, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { requireUser } from "@/lib/auth";
import { DEFAULT_CHAT_MODEL, DEFAULT_VISION_MODEL } from "@/lib/ai";
import { changePassword, saveAISettings, saveProfile } from "./actions";

const MODELS = [
  { id: "gpt-5", label: "gpt-5 (best, multimodal)" },
  { id: "gpt-5-mini", label: "gpt-5-mini (fast, cheap)" },
  { id: "gpt-5-nano", label: "gpt-5-nano (cheapest)" },
  { id: "gpt-4o", label: "gpt-4o (legacy)" },
];

function maskKey(key: string | null): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return "•".repeat(key.length - 4) + key.slice(-4);
}

export default async function SettingsPage() {
  const user = await requireUser();
  const currentKeyPreview = maskKey(user.openaiApiKey);
  const envHasKey = !!process.env.OPENAI_API_KEY;

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Profile, security, and the AI provider that powers receipts and the assistant."
      />

      <div className="space-y-5">
        {/* Profile */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-[14px] font-semibold">Profile</h2>
          </div>
          <form action={saveProfile} className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="eyebrow">Display name</Label>
              <Input id="displayName" name="displayName" defaultValue={user.displayName ?? ""} className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="eyebrow">Email</Label>
                <Input value={user.email} disabled className="mt-2 bg-secondary/40" />
              </div>
              <div>
                <Label htmlFor="timezone" className="eyebrow">Timezone</Label>
                <Input id="timezone" name="timezone" defaultValue={user.timezone ?? "Asia/Kolkata"} className="mt-2" />
              </div>
            </div>
            <Button type="submit" variant="primary">Save profile</Button>
          </form>
        </Card>

        {/* AI */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-primary" />
            <h2 className="text-[14px] font-semibold">AI provider</h2>
          </div>
          <form action={saveAISettings} className="space-y-4">
            <div>
              <Label htmlFor="openaiApiKey" className="eyebrow flex items-center gap-2">
                <KeyRound className="w-3 h-3" /> OpenAI API key
              </Label>
              <Input
                id="openaiApiKey"
                name="openaiApiKey"
                type="password"
                placeholder={
                  user.openaiApiKey
                    ? currentKeyPreview
                    : envHasKey
                      ? "using env OPENAI_API_KEY — paste to override"
                      : "sk-..."
                }
                className="mt-2 font-mono"
                autoComplete="off"
              />
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                Stored encrypted in the database. Leave blank to keep the current key.{" "}
                {envHasKey && !user.openaiApiKey && "The container has a key in its environment; you can override it here per-user."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="openaiModel" className="eyebrow">Chat model</Label>
                <Select
                  id="openaiModel"
                  name="openaiModel"
                  defaultValue={user.openaiModel ?? DEFAULT_CHAT_MODEL}
                  className="mt-2"
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="openaiVisionModel" className="eyebrow">Receipt / vision model</Label>
                <Select
                  id="openaiVisionModel"
                  name="openaiVisionModel"
                  defaultValue={user.openaiVisionModel ?? DEFAULT_VISION_MODEL}
                  className="mt-2"
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary">Save AI settings</Button>
              <Button
                type="button"
                variant="outline"
                formAction="/api/settings/test"
                formMethod="post"
              >
                Test connection
              </Button>
            </div>
          </form>
        </Card>

        {/* Password */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="text-[14px] font-semibold">Change password</h2>
          </div>
          <form action={changePassword} className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="eyebrow">New password (min 8 chars)</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                minLength={8}
                required
                className="mt-2"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="primary">Update password</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

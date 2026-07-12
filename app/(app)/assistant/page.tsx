import { Bot } from "lucide-react";
import { Card, PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { Chat } from "./chat";

export default async function AssistantPage() {
  const u = await requireUser();
  const aiKeyMissing = !u.openaiApiKey && !process.env.OPENAI_API_KEY;

  return (
    <div className="max-w-[820px]">
      <PageHeader
        eyebrow="Ask Vault"
        title="AI Assistant"
        subtitle="Grounded on your accounts, transactions, loans, investments, and goals."
      />

      <Card className="p-6">
        {aiKeyMissing ? (
          <div className="rounded-[10px] border border-[hsl(var(--accent-terra))] bg-[rgba(180,85,47,0.08)] p-4 text-[13px]">
            <strong>OpenAI API key not set.</strong> Add one in <a className="underline" href="/settings">Settings</a> to enable the assistant.
          </div>
        ) : (
          <Chat />
        )}
      </Card>
    </div>
  );
}

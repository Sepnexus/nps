import { Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chat } from "./chat";

export default function AssistantPage() {
  const aiKeyMissing = !process.env.OPENAI_API_KEY;
  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold text-foreground">AI Assistant</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {aiKeyMissing ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <strong>OPENAI_API_KEY is not set.</strong> Add it to <code>.env.local</code> to enable the assistant.
            </div>
          ) : (
            <Chat />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

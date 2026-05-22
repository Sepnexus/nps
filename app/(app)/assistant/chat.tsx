"use client";

import { Bot, Loader2, Send, User } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUGGESTIONS = [
  "Where am I leaking money this month?",
  "Should I prepay my smaller EMI or invest the surplus?",
  "Am I on track for ₹3Cr FI in 12 years?",
  "What's my realistic SIP capacity?",
];

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(content: string) {
    if (!content.trim() || loading) return;
    setError(null);
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setMsgs([...next, { role: "assistant", content: json.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3 min-h-[40vh]">
        {msgs.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Try one of these or type your own:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border bg-secondary/40 px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className="flex gap-3">
            <div className="size-7 shrink-0 rounded-full bg-secondary grid place-items-center">
              {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5 text-primary" />}
            </div>
            <div className="flex-1 text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin" /> Thinking…
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your finances…"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

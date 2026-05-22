import { PiggyBank } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function IncomePage() {
  return (
    <EmptyState
      icon={PiggyBank}
      title="Set up your income sources"
      description="Add each stream — salary, weekly client income, side projects — with reliability and frequency. Helps the AI tell you what's safe to plan around vs. what's variable."
      action={<Button>Add source</Button>}
    />
  );
}

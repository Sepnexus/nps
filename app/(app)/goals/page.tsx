import { Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { goalMonthlyRequired } from "@/lib/finance";
import { listGoals } from "@/lib/queries";
import { formatMoney } from "@/lib/utils";
import { createGoal, deleteGoal } from "./actions";

function monthsUntil(date: string | null) {
  if (!date) return null;
  const now = new Date();
  const target = new Date(date);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

export default async function GoalsPage() {
  const list = await listGoals();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] max-w-6xl">
      <div className="space-y-4">
        {list.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No goals yet. Add your first — emergency fund, FI corpus, vacation, etc.
            </CardContent>
          </Card>
        ) : (
          list.map((g) => {
            const cur = Number(g.currentAmount);
            const tgt = Number(g.targetAmount);
            const pct = tgt ? Math.min(100, (cur / tgt) * 100) : 0;
            const months = monthsUntil(g.targetDate);
            const need = months !== null ? goalMonthlyRequired(cur, tgt, months) : null;
            return (
              <Card key={g.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="size-4 text-primary" />
                      <CardTitle className="text-base font-semibold text-foreground">{g.name}</CardTitle>
                    </div>
                    <form action={deleteGoal}>
                      <input type="hidden" name="id" value={g.id} />
                      <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </form>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="tabular">
                      {formatMoney(cur)} of {formatMoney(tgt)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-2">
                    <Field label="Completion" value={`${pct.toFixed(1)}%`} />
                    <Field label="Months to go" value={months !== null ? String(months) : "—"} />
                    <Field
                      label="Monthly needed"
                      value={need !== null ? formatMoney(need) : g.monthlyContribution ? `${formatMoney(Number(g.monthlyContribution))} planned` : "—"}
                    />
                    <Field label="Priority" value={`P${g.priority}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Add goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGoal} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Emergency fund, FI, House" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetAmount">Target (₹)</Label>
              <Input id="targetAmount" name="targetAmount" type="number" step="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentAmount">Current saved (₹)</Label>
              <Input id="currentAmount" name="currentAmount" type="number" step="0.01" defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetDate">Target date</Label>
              <Input id="targetDate" name="targetDate" type="date" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="monthlyContribution">Planned monthly</Label>
                <Input id="monthlyContribution" name="monthlyContribution" type="number" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <Select id="priority" name="priority" defaultValue="3">
                  <option value="1">P1 (highest)</option>
                  <option value="2">P2</option>
                  <option value="3">P3</option>
                  <option value="4">P4</option>
                  <option value="5">P5</option>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full">Add</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="tabular font-medium">{value}</div>
    </div>
  );
}

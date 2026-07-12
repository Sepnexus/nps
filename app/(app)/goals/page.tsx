import { Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
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
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <PageHeader eyebrow="Planning" title="Goals" />

        {list.length === 0 ? (
          <Card className="p-8 text-center text-[13px] text-muted-foreground">
            No goals yet. Add your first — emergency fund, FI corpus, vacation, etc.
          </Card>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
            {list.map((g) => {
              const cur = Number(g.currentAmount);
              const tgt = Number(g.targetAmount);
              const pct = tgt ? Math.min(100, (cur / tgt) * 100) : 0;
              const months = monthsUntil(g.targetDate);
              const need = months !== null ? goalMonthlyRequired(cur, tgt, months) : null;
              return (
                <Card key={g.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="chip-goal w-[34px] h-[34px] rounded-[10px] flex items-center justify-center">
                        <Target className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] font-semibold">{g.name}</span>
                    </div>
                    <form action={deleteGoal}>
                      <input type="hidden" name="id" value={g.id} />
                      <button
                        type="submit"
                        aria-label="Delete"
                        className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-expense opacity-50 hover:opacity-100 hover:bg-[rgba(199,86,59,0.08)] transition"
                      >
                        <Trash2 className="w-[14px] h-[14px]" />
                      </button>
                    </form>
                  </div>
                  <div className="mt-4 flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="tnum">
                      {formatMoney(cur, { compact: true })} / {formatMoney(tgt, { compact: true })}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-[6px] bg-secondary overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3.5 grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))" }}>
                    <F label="Complete" value={`${pct.toFixed(1)}%`} />
                    <F label="Months left" value={months !== null ? String(months) : "—"} />
                    <F label="Monthly need" value={need !== null ? formatMoney(need, { compact: true }) : "—"} />
                    <F label="Priority" value={`P${g.priority}`} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-4 p-5">
        <h2 className="text-[14px] font-semibold mb-4">Add goal</h2>
        <form action={createGoal} className="space-y-3">
          <div>
            <Label htmlFor="name" className="eyebrow">Name</Label>
            <Input id="name" name="name" required placeholder="Emergency fund, FI, House" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="targetAmount" className="eyebrow">Target ₹</Label>
            <Input id="targetAmount" name="targetAmount" type="number" step="0.01" required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="currentAmount" className="eyebrow">Currently saved ₹</Label>
            <Input id="currentAmount" name="currentAmount" type="number" step="0.01" defaultValue="0" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="targetDate" className="eyebrow">Target date</Label>
            <Input id="targetDate" name="targetDate" type="date" className="mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="monthlyContribution" className="eyebrow">Planned/mo</Label>
              <Input id="monthlyContribution" name="monthlyContribution" type="number" step="0.01" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="priority" className="eyebrow">Priority</Label>
              <Select id="priority" name="priority" defaultValue="3" className="mt-2">
                <option value="1">P1</option>
                <option value="2">P2</option>
                <option value="3">P3</option>
                <option value="4">P4</option>
                <option value="5">P5</option>
              </Select>
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full">Add</Button>
        </form>
      </Card>
    </div>
  );
}

function F({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="tnum text-[13.5px] font-semibold mt-0.5">{value}</div>
    </div>
  );
}

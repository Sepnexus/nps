import { Briefcase, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listEntities } from "@/lib/queries";
import { createEntity, deleteEntity } from "./actions";

export default async function EntitiesPage() {
  const list = await listEntities();
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] max-w-6xl">
      <div className="space-y-4">
        {list.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No entities yet. Create one on the right — start with "Personal" and your registered company.
            </CardContent>
          </Card>
        ) : (
          list.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {e.kind === "company" ? (
                      <Briefcase className="size-4 text-primary" />
                    ) : (
                      <User className="size-4 text-primary" />
                    )}
                    <CardTitle className="text-base font-semibold text-foreground">{e.name}</CardTitle>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{e.kind}</span>
                  </div>
                  <form action={deleteEntity}>
                    <input type="hidden" name="id" value={e.id} />
                    <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-3 text-sm">
                <Field label="Legal name" value={e.legalName ?? "—"} />
                <Field label="GSTIN" value={e.gstin ?? "—"} />
                <Field label="PAN" value={e.pan ?? "—"} />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Add entity</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEntity} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Personal / Acme Pvt Ltd" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kind">Type</Label>
              <Select id="kind" name="kind" defaultValue="personal">
                <option value="personal">Personal</option>
                <option value="company">Company</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="legalName">Legal name (optional)</Label>
              <Input id="legalName" name="legalName" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" name="gstin" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pan">PAN</Label>
                <Input id="pan" name="pan" />
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
      <div className="font-medium">{value}</div>
    </div>
  );
}

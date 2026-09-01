import { ListWithCount } from "@/types";
import { ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ListsGrid({ lists }: { lists: ListWithCount[] }) {
  if (lists.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <ListChecks className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No lists yet. Create your first list to organize contacts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lists.map((list) => (
        <Card key={list.id} className="transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ListChecks className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="mt-4 font-semibold">{list.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {list.description || "No description"}
            </p>
            <div className="mt-4 flex gap-4 border-t pt-4 text-sm">
              <div>
                <p className="font-medium">
                  {list._count.contactLists}
                </p>
                <p className="text-muted-foreground">contacts</p>
              </div>
              <div>
                <p className="font-medium">{list._count.campaigns}</p>
                <p className="text-muted-foreground">campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

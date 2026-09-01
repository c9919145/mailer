"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Mail, Pencil, Trash2, Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateWithCount } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TemplatesGrid({
  templates,
}: {
  templates: TemplateWithCount[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<TemplateWithCount | null>(null);

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No templates yet. Create your first email template to get started.
        </p>
        <Button asChild className="mt-4">
          <Link href="/templates/new">Create template</Link>
        </Button>
      </div>
    );
  }

  async function handleDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/templates/${deleting.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleting(null);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/templates/${template.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(template)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <h3 className="mt-4 line-clamp-1 font-semibold">
                {template.name}
              </h3>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {template.subject}
              </p>

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {template.type === "TRANSACTIONAL"
                      ? "Transactional"
                      : "Marketing"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(template.updatedAt, "MMM d")}
                  </span>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/templates/${template.id}/edit`}>
                    <Send className="mr-1 h-3 w-3" />
                    Use
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleting?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

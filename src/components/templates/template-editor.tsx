"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Send, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/templates/rich-text-editor";
import { Template } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function TemplateEditor({
  initialTemplate,
}: {
  initialTemplate?: Template;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialTemplate?.name || "");
  const [subject, setSubject] = useState(initialTemplate?.subject || "");
  const [type, setType] = useState<"TRANSACTIONAL" | "MARKETING">(
    (initialTemplate?.type as "TRANSACTIONAL" | "MARKETING") || "MARKETING"
  );
  const [html, setHtml] = useState(initialTemplate?.htmlContent || "");
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isEdit = !!initialTemplate;

  async function saveTemplate(redirectAfter = false) {
    setSaving(true);
    const url = isEdit ? `/api/templates/${initialTemplate.id}` : "/api/templates";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, type, htmlContent: html }),
    });

    if (res.ok) {
      if (redirectAfter) {
        router.push("/templates");
        router.refresh();
      } else {
        router.refresh();
      }
    } else {
      const data = await res.json();
      alert(data.error || "Failed to save template");
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/templates">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit template" : "New template"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update this email template."
              : "Create an email template to reuse in campaigns and API calls."}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            disabled={!html}
          >
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => saveTemplate(false)}
            disabled={saving || !name || !subject || !html}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
          <Button
            onClick={() => saveTemplate(true)}
            disabled={saving || !name || !subject || !html}
          >
            <Send className="mr-2 h-4 w-4" />
            Save & exit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Template details</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject line *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Welcome to Acme!"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{firstName}}"} for personalization.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) =>
                    setType(v as "TRANSACTIONAL" | "MARKETING")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Available variables</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Insert these placeholders into your content to personalize emails.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "first_name",
                "last_name",
                "full_name",
                "email",
                "company",
                "phone",
              ].map((v) => (
                <code
                  key={v}
                  className="rounded bg-muted px-1.5 py-0.5 text-xs"
                >
                  {"{{"} {v} {"}}"}
                </code>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Email content *</Label>
          <RichTextEditor value={html} onChange={setHtml} />
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Email preview</DialogTitle>
            <DialogDescription>
              Preview of the email as it would appear to a recipient.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-lg border bg-white p-4">
            <h3 className="mb-2 font-semibold">{subject}</h3>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

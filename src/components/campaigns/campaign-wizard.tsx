"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, ArrowRight, Mail, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Template, Domain } from "@prisma/client";

interface ListWithCount {
  id: string;
  name: string;
  description: string | null;
  _count: { contactLists: number };
}

interface CampaignWizardProps {
  templates: Template[];
  lists: ListWithCount[];
  domains: Domain[];
}

const steps = ["Template & list", "Sender", "Review"];

export function CampaignWizard({
  templates,
  lists,
  domains,
}: CampaignWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [listId, setListId] = useState("");
  const [domainId, setDomainId] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const selectedList = lists.find((l) => l.id === listId);
  const selectedDomain = domains.find((d) => d.id === domainId);

  function canNext() {
    if (step === 0) return !!templateId && !!listId && !!name;
    if (step === 1) return !!fromEmail && !!fromName;
    return true;
  }

  async function handleCreate() {
    setSaving(true);
    setError("");

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        templateId,
        listId,
        domainId: domainId || undefined,
        fromEmail,
        fromName,
        replyTo: replyTo || undefined,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to create campaign");
      return;
    }

    router.push(`/campaigns/${data.campaign.id}`);
    router.refresh();
  }

  const domainAddress = selectedDomain
    ? `@${selectedDomain.name.replace(/^\./, "")}`
    : "";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  i === step
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
              {i < steps.length - 1 && (
                <div className="mx-2 hidden h-px w-8 bg-border sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 0 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. September Newsletter"
              />
            </div>

            <div className="space-y-2">
              <Label>Email template *</Label>
              {templates.length === 0 ? (
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No templates yet.
                  </p>
                  <Button asChild variant="link" className="mt-1">
                    <Link href="/templates/new">Create a template</Link>
                  </Button>
                </div>
              ) : (
                <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <span className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {template.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground">
                  Subject: {selectedTemplate.subject}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Recipient list *</Label>
              {lists.length === 0 ? (
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No lists yet.
                  </p>
                  <Button asChild variant="link" className="mt-1">
                    <Link href="/lists">Create a list</Link>
                  </Button>
                </div>
              ) : (
                <Select value={listId} onValueChange={(v) => setListId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        <span className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {list.name}
                          <span className="text-muted-foreground">
                            ({list._count.contactLists})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedList && (
                <p className="text-xs text-muted-foreground">
                  {selectedList._count.contactLists} contacts will receive this
                  email
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="fromName">From name *</Label>
              <Input
                id="fromName"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">From email *</Label>
              <div className="flex gap-2">
                <Input
                  id="fromEmail"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="hello"
                  className="flex-1"
                />
                <Select value={domainId} onValueChange={(v) => setDomainId(v ?? "")}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue
                      placeholder={
                        selectedDomain ? `@${selectedDomain.name}` : "Select domain"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        @{domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!selectedDomain && (
                <p className="text-xs text-muted-foreground">
                  Select a verified domain, or use your email directly.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-to (optional)</Label>
              <Input
                id="replyTo"
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="support@example.com"
              />
            </div>

            {fromEmail && !fromEmail.includes("@") && selectedDomain && (
              <p className="text-xs text-muted-foreground">
                Email will send from {fromEmail}@{selectedDomain.name}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Review your campaign</h3>
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Template</span>
                <span className="text-sm font-medium">
                  {selectedTemplate?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subject</span>
                <span className="text-sm font-medium">
                  {selectedTemplate?.subject}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">List</span>
                <span className="text-sm font-medium">
                  {selectedList?.name}{" "}
                  <span className="text-muted-foreground">
                    ({selectedList?._count.contactLists} contacts)
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-sm font-medium">
                  {fromName} &lt;{fromEmail}
                  {fromEmail.includes("@") ? "" : domainAddress}&gt;
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create campaign
          </Button>
        )}
      </div>
    </div>
  );
}

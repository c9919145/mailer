"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Webhook as WebhookIcon, Plus, Loader2, Trash2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Webhook } from "@prisma/client";

const EVENTS = ["SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "COMPLAINED"];

export function WebhooksClient({ webhooks }: { webhooks: Webhook[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "DELIVERED",
    "OPENED",
    "CLICKED",
    "BOUNCED",
  ]);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, events: selectedEvents }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create webhook");
      return;
    }

    setOpen(false);
    setUrl("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook?")) return;
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create webhook</DialogTitle>
              <DialogDescription>
                We&apos;ll POST notifications to your URL when email events
                occur.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid gap-2">
                  {EVENTS.map((event) => (
                    <div key={event} className="flex items-center gap-2">
                      <Checkbox
                        id={`event-${event}`}
                        checked={selectedEvents.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                      />
                      <Label htmlFor={`event-${event}`} className="text-sm">
                        {event.toLowerCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || selectedEvents.length === 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create webhook
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <WebhookIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No webhooks yet. Create one to receive real-time email event
            notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              onDelete={() => handleDelete(webhook.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WebhookCard({
  webhook,
  onDelete,
}: {
  webhook: Webhook;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const events = webhook.events.split(",");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <WebhookIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-mono text-sm">
              {webhook.url}
            </CardTitle>
            <div className="mt-1 flex flex-wrap gap-1">
              {events.map((event) => (
                <Badge key={event} variant="secondary">
                  {event.toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">
            Signing secret:
          </Label>
          <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
            {webhook.secret}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(webhook.secret);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Plus, Loader2, CheckCircle2, Copy, Trash2 } from "lucide-react";
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
import { Domain } from "@prisma/client";

export function DomainsClient({ domains }: { domains: Domain[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: domainName }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to add domain");
      return;
    }

    setOpen(false);
    setDomainName("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this domain?")) return;
    await fetch(`/api/domains/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a sending domain</DialogTitle>
              <DialogDescription>
                Add the email domain you want to send from (e.g. example.com).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add domain
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {domains.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Globe className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No domains yet. Add a domain to send emails from your own address.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <Card key={domain.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{domain.name}</CardTitle>
                    <div className="mt-0.5">
                      <Badge
                        variant="secondary"
                        className={
                          domain.verified
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      >
                        {domain.verified ? "Verified" : "Pending verification"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(domain.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              {!domain.verified && (
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Add these DNS records to verify ownership of{" "}
                    {domain.name}:
                  </p>
                  <div className="space-y-2">
                    <DnsRecord
                      type="TXT"
                      name={domain.spfRecord || "SPF"}
                      value={domain.spfRecord || ""}
                    />
                    <DnsRecord
                      type="TXT"
                      name={domain.dkimRecord || "DKIM selector"}
                      value={domain.dkimRecord || ""}
                    />
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetch(`/api/domains/${domain.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ verified: true }),
                          }).then(() => router.refresh())
                        }
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark as verified
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DnsRecord({ type, name, value }: { type: string; name: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
      <Badge variant="outline" className="w-12 justify-center">
        {type}
      </Badge>
      <span className="flex-1 truncate text-sm font-mono">{value}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          navigator.clipboard.writeText(value);
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
  );
}

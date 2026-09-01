"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Key,
  Plus,
  Loader2,
  Copy,
  CheckCircle2,
  Trash2,
  User as UserIcon,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
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
import { ApiKeyWithMeta } from "@/types";

interface SettingsClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: Date;
  };
  apiKeys: ApiKeyWithMeta[];
}

const SCOPES = ["SEND", "READ", "MANAGE"];

export function SettingsClient({ user, apiKeys: initialKeys }: SettingsClientProps) {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState(initialKeys);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["SEND"]);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName, scopes: selectedScopes }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setNewKey(data.apiKey.key);
      setOpen(false);
      setKeyName("");
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this API key? Actions using it will stop working."))
      return;
    const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      router.refresh();
    }
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and API access." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={user.name || ""} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email || ""} readOnly className="bg-muted/50" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary">
                <Shield className="mr-1 h-3 w-3" />
                {user.role.toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Member since</span>
              <span className="text-sm font-medium">
                {format(user.createdAt, "MMMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" />
              API keys
            </CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  New key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API key</DialogTitle>
                  <DialogDescription>
                    Use this key to send emails programmatically via the API.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key name</Label>
                    <Input
                      id="keyName"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="e.g. Production app"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scopes</Label>
                    <div className="grid gap-2">
                      {SCOPES.map((scope) => (
                        <div key={scope} className="flex items-center gap-2">
                          <Checkbox
                            id={`scope-${scope}`}
                            checked={selectedScopes.includes(scope)}
                            onCheckedChange={() => toggleScope(scope)}
                          />
                          <Label htmlFor={`scope-${scope}`} className="text-sm">
                            {scope.toLowerCase()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || selectedScopes.length === 0}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create key
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {newKey && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-sm font-medium text-amber-800">
                  Copy your API key now. You won&apos;t be able to see it again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-white px-2 py-1 text-xs">
                    {newKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigator.clipboard.writeText(newKey)
                    }
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {apiKeys.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No API keys yet.
              </p>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {key.scopes.split(",").map((scope) => (
                          <Badge key={scope} variant="secondary">
                            {scope.toLowerCase()}
                          </Badge>
                        ))}
                        {!key.active && (
                          <Badge variant="outline">inactive</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created {format(key.createdAt, "MMM d, yyyy")}
                        {key.lastUsed
                          ? ` · last used ${format(key.lastUsed, "MMM d")}`
                          : " · never used"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(key.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Using the API</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Send emails programmatically with your API key:
          </p>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
{`curl -X POST https://your-app.com/api/send \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "from": { "email": "hello@yourdomain.com", "name": "Your Name" },
    "to": [{ "email": "recipient@example.com" }],
    "subject": "Hello from Mailer!",
    "html": "<p>Hello <strong>{{firstName}}</strong>!</p>",
    "text": "Hello {{firstName}}!"
  }'`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

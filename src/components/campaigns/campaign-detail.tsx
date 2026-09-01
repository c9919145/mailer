"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Eye,
  MousePointerClick,
  Mail as MailIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignStatusBadge } from "@/components/dashboard/campaign-status-badge";
import { Email, Campaign, Template, List, Domain } from "@prisma/client";

interface CampaignDetailProps {
  campaign: Campaign & {
    template: Template | null;
    list: List | null;
    domain: Domain | null;
  };
  stats: Record<string, number>;
  recentEmails: Email[];
}

export function CampaignDetail({
  campaign,
  stats,
  recentEmails,
}: CampaignDetailProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const isSending = campaign.status === "SENDING" || sending;

  async function handleSend() {
    if (!confirm(`Send this campaign to ${campaign.totalCount || "the"} recipients?`)) {
      return;
    }

    setSending(true);
    setError("");

    const res = await fetch(`/api/campaigns/${campaign.id}/send`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to send campaign");
      setSending(false);
      return;
    }

    setSent(true);
    setSending(false);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/campaigns">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {campaign.name}
            </h1>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaign.template?.name}{" "}
            {campaign.list ? `to ${campaign.list.name}` : ""}
          </p>
        </div>
        {(campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && (
          <Button onClick={handleSend} disabled={isSending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSending && !sending ? "Sending..." : "Send now"}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {sent && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Campaign queued and sending!
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MailIcon className="h-4 w-4" />
              <span className="text-sm">Total</span>
            </div>
            <p className="mt-2 text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-blue-500">
              <Eye className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Opened</span>
            </div>
            <p className="mt-2 text-3xl font-bold">{stats["OPENED"] || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-purple-500">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Clicked</span>
            </div>
            <p className="mt-2 text-3xl font-bold">{stats["CLICKED"] || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Bounced</span>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {(stats["BOUNCED"] || 0) + (stats["FAILED"] || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Campaign details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Template</span>
              <span className="text-sm font-medium">
                {campaign.template?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subject</span>
              <span className="text-sm font-medium">
                {campaign.template?.subject}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="text-sm font-medium">
                {campaign.fromName} &lt;{campaign.fromEmail}&gt;
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium">
                {format(campaign.createdAt, "MMM d, yyyy")}
              </span>
            </div>
            {campaign.sentAt && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sent</span>
                <span className="text-sm font-medium">
                  {format(campaign.sentAt, "MMM d, yyyy HH:mm")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent emails</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEmails.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No emails sent yet for this campaign.
              </p>
            ) : (
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="text-sm">
                          {email.toEmail}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              email.status === "DELIVERED" ||
                              email.status === "SENT" ||
                              email.status === "OPENED" ||
                              email.status === "CLICKED"
                                ? "bg-emerald-100 text-emerald-700"
                                : email.status === "BOUNCED" ||
                                  email.status === "FAILED"
                                ? "bg-red-100 text-red-700"
                                : ""
                            }
                          >
                            {email.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {email.sentAt
                            ? format(email.sentAt, "MMM d HH:mm")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

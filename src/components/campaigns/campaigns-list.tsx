"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignStatusBadge } from "@/components/dashboard/campaign-status-badge";
import { CampaignListItem } from "@/types";

export function CampaignsList({
  campaigns,
}: {
  campaigns: CampaignListItem[];
}) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <Send className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No campaigns yet. Create your first campaign to start sending emails.
        </p>
        <Button asChild className="mt-4">
          <Link href="/campaigns/new">Create campaign</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>List</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell>
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="font-medium hover:underline"
                >
                  {campaign.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {campaign.template?.name || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {campaign.list?.name || "—"}
              </TableCell>
              <TableCell>{campaign._count.emails}</TableCell>
              <TableCell>
                <CampaignStatusBadge status={campaign.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(campaign.createdAt, "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

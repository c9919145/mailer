import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ListChecks,
  Mail,
  Send,
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { getCurrentUserWithDetails } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { CampaignStatusBadge } from "@/components/dashboard/campaign-status-badge";

export default async function DashboardPage() {
  const user = await getCurrentUserWithDetails();

  if (!user) {
    redirect("/login");
  }

  const [contactCount, listCount, templateCount, campaignCount] =
    await Promise.all([
      prisma.contact.count({ where: { userId: user.id } }),
      prisma.list.count({ where: { userId: user.id } }),
      prisma.template.count({ where: { userId: user.id } }),
      prisma.campaign.count({ where: { userId: user.id } }),
    ]);

  const recentCampaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      template: true,
      _count: {
        select: { emails: true },
      },
    },
  });

  const emailStats = await prisma.email.aggregate({
    where: { userId: user.id },
    _count: true,
  });

  const opened = await prisma.email.count({
    where: { userId: user.id, openedAt: { not: null } },
  });

  const clicked = await prisma.email.count({
    where: { userId: user.id, clickedAt: { not: null } },
  });

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your email program.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New campaign
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Contacts"
          value={contactCount}
          icon={Users}
          href="/contacts"
        />
        <StatCard
          label="Lists"
          value={listCount}
          icon={ListChecks}
          href="/lists"
        />
        <StatCard
          label="Templates"
          value={templateCount}
          icon={Mail}
          href="/templates"
        />
        <StatCard
          label="Campaigns"
          value={campaignCount}
          icon={Send}
          href="/campaigns"
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                Recent campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCampaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Send className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No campaigns yet. Create your first campaign to get started.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/campaigns/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create campaign
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCampaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign._count.emails} recipients
                        </p>
                      </div>
                      <CampaignStatusBadge status={campaign.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total sent</p>
                  <p className="text-2xl font-bold">{emailStats._count}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Opened</p>
                  <p className="text-2xl font-bold">{opened}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Clicked</p>
                  <p className="text-2xl font-bold">{clicked}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

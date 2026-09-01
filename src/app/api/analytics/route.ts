import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Time-series of emails sent per day
  const sentOverTime = await prisma.email.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: since },
    },
    select: {
      createdAt: true,
      status: true,
      openedAt: true,
      clickedAt: true,
    },
  });

  const seriesMap = new Map<string, any>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    seriesMap.set(key, {
      date: key,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
    });
  }

  for (const email of sentOverTime) {
    const key = email.createdAt.toISOString().split("T")[0];
    const entry = seriesMap.get(key);
    if (!entry) continue;
    entry.sent++;
    entry.delivered++;
    if (email.openedAt) entry.opened++;
    if (email.clickedAt) entry.clicked++;
    if (email.status === "BOUNCED") entry.bounced++;
  }

  const series = Array.from(seriesMap.values());

  // Aggregate totals
  const totals = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed: 0,
  };

  for (const email of sentOverTime) {
    totals.sent++;
    if (email.status === "BOUNCED") totals.bounced++;
    if (email.status === "FAILED") totals.failed++;
    if (email.openedAt) totals.opened++;
    if (email.clickedAt) totals.clicked++;
  }

  // Engagement rates
  const openRate = totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0;
  const clickRate = totals.sent > 0 ? (totals.clicked / totals.sent) * 100 : 0;
  const bounceRate =
    totals.sent > 0 ? (totals.bounced / totals.sent) * 100 : 0;

  // Per-campaign performance
  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      template: { select: { name: true } },
    },
  });

  const campaignStats = [];
  for (const campaign of campaigns) {
    const emails = await prisma.email.findMany({
      where: { campaignId: campaign.id },
      select: { openedAt: true, clickedAt: true, status: true },
    });
    const total = emails.length;
    const opened = emails.filter((e) => e.openedAt).length;
    const clicked = emails.filter((e) => e.clickedAt).length;

    campaignStats.push({
      id: campaign.id,
      name: campaign.name,
      templateName: campaign.template?.name ?? "Unknown",
      status: campaign.status,
      total,
      opened,
      clicked,
      openRate: total > 0 ? (opened / total) * 100 : 0,
      clickRate: total > 0 ? (clicked / total) * 100 : 0,
      createdAt: campaign.createdAt,
    });
  }

  return NextResponse.json({
    series,
    totals,
    rates: { openRate, clickRate, bounceRate },
    campaigns: campaignStats,
  });
}

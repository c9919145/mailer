import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CampaignDetail } from "@/components/campaigns/campaign-detail";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: {
      template: true,
      list: true,
      domain: true,
    },
  });

  if (!campaign) notFound();

  const emailStats = await prisma.email.groupBy({
    by: ["status"],
    where: { campaignId: id },
    _count: true,
  });

  const stats = emailStats.reduce(
    (acc, s) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>
  );

  const recentEmails = await prisma.email.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <CampaignDetail
      campaign={campaign}
      stats={stats}
      recentEmails={recentEmails}
    />
  );
}

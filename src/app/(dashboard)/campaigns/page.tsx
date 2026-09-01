import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { CampaignsList } from "@/components/campaigns/campaigns-list";

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { name: true } },
      list: { select: { name: true } },
      _count: { select: { emails: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Create and manage your email campaigns."
        actions={
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New campaign
            </Link>
          </Button>
        }
      />
      <CampaignsList campaigns={campaigns} />
    </div>
  );
}

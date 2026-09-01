import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CampaignWizard } from "@/components/campaigns/campaign-wizard";

export default async function NewCampaignPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [templates, lists, domains] = await Promise.all([
    prisma.template.findMany({ where: { userId: user.id } }),
    prisma.list.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { contactLists: true } },
      },
    }),
    prisma.domain.findMany({ where: { userId: user.id } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/campaigns">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New campaign</h1>
          <p className="text-sm text-muted-foreground">
            Send an email to your audience.
          </p>
        </div>
      </div>
      <CampaignWizard templates={templates} lists={lists} domains={domains} />
    </div>
  );
}

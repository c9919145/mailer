import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { TemplatesGrid } from "@/components/templates/templates-grid";

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { campaigns: true },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Create and manage your email templates."
        actions={
          <Button asChild>
            <Link href="/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New template
            </Link>
          </Button>
        }
      />
      <TemplatesGrid templates={templates} />
    </div>
  );
}

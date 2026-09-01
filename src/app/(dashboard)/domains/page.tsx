import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { DomainsClient } from "@/components/domains/domains-client";

export default async function DomainsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const domains = await prisma.domain.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Domains"
        description="Manage the domains you send emails from."
      />
      <DomainsClient domains={domains} />
    </div>
  );
}

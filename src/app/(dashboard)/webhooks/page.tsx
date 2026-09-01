import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { WebhooksClient } from "@/components/webhooks/webhooks-client";

export default async function WebhooksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const webhooks = await prisma.webhook.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Webhooks"
        description="Receive notifications when email events happen."
      />
      <WebhooksClient webhooks={webhooks} />
    </div>
  );
}

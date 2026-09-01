import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { ListsGrid } from "@/components/lists/lists-grid";
import { CreateListDialog } from "@/components/lists/create-list-dialog";

export default async function ListsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const lists = await prisma.list.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { contactLists: true, campaigns: true },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Lists"
        description="Organize your contacts into segmented lists."
        actions={<CreateListDialog />}
      />
      <ListsGrid lists={lists} />
    </div>
  );
}

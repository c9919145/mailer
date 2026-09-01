import { redirect } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog";
import { ImportContactsDialog } from "@/components/contacts/import-contacts-dialog";

export default async function ContactsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      contactLists: { include: { list: true } },
    },
  });

  const lists = await prisma.list.findMany({
    where: { userId: user.id },
  });

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Manage the people you send emails to."
        actions={
          <>
            <ImportContactsDialog lists={lists} />
            <CreateContactDialog lists={lists} />
          </>
        }
      />
      <ContactsTable contacts={contacts} lists={lists} />
    </div>
  );
}

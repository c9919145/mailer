import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TemplateEditor } from "@/components/templates/template-editor";
import { notFound } from "next/navigation";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const template = await prisma.template.findFirst({
    where: { id, userId: user.id },
  });

  if (!template) notFound();

  return (
    <div>
      <TemplateEditor initialTemplate={template} />
    </div>
  );
}

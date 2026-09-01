import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { TemplateEditor } from "@/components/templates/template-editor";

export default async function NewTemplatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <TemplateEditor />
    </div>
  );
}

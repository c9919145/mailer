import { redirect } from "next/navigation";
import { getCurrentUserWithDetails } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUserWithDetails();
  if (!user) redirect("/login");

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      scopes: true,
      lastUsed: true,
      active: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return (
    <SettingsClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }}
      apiKeys={apiKeys}
    />
  );
}

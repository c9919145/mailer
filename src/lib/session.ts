import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function getCurrentUserWithDetails() {
  const user = await getCurrentUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      domains: true,
      _count: {
        select: {
          contacts: true,
          lists: true,
          templates: true,
          campaigns: true,
        },
      },
    },
  });

  return dbUser;
}

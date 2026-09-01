import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ apiKeys });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createApiKeySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, scopes } = parsed.data;
  const key = `mlr_${crypto.randomBytes(24).toString("hex")}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name,
      key,
      scopes: scopes.join(","),
    },
  });

  return NextResponse.json(
    { apiKey: { id: apiKey.id, name: apiKey.name, key } },
    { status: 201 }
  );
}

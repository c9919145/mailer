import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, userId: user.id },
  });
  if (!apiKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, userId: user.id },
  });
  if (!apiKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updated = await prisma.apiKey.update({ where: { id }, data: body });

  return NextResponse.json({
    apiKey: {
      id: updated.id,
      name: updated.name,
      scopes: updated.scopes,
      active: updated.active,
    },
  });
}

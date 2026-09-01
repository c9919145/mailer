import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const domain = await prisma.domain.findFirst({
    where: { id, userId: user.id },
  });
  if (!domain) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.domain.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ domain: updated });
  } catch (error) {
    console.error("Update domain error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const domain = await prisma.domain.findFirst({
    where: { id, userId: user.id },
  });
  if (!domain) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.domain.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

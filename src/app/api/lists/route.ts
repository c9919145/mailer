import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const createListSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  contactIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const where: any = { userId: user.id };
  if (search) {
    where.name = { contains: search };
  }

  const lists = await prisma.list.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { contactLists: true, campaigns: true },
      },
    },
  });

  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description, contactIds } = parsed.data;

    const existing = await prisma.list.findFirst({
      where: { userId: user.id, name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A list with this name already exists" },
        { status: 409 }
      );
    }

    const list = await prisma.list.create({
      data: {
        userId: user.id,
        name,
        description,
      },
    });

    if (contactIds?.length) {
      await prisma.contactList.createMany({
        data: contactIds.map((contactId) => ({
          contactId,
          listId: list.id,
        })),
      });
    }

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error("Create list error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

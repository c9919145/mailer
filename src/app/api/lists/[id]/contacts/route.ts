import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const addContactsSchema = z.object({
  contactIds: z.array(z.string()).min(1, "At least one contact is required"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const list = await prisma.list.findFirst({
    where: { id, userId: user.id },
  });

  if (!list) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contacts = await prisma.contactList.findMany({
    where: { listId: id },
    include: { contact: true },
  });

  return NextResponse.json({
    contacts: contacts.map((cl) => cl.contact),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const list = await prisma.list.findFirst({
    where: { id, userId: user.id },
  });

  if (!list) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = addContactsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { contactIds } = parsed.data;

    for (const contactId of contactIds) {
      await prisma.contactList.upsert({
        where: {
          contactId_listId: { contactId, listId: id },
        },
        update: {},
        create: {
          contactId,
          listId: id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add contacts to list error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { contactIds } = body;

    if (!contactIds?.length) {
      return NextResponse.json(
        { error: "At least one contact is required" },
        { status: 400 }
      );
    }

    await prisma.contactList.deleteMany({
      where: {
        listId: id,
        contactId: { in: contactIds },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove contacts from list error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

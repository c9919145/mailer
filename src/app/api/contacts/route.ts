import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const createContactSchema = z.object({
  email: z.string().email("Invalid email"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  customData: z.custom<Prisma.InputJsonObject | null>().optional(),
  listIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const listId = searchParams.get("listId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip = (page - 1) * limit;

  const where: any = {
    userId: user.id,
  };

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ];
  }

  if (listId) {
    where.contactLists = {
      some: { listId },
    };
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        contactLists: {
          include: { list: true },
        },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({
    contacts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, phone, company, customData, listIds } =
      parsed.data;

    const existing = await prisma.contact.findUnique({
      where: { userId_email: { userId: user.id, email } },
    });

    let contact;
    if (existing) {
      contact = await prisma.contact.update({
        where: { id: existing.id },
        data: { firstName, lastName, phone, company, customData: customData ?? undefined },
      });
    } else {
      contact = await prisma.contact.create({
        data: {
          userId: user.id,
          email,
          firstName,
          lastName,
          phone,
          company,
          customData: customData ?? undefined,
        },
      });
    }

    if (listIds?.length) {
      for (const listId of listIds) {
        await prisma.contactList.upsert({
          where: {
            contactId_listId: {
              contactId: contact.id,
              listId,
            },
          },
          update: {},
          create: {
            contactId: contact.id,
            listId,
          },
        });
      }
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("Create contact error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

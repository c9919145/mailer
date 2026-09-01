import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TemplateType } from "@prisma/client";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string(),
  textContent: z.string().optional(),
  type: z.nativeEnum(TemplateType).default(TemplateType.MARKETING),
  variables: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type");

  const where: any = { userId: user.id };
  if (search) {
    where.name = { contains: search };
  }
  if (type) {
    where.type = type;
  }

  const templates = await prisma.template.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { campaigns: true },
      },
    },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, subject, htmlContent, textContent, type, variables } =
      parsed.data;

    const template = await prisma.template.create({
      data: {
        userId: user.id,
        name,
        subject,
        htmlContent,
        textContent,
        type,
        variables,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { CampaignStatus } from "@prisma/client";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  templateId: z.string().min(1, "Template is required"),
  listId: z.string().optional(),
  domainId: z.string().optional(),
  fromEmail: z.string().email("Invalid from email"),
  fromName: z.string().optional().default(""),
  replyTo: z.string().email("Invalid reply-to email").optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as CampaignStatus | null;

  const where: any = { userId: user.id };
  if (status) {
    where.status = status;
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      template: {
        select: { name: true },
      },
      list: {
        select: { name: true },
      },
      _count: {
        select: { emails: true },
      },
    },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const template = await prisma.template.findFirst({
      where: { id: data.templateId, userId: user.id },
    });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: data.name,
        templateId: data.templateId,
        listId: data.listId,
        domainId: data.domainId,
        fromEmail: data.fromEmail,
        fromName: data.fromName || data.fromEmail,
        replyTo: data.replyTo,
        status: data.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
    });

    if (data.listId) {
      const listContacts = await prisma.contactList.findMany({
        where: { listId: data.listId },
        select: { contactId: true },
      });
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { totalCount: listContacts.length },
      });
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

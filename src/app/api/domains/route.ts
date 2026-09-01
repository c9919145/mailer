import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const createDomainSchema = z.object({
  name: z.string().min(1, "Domain is required"),
});

const WEBHOOK_EVENTS = [
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "BOUNCED",
  "COMPLAINED",
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domains = await prisma.domain.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ domains });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createDomainSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    const existing = await prisma.domain.findFirst({
      where: { userId: user.id, name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Domain already added" },
        { status: 409 }
      );
    }

    // Generate DNS records
    const dkimSelector = "mailer";
    const dkimValue = `v=DKIM1; k=rsa; p=${crypto.randomBytes(32).toString("hex")}`;
    const spfValue = "v=spf1 include:_spf.example.com ~all";
    const dmarcValue = "v=DMARC1; p=none; rua=mailto:dmarc@example.com";

    const domain = await prisma.domain.create({
      data: {
        userId: user.id,
        name,
        dkimRecord: `${dkimSelector}._domainkey`,
        spfRecord: spfValue,
        dmarcRecord: dmarcValue,
      },
    });

    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    console.error("Create domain error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

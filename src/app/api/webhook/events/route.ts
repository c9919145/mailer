import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailStatus } from "@prisma/client";

function eventToStatus(event: string): EmailStatus | null {
  switch (event) {
    case "email.sent":
      return EmailStatus.SENT;
    case "email.delivered":
      return EmailStatus.DELIVERED;
    case "email.opened":
      return EmailStatus.OPENED;
    case "email.clicked":
      return EmailStatus.CLICKED;
    case "email.bounced":
    case "email.complained":
      return EmailStatus.BOUNCED;
    case "email.failed":
      return EmailStatus.FAILED;
    default:
      return null;
  }
}

interface WebhookPayload {
  type?: string;
  data?: {
    email_id?: string;
    id?: string;
    created_at?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  try {
    const payload: WebhookPayload = await req.json();

    // Resend webhook format: { type: "email.delivered", data: { email_id: "...", ... } }
    const eventType = payload.type;
    const externalId =
      payload.data?.email_id || payload.data?.id || payload.email_id || null;

    if (!eventType || !externalId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const status = eventToStatus(eventType);
    if (!status) {
      return NextResponse.json({ success: true });
    }

    // Find the email by external ID (Resend message ID)
    const email = await prisma.email.findFirst({
      where: { OR: [{ externalId }, { id: externalId }] },
    });

    if (!email) {
      return NextResponse.json({ success: true });
    }

    const updateData: any = { status };
    if (eventType === "email.opened" && !email.openedAt) {
      updateData.openedAt = new Date();
    }
    if (eventType === "email.clicked" && !email.clickedAt) {
      updateData.clickedAt = new Date();
    }
    if (eventType === "email.delivered" && !email.sentAt) {
      updateData.sentAt = new Date();
    }
    if (eventType === "email.delivered" && !email.failedAt) {
      updateData.failedAt = null;
    }
    if (status === EmailStatus.FAILED || status === EmailStatus.BOUNCED) {
      updateData.failedAt = new Date();
      updateData.error = payload.data?.bounce?.message || "Email failed to deliver";
    }

    await prisma.email.update({
      where: { id: email.id },
      data: updateData,
    });

    // Update campaign status to SENT if all emails are terminal
    if (email.campaignId) {
      const campaignEmails = await prisma.email.findMany({
        where: { campaignId: email.campaignId },
        select: { status: true },
      });

      const terminalStatuses = [
        EmailStatus.SENT,
        EmailStatus.DELIVERED,
        EmailStatus.OPENED,
        EmailStatus.CLICKED,
        EmailStatus.BOUNCED,
        EmailStatus.FAILED,
        EmailStatus.COMPLAINED.toString(),
      ];

      const allTerminal = campaignEmails.every((e) =>
        terminalStatuses.includes(e.status.toString())
      );

      if (allTerminal && campaignEmails.length > 0) {
        await prisma.campaign.update({
          where: { id: email.campaignId },
          data: { status: "SENT", sentAt: new Date() },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { EmailStatus, Prisma } from "@prisma/client";

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
  email_id?: string;
  data?: {
    email_id?: string;
    id?: string;
    created_at?: string;
    bounce?: { message?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Verifies the Svix signature Resend sends with every webhook.
 *
 * This route was previously unauthenticated: anyone who could reach it could POST
 * `{ type: "email.bounced", data: { email_id: "<id>" } }` and flip any message to
 * BOUNCED/FAILED, silently corrupting campaign statistics. Signature checking is
 * what makes the id unguessable-enough.
 *
 * `resend.webhooks.verify` is HMAC-based over the timestamp and raw body, and
 * rejects replays, so it covers both forgery and replay. It needs the raw body
 * string - a parsed-and-reserialised body would change the bytes and fail the
 * HMAC.
 */
function verifySignature(rawBody: string, req: NextRequest): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  // Fail closed. An unconfigured secret must never mean "accept everything",
  // otherwise adding the check later would silently disable it by omission.
  if (!secret) return false;

  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return false;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    new Resend(apiKey).webhooks.verify({ payload: rawBody, headers: { id, timestamp, signature }, webhookSecret: secret });
    return true;
  } catch {
    // verify() throws on any mismatch: bad signature, stale timestamp, replayed id.
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!verifySignature(rawBody, req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody) as WebhookPayload;
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

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

    const updateData: Prisma.EmailUpdateInput = { status };
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

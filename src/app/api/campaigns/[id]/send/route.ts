import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { CampaignStatus, EmailStatus } from "@prisma/client";
import { enqueueEmail } from "@/lib/email/queue";
import { renderTemplate, getContactVariables, generatePlainText } from "@/lib/email/render";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: {
      template: true,
      list: {
        include: {
          contactLists: {
            include: { contact: true },
          },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (campaign.status === CampaignStatus.SENDING) {
    return NextResponse.json(
      { error: "Campaign is already sending" },
      { status: 400 }
    );
  }

  const contacts = (campaign.list?.contactLists ?? [])
    .map((cl) => cl.contact)
    .filter((c) => !c.unsubscribed);

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: "This list has no contacts to send to" },
      { status: 400 }
    );
  }

  // Build and enqueue all emails
  let enqueued = 0;
  for (const contact of contacts) {
    const variables = getContactVariables(contact);

    const html = renderTemplate(campaign.template.htmlContent ?? "", variables);
    const text =
      renderTemplate(campaign.template.textContent ?? "", variables) ||
      generatePlainText(html);
    const subject = renderTemplate(campaign.template.subject ?? "", variables);

    const email = await prisma.email.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        userId: user.id,
        fromEmail: campaign.fromEmail,
        fromName: campaign.fromName,
        toEmail: contact.email,
        toName: contact.firstName
          ? `${contact.firstName} ${contact.lastName ?? ""}`.trim()
          : null,
        subject,
        htmlBody: html,
        textBody: text,
        status: EmailStatus.QUEUED,
      },
    });

    await enqueueEmail({
      emailId: email.id,
      userId: user.id,
      fromEmail: campaign.fromEmail,
      fromName: campaign.fromName,
      toEmail: contact.email,
      toName: email.toName,
      subject,
      html,
      text,
      replyTo: campaign.replyTo,
      campaignId: campaign.id,
    });

    enqueued++;
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: CampaignStatus.SENDING,
      totalCount: enqueued,
      scheduledAt: null,
    },
  });

  return NextResponse.json({
    success: true,
    enqueued,
    campaignId: campaign.id,
  });
}

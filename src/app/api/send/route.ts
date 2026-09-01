import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { EmailStatus } from "@prisma/client";
import { enqueueEmail } from "@/lib/email/queue";
import { renderTemplate, extractVariables, generatePlainText } from "@/lib/email/render";

const sendEmailSchema = z.object({
  from: z.object({
    email: z.string().email("Invalid from email"),
    name: z.string().optional(),
  }),
  to: z.array(
    z.object({
      email: z.string().email("Invalid recipient email"),
      name: z.string().optional(),
    })
  ).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().optional(),
  text: z.string().optional(),
  variables: z.record(z.string(), z.any()).optional(),
  replyTo: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const apiKey = authHeader.replace("Bearer ", "").trim();

  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { user: true },
  });

  if (!keyRecord || !keyRecord.active) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (
    keyRecord.expiresAt &&
    new Date(keyRecord.expiresAt) < new Date()
  ) {
    return NextResponse.json({ error: "API key expired" }, { status: 401 });
  }

  await prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsed: new Date() },
  });

  const body = await req.json();
  const parsed = sendEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { from, to, subject, html, text, variables, replyTo } = parsed.data;

  const users = await prisma.user.findUnique({
    where: { id: keyRecord.userId },
  });
  if (!users) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const results = [];
  let sent = 0;

  for (const recipient of to) {
    const renderedHtml = html
      ? renderTemplate(html, { firstName: recipient.name || "", email: recipient.email, ...variables })
      : "";
    const renderedText = text
      ? renderTemplate(text, { firstName: recipient.name || "", email: recipient.email, ...variables })
      : generatePlainText(renderedHtml);
    const renderedSubject = renderTemplate(subject, {
      firstName: recipient.name || "",
      email: recipient.email,
      ...variables,
    });

    const email = await prisma.email.create({
      data: {
        userId: keyRecord.userId,
        fromEmail: from.email,
        fromName: from.name || from.email,
        toEmail: recipient.email,
        toName: recipient.name || null,
        subject: renderedSubject,
        htmlBody: renderedHtml,
        textBody: renderedText,
        status: EmailStatus.QUEUED,
      },
    });

    await enqueueEmail({
      emailId: email.id,
      userId: keyRecord.userId,
      fromEmail: from.email,
      fromName: from.name || from.email,
      toEmail: recipient.email,
      toName: recipient.name || null,
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedText,
      replyTo,
    });

    sent++;
    results.push({ id: email.id, email: recipient.email, status: "queued" });
  }

  return NextResponse.json(
    {
      success: true,
      sent,
      results,
    },
    { status: 200 }
  );
}

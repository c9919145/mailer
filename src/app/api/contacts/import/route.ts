import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const listId = (formData.get("listId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const parsed: any = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid CSV file" },
        { status: 400 }
      );
    }

    const rows = parsed.data;
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const email = (row.email || row.Email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        skipped++;
        continue;
      }

      const data = {
        firstName: row.firstName || row.first_name || row.firstname || null,
        lastName: row.lastName || row.last_name || row.lastname || null,
        phone: row.phone || row.Phone || null,
        company: row.company || row.Company || null,
      };

      const existing = await prisma.contact.findUnique({
        where: { userId_email: { userId: user.id, email } },
      });

      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data,
        });
        updated++;
      } else {
        const contact = await prisma.contact.create({
          data: {
            userId: user.id,
            email,
            ...data,
          },
        });

        if (listId) {
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

        created++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: { created, updated, skipped, total: rows.length },
    });
  } catch (error) {
    console.error("Import contacts error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

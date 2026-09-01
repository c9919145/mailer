import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:dev.db";
const filePath = url.replace("file:", "");
const adapter = new PrismaBetterSqlite3({ url: `file:${filePath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (existing) {
    console.log("Seed data already exists. Skipping.");
    return;
  }

  const password = await hash("password123", 10);

  const user = await prisma.user.create({
    data: {
      name: "Demo Admin",
      email: "admin@example.com",
      password,
    },
  });

  // Trial domain
  await prisma.domain.create({
    data: {
      userId: user.id,
      name: "trial.mailersend.net",
      verified: true,
      trial: true,
    },
  });

  // Sample lists
  const customers = await prisma.list.create({
    data: {
      userId: user.id,
      name: "Customers",
      description: "Active customers",
    },
  });

  const newsletter = await prisma.list.create({
    data: {
      userId: user.id,
      name: "Newsletter",
      description: "Newsletter subscribers",
    },
  });

  // Sample contacts
  const contacts = [
    { email: "jane@example.com", firstName: "Jane", lastName: "Doe", company: "Acme" },
    { email: "john@example.com", firstName: "John", lastName: "Smith", company: "Beta" },
    { email: "alice@example.com", firstName: "Alice", lastName: "Johnson", company: "Gamma" },
    { email: "bob@example.com", firstName: "Bob", lastName: "Brown", company: "Delta" },
  ];

  for (const contact of contacts) {
    const created = await prisma.contact.create({
      data: { userId: user.id, ...contact },
    });
    await prisma.contactList.createMany({
      data: [
        { contactId: created.id, listId: customers.id },
        { contactId: created.id, listId: newsletter.id },
      ],
    });
  }

  // Sample template
  await prisma.template.create({
    data: {
      userId: user.id,
      name: "Welcome Email",
      subject: "Welcome to Acme, {{firstName}}!",
      type: "MARKETING",
      htmlContent:
        "<h1>Welcome, {{firstName}}!</h1><p>Thanks for joining us. We're thrilled to have you on board.</p><p>Best regards,<br />The Acme Team</p>",
      textContent:
        "Welcome, {{firstName}}! Thanks for joining us. We're thrilled to have you on board. Best regards, The Acme Team",
      variables: ["firstName", "lastName", "email"],
    },
  });

  console.log("Seed complete!");
  console.log("Login with: admin@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

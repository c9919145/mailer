import { NextRequest } from "next/server";


async function main() {
  const { POST } = await import("../src/app/api/auth/register/route");
  const { prisma } = await import("../src/lib/prisma");

  // A genuinely fresh deployment: no users AND no singleton claim row.
  await prisma.user.deleteMany({});
  await prisma.deployment.deleteMany({});
  delete process.env.ALLOW_PUBLIC_SIGNUP;

  // Fire five simultaneous signups at a fresh deployment. The count() guard is
  // meant to stop two requests from both claiming ownership.
  const attempts = Array.from({ length: 5 }, (_, i) => {
    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: `Racer ${i}`,
        email: `racer${i}@example.com`,
        password: "hunter2long",
      }),
    });
    return POST(req).then(async (res: Response) => res.status);
  });

  const statuses = await Promise.all(attempts);
  const created = statuses.filter((s) => s === 201).length;
  const count = await prisma.user.count();

  console.log(`  statuses: ${statuses.join(", ")}`);
  console.log(`  accounts created: ${created}  | rows in db: ${count}`);
  console.log(
    `  ${created === 1 && count === 1 ? "ok" : "PROBLEM"}: exactly one racer claims a fresh deployment`,
  );

  await prisma.$disconnect();
  process.exit(created === 1 && count === 1 ? 0 : 1);
}

main();
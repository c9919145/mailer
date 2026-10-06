import { NextRequest } from "next/server";

const REPO = "/var/folders/63/j5_dfzc130j2r3yb5lxs9z4c0000gn/T/opencode/audit/mailer";

let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);
}

async function signup(email: string) {
  const { POST } = await import(`${REPO}/src/app/api/auth/register/route`);
  const req = new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Legacy", email, password: "hunter2long" }),
  });
  const res = await POST(req);
  return res.status;
}

async function main() {
  const { prisma } = await import(`${REPO}/src/lib/prisma`);
  delete process.env.ALLOW_PUBLIC_SIGNUP;

  // Scenario: a deployment created BEFORE this gate existed. It has a real user
  // but no Deployment claim row, so it looks unclaimed to a naive count check.
  await prisma.user.deleteMany({});
  await prisma.deployment.deleteMany({});
  await prisma.user.create({
    data: { name: "Existing Owner", email: "owner@example.com", password: "x".repeat(60) },
  });
  check("legacy deployment has no claim row", (await prisma.deployment.count()) === 0, "count=0");

  const status = await signup("stranger@example.com");
  check("legacy deployment refuses signup", status === 403, `status=${status}`);
  check("no stranger row created", (await prisma.user.count()) === 1, `users=${await prisma.user.count()}`);
  check(
    "no claim row leaked by the refused attempt",
    (await prisma.deployment.count()) === 0,
    `claims=${await prisma.deployment.count()}`,
  );

  await prisma.$disconnect();
  console.log(`\n${failures === 0 ? "PASS" : "FAIL"}: legacy-deployment back-compat verified`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
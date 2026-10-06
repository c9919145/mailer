import { NextRequest } from "next/server";

const REPO = "/var/folders/63/j5_dfzc130j2r3yb5lxs9z4c0000gn/T/opencode/audit/mailer";
const ROUTE = `${REPO}/src/app/api/auth/register/route`;
const PRISMA = `${REPO}/src/lib/prisma`;

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(48)} got=${String(actual)}${
      ok ? "" : ` want=${String(expected)}`
    }`,
  );
}

async function callRegister(payload: unknown) {
  // The gate reads process.env inside the handler, so no module-cache reset is
  // needed: each call re-evaluates the flag exactly as a live request would.
  const { POST } = await import(ROUTE);
  const req = new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const res = await POST(req);
  return { status: res.status, body: await res.json() };
}

const good = { name: "Test User", email: "user@example.com", password: "hunter2long" };

async function main() {
  const { prisma } = await import(PRISMA);

  // 1. Fresh deployment: the first account can be claimed.
  await prisma.user.deleteMany({});
  await prisma.deployment.deleteMany({});
  delete process.env.ALLOW_PUBLIC_SIGNUP;
  let r = await callRegister(good);
  check("fresh deploy, first signup", r.status, 201);
  check("user really persisted", await prisma.user.count(), 1);

  // 2. Second signup with the flag unset must be refused.
  r = await callRegister({ ...good, email: "intruder@example.com" });
  check("second signup, flag unset", r.status, 403);
  check("intruder NOT persisted", await prisma.user.count(), 1);
  check("error names the escape hatch", /ALLOW_PUBLIC_SIGNUP/.test(r.body.error), true);
  check(
    "no row for refused email",
    await prisma.user.findUnique({ where: { email: "intruder@example.com" } }),
    null,
  );

  // 3. Explicit opt-in reopens it.
  process.env.ALLOW_PUBLIC_SIGNUP = "true";
  r = await callRegister({ ...good, email: "invited@example.com" });
  check("signup with ALLOW_PUBLIC_SIGNUP=true", r.status, 201);
  check("opt-in user persisted", await prisma.user.count(), 2);

  // 4. Only the literal "true" counts.
  delete process.env.ALLOW_PUBLIC_SIGNUP;
  process.env.ALLOW_PUBLIC_SIGNUP = "1";
  r = await callRegister({ ...good, email: "sneaky@example.com" });
  check("ALLOW_PUBLIC_SIGNUP=1 must NOT reopen", r.status, 403);

  // 5. The gate must not mask validation errors when signup is open.
  process.env.ALLOW_PUBLIC_SIGNUP = "true";
  r = await callRegister({ ...good, email: "not-an-email" });
  check("invalid email still 400 with signup open", r.status, 400);
  r = await callRegister({ ...good, email: good.email });
  check("duplicate email still 409 with signup open", r.status, 409);
  delete process.env.ALLOW_PUBLIC_SIGNUP;

  // 6. A refused signup must not create a password hash for the attempt.
  const hashes = await prisma.user.findMany({ select: { email: true, password: true } });
  check(
    "no hash stored for refused attempts",
    hashes.filter((h: { email: string }) => h.email === "intruder@example.com" || h.email === "sneaky@example.com")
      .length,
    0,
  );
  check("stored password is a bcrypt hash", /^\$2[aby]\$/.test(hashes[0].password), true);

  await prisma.$disconnect();
  console.log(
    `\n${failures === 0 ? "PASS" : "FAIL"}: signup gate verified against a real SQLite database`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
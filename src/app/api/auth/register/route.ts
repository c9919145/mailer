import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const SIGNUP_CLOSED =
  "Signup is closed. An administrator can create your account, or set " +
  "ALLOW_PUBLIC_SIGNUP=true to reopen registration.";

/** Thrown inside the claim transaction to force a rollback. Never reaches the client. */
class DeploymentAlreadyClaimed extends Error {
  constructor() {
    super("deployment already has users");
    this.name = "DeploymentAlreadyClaimed";
  }
}

/**
 * Self-service signup used to be open to anyone who could reach the endpoint.
 *
 * All accounts share one Resend API key (`RESEND_API_KEY`), so an open endpoint
 * lets a stranger register, mint their own API key under `/api/keys`, and send
 * mail through this deployment. That burns the owner's quota and, because bounce
 * and complaint rates drive deliverability, damages the sender reputation the
 * whole product depends on. A public registration form is a spam relay.
 *
 * Signup is therefore closed by default, with two ways to allow it deliberately:
 *
 *  - claiming a fresh deployment, which inserts the singleton `Deployment` row
 *    inside the signup transaction; and
 *  - `ALLOW_PUBLIC_SIGNUP=true`, for deployments that really are multi-tenant.
 *
 * The gate is a database constraint rather than a `user.count()` read. A count is
 * a read followed by a separate write, so simultaneous requests all observe zero
 * users and all create an account — verified, five concurrent POSTs produced five
 * OWNERs. Inserting a primary key pinned to 1 makes the claim atomic: exactly one
 * concurrent request can win, and the rest hit a unique-constraint violation.
 */
async function createFirstAccount(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: "claimed" | "duplicate" }> {
  const hashedPassword = await hash(password, 10);

  try {
    return await prisma.$transaction(async (tx) => {
      // A deployment created before this gate existed has users but no
      // `Deployment` row, so it would look unclaimed. Refuse rather than letting
      // one more stranger into an established deployment. Throwing rolls the
      // transaction back, including the row insert above.
      const userCount = await tx.user.count();
      if (userCount > 0) {
        throw new DeploymentAlreadyClaimed();
      }

      // Atomic claim. Any concurrent racer gets a unique-constraint failure
      // rather than a second OWNER account.
      await tx.deployment.create({ data: {} });

      const user = await tx.user.create({
        data: { name, email, password: hashedPassword },
      });

      return { ok: true as const, id: user.id };
    });
  } catch (error) {
    // Legacy deployment: rows exist but no singleton row, so signup stays shut.
    if (error instanceof DeploymentAlreadyClaimed) {
      return { ok: false, reason: "claimed" };
    }

    // Prisma unique-constraint violation: either the deployment was already
    // claimed by someone else, or this email already exists.
    const isUniqueViolation =
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002";

    if (!isUniqueViolation) throw error;

    const deployment = await prisma.deployment.findUnique({ where: { id: 1 } });
    if (deployment) return { ok: false, reason: "claimed" };
    return { ok: false, reason: "duplicate" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const allowPublicSignup = process.env.ALLOW_PUBLIC_SIGNUP === "true";

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    if (allowPublicSignup) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });

      return NextResponse.json(
        { user: { id: user.id, name: user.name, email: user.email } },
        { status: 201 }
      );
    }

    // Try to claim the deployment. If it is already claimed, report closed
    // without ever attempting an insert.
    const deployment = await prisma.deployment.findUnique({ where: { id: 1 } });
    if (deployment) {
      return NextResponse.json({ error: SIGNUP_CLOSED }, { status: 403 });
    }

    const result = await createFirstAccount(name, email, password);

    if (!result.ok) {
      if (result.reason === "duplicate") {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: SIGNUP_CLOSED }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: result.id } });
    return NextResponse.json(
      { user: { id: user!.id, name: user!.name, email: user!.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
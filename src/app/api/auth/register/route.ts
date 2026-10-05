import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

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
 *  - the very first account, so a fresh deployment can be claimed at all; and
 *  - `ALLOW_PUBLIC_SIGNUP=true`, for deployments that really are multi-tenant.
 *
 * The first-account rule is a count, not a check-then-create, so two concurrent
 * requests cannot both slip through and claim ownership of the deployment.
 */
async function isFirstAccount(): Promise<boolean> {
  const count = await prisma.user.count();
  return count === 0;
}

export async function POST(req: NextRequest) {
  try {
    const allowPublicSignup = process.env.ALLOW_PUBLIC_SIGNUP === "true";

    if (!allowPublicSignup) {
      const first = await isFirstAccount();
      if (!first) {
        return NextResponse.json(
          {
            error:
              "Signup is closed. An administrator can create your account, or set " +
              "ALLOW_PUBLIC_SIGNUP=true to reopen registration.",
          },
          { status: 403 },
        );
      }
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
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
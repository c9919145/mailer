import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getEmailQueue, getEmailWorker } from "@/lib/email/queue";

export const maxDuration = 300;

function secretsMatch(presented: string, expected: string): boolean {
  const a = Buffer.from(presented, "utf8");
  const b = Buffer.from(expected, "utf8");
  // timingSafeEqual throws on a length mismatch. The length is not the secret,
  // so short-circuiting here does not leak anything useful.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// `vercel.json` schedules this route every minute, and Vercel Cron sends
// `Authorization: Bearer $CRON_SECRET`. `x-cron-secret` is kept as an
// alternative so the endpoint can be triggered by hand or by another provider.
function presentedSecret(req: Request): string | null {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length);
  }
  return req.headers.get("x-cron-secret");
}

export async function POST(req: Request) {
  // Fail closed. An unconfigured secret must never mean "no authentication".
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  const presented = presentedSecret(req);
  if (!presented || !secretsMatch(presented, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only process when the queue has work, to avoid spinning an idle worker
  const queue = getEmailQueue();
  const [waiting, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getDelayedCount(),
  ]);
  const pending = waiting + delayed;

  if (pending === 0) {
    return NextResponse.json({ ok: true, processed: 0, pending });
  }

  // Drain the queue with a short-lived worker
  let completed = 0;
  const worker = getEmailWorker();
  worker.on("completed", () => {
    completed++;
  });

  await new Promise<void>((resolve) => {
    const check = setInterval(async () => {
      const [w, d] = await Promise.all([
        queue.getWaitingCount(),
        queue.getDelayedCount(),
      ]);
      if (w + d === 0) {
        clearInterval(check);
        resolve();
      }
    }, 1000);
    // Safety timeout
    setTimeout(() => {
      clearInterval(check);
      resolve();
    }, 280_000);
  });

  return NextResponse.json({ ok: true, processed: completed, pending });
}

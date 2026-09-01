import { NextResponse } from "next/server";
import { getEmailQueue, getEmailWorker } from "@/lib/email/queue";

export const maxDuration = 300;

export async function POST() {
  const authHeader = process.env.CRON_SECRET;
  const secret = "x-cron-secret";

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

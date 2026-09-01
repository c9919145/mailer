import "dotenv/config";
import { getEmailWorker } from "@/lib/email/queue";

const worker = getEmailWorker();

worker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

console.log("Email worker started. Waiting for jobs...");

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

import { Queue, Worker, type Queue as QueueType, type Worker as WorkerType } from "bullmq";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { EmailStatus } from "@prisma/client";

const redisUrl = process.env.REDIS_URL;

const connection = redisUrl
  ? {
      url: redisUrl,
      tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
    };

let emailQueueInstance: QueueType | null = null;

export function getEmailQueue(): QueueType {
  if (!emailQueueInstance) {
    emailQueueInstance = new Queue("email-queue", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });
  }
  return emailQueueInstance;
}

export interface SendEmailJob {
  emailId: string;
  userId: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName?: string | null;
  subject: string;
  html: string;
  text?: string | null;
  replyTo?: string | null;
  campaignId?: string | null;
}

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

let workerInstance: WorkerType<SendEmailJob> | null = null;

export function getEmailWorker(): WorkerType<SendEmailJob> {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker<SendEmailJob>(
    "email-queue",
    async (job) => {
      const data = job.data;
      const resend = createResendClient();

      if (!resend) {
        // No Resend key configured - mark as sent for testing without provider
        await prisma.email.update({
          where: { id: data.emailId },
          data: {
            status: EmailStatus.SENT,
            sentAt: new Date(),
          },
        });
        return { status: "sent_without_provider" };
      }

      const { data: resendData, error } = await resend.emails.send({
        from: `"${data.fromName}" <${data.fromEmail}>`,
        to: data.toEmail,
        replyTo: data.replyTo || undefined,
        subject: data.subject,
        html: data.html,
        text: data.text || undefined,
        headers: data.campaignId
          ? { "X-Campaign-Id": data.campaignId }
          : undefined,
      });

      if (error) {
        await prisma.email.update({
          where: { id: data.emailId },
          data: {
            status: EmailStatus.FAILED,
            error: error.message,
            failedAt: new Date(),
          },
        });
        throw new Error(error.message);
      }

      await prisma.email.update({
        where: { id: data.emailId },
        data: {
          status: EmailStatus.SENT,
          externalId: resendData?.id,
          sentAt: new Date(),
        },
      });

      return { status: "sent", externalId: resendData?.id };
    },
    {
      connection,
      concurrency: 10,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  workerInstance.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err.message);
  });

  return workerInstance;
}

export async function enqueueEmail(job: SendEmailJob) {
  const queue = getEmailQueue();
  return queue.add("send-email", job, {
    jobId: job.emailId,
  });
}

export async function getQueueStats() {
  const queue = getEmailQueue();
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}

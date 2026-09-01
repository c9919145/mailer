import { Redis, type RedisOptions } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedis() {
  const url = process.env.REDIS_URL;
  if (url) {
    const options: RedisOptions = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
    if (process.env.REDIS_TLS === "true") {
      options.tls = {};
    }
    return new Redis(url, options);
  }

  const host = process.env.REDIS_HOST || "localhost";
  const port = parseInt(process.env.REDIS_PORT || "6379");
  const password = process.env.REDIS_PASSWORD || undefined;

  return new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

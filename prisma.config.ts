import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Local development uses SQLite (prisma/schema.prisma).
// Production on Vercel sets DATABASE_PROVIDER=postgresql to use prisma/schema.postgres.prisma.
const provider = process.env.DATABASE_PROVIDER || "sqlite";
const schema =
  provider === "postgresql"
    ? "prisma/schema.postgres.prisma"
    : "prisma/schema.prisma";

export default defineConfig({
  schema,
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});

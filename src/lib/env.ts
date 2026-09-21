import { z } from "zod";

const serverEnvSchema = z.object({
  MONGGO_URI: z.string().optional(),
  MONGO_URI: z.string().optional(),
  GOOGLE_PROJECT_ID: z.string().min(1),
  GOOGLE_CLIENT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string().min(1),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  SESSION_SECRET: z.string().min(32),
});

let cached: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
    );
  }

  if (!parsed.data.MONGGO_URI && !parsed.data.MONGO_URI) {
    throw new Error("Missing MONGGO_URI (or MONGO_URI fallback)");
  }

  if (!parsed.data.ADMIN_PASSWORD && !parsed.data.ADMIN_PASSWORD_HASH) {
    throw new Error("Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH");
  }

  cached = parsed.data;
  return parsed.data;
}

export function getMongoUri() {
  const env = getServerEnv();
  return env.MONGGO_URI || env.MONGO_URI!;
}

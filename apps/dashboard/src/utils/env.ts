export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`[env] Missing recommended env var: ${name}`);
  }
  return value || "";
}

// Required for the app to function
export const env = {
  DATABASE_URL: process.env.DATABASE_PRIMARY_URL || process.env.DATABASE_URL || "",
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
};

// Warn on missing critical vars (server-side only)
if (typeof window === "undefined") {
  const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    console.warn(`[env] Missing env vars: ${missing.join(", ")}`);
  }
}

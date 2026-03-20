import { type JWTPayload, jwtVerify } from "jose";

export type Session = {
  user: {
    id: string;
    email?: string;
    full_name?: string;
  };
  teamId?: string;
};

type SupabaseJWTPayload = JWTPayload & {
  email?: string;
  user_metadata?: {
    email?: string;
    full_name?: string;
    [key: string]: string | undefined;
  };
};

export async function verifyAccessToken(
  accessToken?: string,
): Promise<Session | null> {
  if (!accessToken) return null;

  try {
    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET),
    );

    const supabasePayload = payload as SupabaseJWTPayload;

    return {
      user: {
        id: supabasePayload.sub!,
        // Supabase puts email at top-level AND in user_metadata — check both
        email: supabasePayload.email ?? supabasePayload.user_metadata?.email,
        full_name: supabasePayload.user_metadata?.full_name,
      },
    };
  } catch (error) {
    console.error(
      "[verifyAccessToken] JWT verification failed:",
      error instanceof Error ? error.message : error,
      "| JWT_SECRET defined:",
      !!process.env.SUPABASE_JWT_SECRET,
    );
    return null;
  }
}

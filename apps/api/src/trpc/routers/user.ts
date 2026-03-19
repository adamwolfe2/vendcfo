import { updateUserSchema } from "@api/schemas/users";
import { resend } from "@api/services/resend";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { withRetryOnPrimary } from "@api/utils/db-retry";
import {
  deleteUser,
  ensureUserExists,
  getUserById,
  getUserInvites,
  updateUser,
} from "@vendcfo/db/queries";
import { generateFileKey } from "@vendcfo/encryption";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx: { db, supabase, session } }) => {
    let result = await withRetryOnPrimary(db, async (dbInstance) =>
      getUserById(dbInstance, session.user.id),
    );

    // Belt-and-suspenders: if user record is missing, create it and retry.
    // For OTP logins the auth callback is never hit, so this is the primary
    // path that creates the public.users row.
    if (!result) {
      // session.user.email comes from verifyAccessToken (JWT top-level email claim).
      // If somehow still missing, fall back to Supabase getUser().
      let email = session.user.email;
      let fullName = session.user.full_name ?? null;

      if (!email) {
        const { data } = await supabase.auth.getUser();
        email = data.user?.email ?? undefined;
        fullName = data.user?.user_metadata?.full_name ?? fullName;
      }

      if (email) {
        await ensureUserExists(db, {
          id: session.user.id,
          email,
          fullName,
        });
        result = await getUserById(db, session.user.id);
      }
    }

    if (!result) {
      return undefined;
    }

    return {
      ...result,
      fileKey: result.teamId ? await generateFileKey(result.teamId) : null,
    };
  }),

  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return updateUser(db, {
        id: session.user.id,
        ...input,
      });
    }),

  delete: protectedProcedure.mutation(
    async ({ ctx: { supabase, db, session } }) => {
      const [data] = await Promise.all([
        deleteUser(db, session.user.id),
        supabase.auth.admin.deleteUser(session.user.id),
        resend.contacts.remove({
          email: session.user.email!,
          audienceId: process.env.RESEND_AUDIENCE_ID!,
        }),
      ]);

      return data;
    },
  ),

  invites: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    if (!session.user.email) {
      return [];
    }

    return getUserInvites(db, session.user.email);
  }),
});

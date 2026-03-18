"use server";

import { Cookies } from "@/utils/constants";
import { createClient } from "@vendcfo/supabase/server";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const verifyOtpAction = actionClient
  .schema(
    z.object({
      token: z.string(),
      email: z.string(),
      redirectTo: z.string(),
    }),
  )
  .action(async ({ parsedInput: { email, token, redirectTo } }) => {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      throw new Error(error.message);
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Failed to establish session after OTP verification");
    }

    (await cookies()).set(Cookies.PreferredSignInProvider, "otp", {
      expires: addYears(new Date(), 1),
    });

    // Return the redirect URL instead of calling redirect() —
    // redirect() throws internally and gets caught by next-safe-action's
    // handleServerError, preventing the redirect from happening.
    return { redirectTo };
  });

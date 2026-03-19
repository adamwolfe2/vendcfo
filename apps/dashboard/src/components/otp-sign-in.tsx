"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@vendcfo/supabase/client";
import { cn } from "@vendcfo/ui/cn";
import { Form, FormControl, FormField, FormItem } from "@vendcfo/ui/form";
import { Input } from "@vendcfo/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@vendcfo/ui/input-otp";
import { Spinner } from "@vendcfo/ui/spinner";
import { SubmitButton } from "@vendcfo/ui/submit-button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";

const formSchema = z.object({
  email: z.string().email(),
});

type Props = {
  className?: string;
};

export function OTPSignIn({ className }: Props) {
  const [isLoading, setLoading] = useState(false);
  const [isSent, setSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string>();
  const [email, setEmail] = useState<string>();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit({ email }: z.infer<typeof formSchema>) {
    setLoading(true);

    setEmail(email);

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    setSent(true);
    setLoading(false);
  }

  async function onComplete(token: string) {
    if (!email) return;

    setIsVerifying(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setAuthError(`OTP Error: ${error.message}`);
      setIsVerifying(false);
      return;
    }

    if (!data.session) {
      setAuthError("No session returned. Check Supabase configuration.");
      setIsVerifying(false);
      return;
    }

    // Session established — wait for Supabase SSR to persist cookies,
    // then do a hard navigation so the middleware sees the session.
    // router.push() does a soft nav that races the cookie write.
    setAuthError(undefined);
    const returnTo = searchParams.get("return_to") || "";

    // Poll for the sb- cookie (max 3s, 200ms intervals) instead of fixed delay
    await new Promise<void>((resolve) => {
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 200;
        const hasCookie = document.cookie.split(";").some((c) => c.trim().startsWith("sb-"));
        if (hasCookie || elapsed >= 3000) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });

    // Hard navigation — forces full page load where middleware reads cookies
    window.location.href = `/${returnTo}`;
  }

  if (isSent) {
    return (
      <div className={cn("flex flex-col space-y-4 items-center", className)}>
        <div className="h-[62px] w-full flex items-center justify-center">
          {isVerifying ? (
            <div className="flex items-center justify-center h-full bg-background/95 border border-input w-full">
              <div className="flex items-center space-x-2 bg-background px-4 py-2 rounded-md shadow-sm">
                <Spinner size={16} className="text-primary" />
                <span className="text-sm text-foreground font-medium">
                  Verifying...
                </span>
              </div>
            </div>
          ) : (
            <InputOTP
              maxLength={8}
              autoFocus
              onComplete={onComplete}
              disabled={isVerifying}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, index) => (
                    <InputOTPSlot
                      key={index.toString()}
                      {...slot}
                      className="w-[48px] h-[54px]"
                    />
                  ))}
                </InputOTPGroup>
              )}
            />
          )}
        </div>

        {authError && (
          <p className="text-sm text-red-600 text-center w-full px-2">{authError}</p>
        )}

        <div className="flex space-x-2">
          <span className="text-sm text-[#878787]">
            Didn't receive the email?
          </span>
          <button
            onClick={() => setSent(false)}
            type="button"
            className="text-sm text-primary underline font-medium"
            disabled={isVerifying}
          >
            Resend code
          </button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className={cn("flex flex-col space-y-4", className)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Enter email address"
                    {...field}
                    autoCapitalize="false"
                    autoCorrect="false"
                    spellCheck="false"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <SubmitButton
            type="submit"
            className="bg-primary px-6 py-4 text-secondary font-medium flex space-x-2 h-[40px] w-full"
            isSubmitting={isLoading}
          >
            Continue
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}

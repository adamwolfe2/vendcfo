import { LoginFeatureShowcase } from "@/components/login-feature-showcase";
import { OTPSignIn } from "@/components/otp-sign-in";
import { Cookies } from "@/utils/constants";
import { Icons } from "@vendcfo/ui/icons";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { userAgent } from "next/server";

export const metadata: Metadata = {
  title: "Login | VendCFO",
};

export default async function Page() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get(Cookies.PreferredSignInProvider);
  const { device } = userAgent({ headers: await headers() });

  return (
    <div className="min-h-screen bg-white flex relative">
      {/* Left Side - Feature Showcase (hidden on mobile) */}
      <LoginFeatureShowcase />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 pb-2">
        <div className="w-full max-w-md flex flex-col h-full">
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            {/* Logo + Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-6">
                <div className="w-10 h-10">
                  <Icons.LogoSmall className="w-full h-full text-foreground" />
                </div>
              </div>
              <h1 className="text-lg font-serif">Welcome to VendCFO</h1>
              <p className="font-sans text-sm text-[#878787]">
                Sign in or create an account
              </p>
            </div>

            {/* Email OTP Sign In */}
            <div className="space-y-3 flex items-center justify-center w-full">
              <OTPSignIn />
            </div>
          </div>

          {/* Terms and Privacy Policy - Bottom aligned */}
          <div className="text-center mt-auto">
            <p className="font-sans text-xs text-[#878787]">
              By signing in you agree to our{" "}
              <Link
                href="https://vendhub.com/terms"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Terms of service
              </Link>{" "}
              &{" "}
              <Link
                href="https://vendhub.com/policy"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Privacy policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

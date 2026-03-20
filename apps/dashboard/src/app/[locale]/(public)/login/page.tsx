import { LoginFeatureShowcase } from "@/components/login-feature-showcase";
import { OTPSignIn } from "@/components/otp-sign-in";
import { Icons } from "@vendcfo/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login | VendCFO",
};

export default async function Page() {
  return (
    <div className="min-h-screen bg-white flex relative">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-center items-center p-8 lg:p-12 pb-2 flex-shrink-0">
        <div className="w-full max-w-sm flex flex-col h-full">
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            {/* Logo + Header */}
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-4">
                <div className="w-10 h-10">
                  <Icons.LogoSmall className="w-full h-full text-foreground" />
                </div>
              </div>
              <h1 className="text-xl font-serif font-medium">
                Welcome to VendCFO
              </h1>
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
          <div className="text-center mt-auto pt-8">
            <p className="font-sans text-xs text-[#878787]">
              By signing in you agree to our{" "}
              <Link
                href="https://vendcfo.ai/terms"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Terms of service
              </Link>{" "}
              &{" "}
              <Link
                href="https://vendcfo.ai/policy"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Privacy policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Interactive Demo Showcase (hidden on mobile) */}
      <LoginFeatureShowcase />
    </div>
  );
}

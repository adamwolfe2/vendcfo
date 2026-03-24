"use client";

import { useAppOAuth } from "@/hooks/use-app-oauth";
import { Button } from "@vendcfo/ui/button";
import { Card, CardContent } from "@vendcfo/ui/card";
import { cn } from "@vendcfo/ui/cn";
import { Input } from "@vendcfo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vendcfo/ui/select";
import {
  ArrowRight,
  Check,
  FileSpreadsheet,
  Link as LinkIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ONBOARDING_COMPLETE_KEY = "vendcfo-onboarding-complete";

type Step = 1 | 2 | 3;

interface BusinessProfile {
  businessType: string;
  machineCount: string;
  locationCount: string;
  routeCount: string;
  revenueRange: string;
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
      {([1, 2, 3] as const).map((step) => (
        <div key={step} className="flex items-center gap-2 sm:gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors",
              currentStep === step
                ? "bg-black text-white border-black"
                : currentStep > step
                  ? "bg-black text-white border-black"
                  : "bg-white text-[#878787] border-[#ddd]",
            )}
          >
            {currentStep > step ? <Check className="w-4 h-4" /> : step}
          </div>
          {step < 3 && (
            <div
              className={cn(
                "w-8 sm:w-12 h-px",
                currentStep > step ? "bg-black" : "bg-[#ddd]",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepOne({
  onQuickBooks,
  onUpload,
  onSkip,
  isConnecting,
}: {
  onQuickBooks: () => void;
  onUpload: () => void;
  onSkip: () => void;
  isConnecting: boolean;
}) {
  const cards = [
    {
      icon: LinkIcon,
      title: "Connect QuickBooks",
      description:
        "Automatically sync your transactions, invoices, and customers",
      note: "Most popular -- takes 2 minutes",
      action: onQuickBooks,
      actionLabel: isConnecting ? "Connecting..." : "Connect",
      actionLoading: isConnecting,
      primary: true,
    },
    {
      icon: FileSpreadsheet,
      title: "Upload Your Data",
      description: "Import CSV or Excel files from your accounting records",
      note: null,
      action: onUpload,
      actionLabel: "Upload",
      actionLoading: false,
      primary: false,
    },
    {
      icon: Sparkles,
      title: "Start From Scratch",
      description: "Set up your dashboard manually as you go",
      note: null,
      action: onSkip,
      actionLabel: "Skip to Dashboard",
      actionLoading: false,
      primary: false,
    },
  ];

  return (
    <div className="px-4 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-serif mb-2">
          How would you like to get started?
        </h1>
        <p className="text-[#878787] text-sm">
          Choose how to bring your financial data into VendCFO
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="border border-[#ddd] rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
          >
            <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center h-full">
              <div className="w-12 h-12 rounded-lg bg-[#f5f5f5] flex items-center justify-center mb-4 group-hover:bg-[#eee] transition-colors">
                <card.icon className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-medium text-sm mb-2">{card.title}</h3>
              <p className="text-[#878787] text-xs mb-4 leading-relaxed flex-1">
                {card.description}
              </p>
              {card.note && (
                <p className="text-[10px] text-[#878787] mb-3 italic">
                  {card.note}
                </p>
              )}
              <Button
                onClick={card.action}
                disabled={card.actionLoading}
                variant={card.primary ? "default" : "outline"}
                className={cn(
                  "w-full text-sm",
                  card.primary
                    ? "bg-black text-white hover:bg-black/90"
                    : "border-[#ddd] hover:bg-[#f5f5f5]",
                )}
              >
                {card.actionLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {card.actionLabel}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StepTwo({
  profile,
  onChange,
  onSubmit,
  onSkip,
}: {
  profile: BusinessProfile;
  onChange: (field: keyof BusinessProfile, value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="px-4 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-serif mb-2">
          Tell us about your business
        </h1>
        <p className="text-[#878787] text-sm">
          This helps us tailor your dashboard and insights
        </p>
      </div>

      <Card className="border border-[#ddd] rounded-lg">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Business type</label>
            <Select
              value={profile.businessType}
              onValueChange={(v) => onChange("businessType", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vending_machines">
                  Vending Machines
                </SelectItem>
                <SelectItem value="micro_markets">Micro Markets</SelectItem>
                <SelectItem value="office_coffee">
                  Office Coffee Service
                </SelectItem>
                <SelectItem value="combo">Combo (Multiple Types)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of machines</label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 25"
                value={profile.machineCount}
                onChange={(e) => onChange("machineCount", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of locations</label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 15"
                value={profile.locationCount}
                onChange={(e) => onChange("locationCount", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of routes</label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 3"
                value={profile.routeCount}
                onChange={(e) => onChange("routeCount", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly revenue range</label>
            <Select
              value={profile.revenueRange}
              onValueChange={(v) => onChange("revenueRange", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-5k">$0 - $5,000</SelectItem>
                <SelectItem value="5k-15k">$5,000 - $15,000</SelectItem>
                <SelectItem value="15k-50k">$15,000 - $50,000</SelectItem>
                <SelectItem value="50k+">$50,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-[#878787] hover:text-black transition-colors min-h-[44px] w-full sm:w-auto"
            >
              Skip this step
            </button>
            <Button
              onClick={onSubmit}
              className="bg-black text-white hover:bg-black/90 w-full sm:w-auto min-h-[44px]"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepThree({ onFinish }: { onFinish: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="text-center px-4 sm:px-0">
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <div className="w-16 h-16 rounded-full bg-[#f0fdf4] border-2 border-[#22c55e] flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-[#22c55e]" />
        </div>

        <h1 className="text-xl sm:text-2xl font-serif mb-3">
          You are all set!
        </h1>
        <p className="text-[#878787] text-sm mb-8 max-w-md mx-auto leading-relaxed">
          Your dashboard is ready. We will generate insights as your data comes
          in.
        </p>

        <Button
          onClick={onFinish}
          className="bg-black text-white hover:bg-black/90 px-8 w-full sm:w-auto min-h-[44px]"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<BusinessProfile>({
    businessType: "",
    machineCount: "",
    locationCount: "",
    routeCount: "",
    revenueRange: "",
  });

  const markComplete = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    } catch {
      // localStorage may not be available
    }
  }, []);

  const { connect: connectQuickBooks, isLoading: isConnecting } = useAppOAuth({
    installUrlEndpoint: "/api/apps/quickbooks/install-url",
    onSuccess: () => {
      setStep(2);
    },
    onError: () => {
      // Still advance — user can reconnect later from Apps page
      setStep(2);
    },
  });

  const handleQuickBooks = useCallback(() => {
    connectQuickBooks();
  }, [connectQuickBooks]);

  const handleUpload = useCallback(() => {
    markComplete();
    router.push("/import");
  }, [router, markComplete]);

  const handleSkipToDashboard = useCallback(() => {
    markComplete();
    router.push("/");
  }, [router, markComplete]);

  const handleProfileChange = useCallback(
    (field: keyof BusinessProfile, value: string) => {
      setProfile((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleProfileSubmit = useCallback(() => {
    // Save business profile to localStorage for now
    // In a future iteration this can be persisted to team metadata via TRPC
    try {
      localStorage.setItem("vendcfo-business-profile", JSON.stringify(profile));
    } catch {
      // localStorage may not be available
    }
    setStep(3);
  }, [profile]);

  const handleSkipProfile = useCallback(() => {
    setStep(3);
  }, []);

  const handleFinish = useCallback(() => {
    markComplete();
    // Store that onboarding just completed so the dashboard can show a chat prompt
    try {
      sessionStorage.setItem("vendcfo-onboarding-just-completed", "true");
    } catch {
      // sessionStorage may not be available
    }
    window.location.href = "/";
  }, [markComplete]);

  return (
    <div>
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <StepOne
          onQuickBooks={handleQuickBooks}
          onUpload={handleUpload}
          onSkip={handleSkipToDashboard}
          isConnecting={isConnecting}
        />
      )}

      {step === 2 && (
        <StepTwo
          profile={profile}
          onChange={handleProfileChange}
          onSubmit={handleProfileSubmit}
          onSkip={handleSkipProfile}
        />
      )}

      {step === 3 && <StepThree onFinish={handleFinish} />}
    </div>
  );
}

"use client";

import { useChatStore } from "@/store/chat";
import { MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";

export function OnboardingChatPrompt() {
  const [show, setShow] = useState(false);
  const setInput = useChatStore((s) => s.setInput);

  useEffect(() => {
    try {
      const justCompleted = sessionStorage.getItem(
        "vendcfo-onboarding-just-completed",
      );
      if (justCompleted === "true") {
        setShow(true);
        sessionStorage.removeItem("vendcfo-onboarding-just-completed");
      }
    } catch {
      // sessionStorage may not be available
    }
  }, []);

  if (!show) return null;

  const handleClick = (prompt: string) => {
    // Store the prompt for ChatInterface to auto-send on next mount/check
    try {
      sessionStorage.setItem("vendcfo-chat-prompt", prompt);
    } catch {
      // sessionStorage may not be available
    }
    // Also set it in the chat input store so the text appears immediately
    setInput(prompt);
    setShow(false);
    // Dispatch a custom event so ChatInterface can pick it up and auto-send
    window.dispatchEvent(
      new CustomEvent("vendcfo-chat-auto-send", { detail: { prompt } }),
    );
  };

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 sm:left-auto sm:right-6 z-50 sm:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-white border border-[#d0d0d0] rounded-lg shadow-lg p-4 relative">
        <button
          type="button"
          onClick={() => setShow(false)}
          className="absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#f0f0f0] rounded"
        >
          <X size={14} className="text-[#999]" />
        </button>
        <h3 className="font-medium text-sm mb-1">Welcome to Route CFO</h3>
        <p className="text-xs text-[#878787] mb-3">
          I have analyzed your data. Ready to run your first financial report?
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() =>
              handleClick(
                "Give me a full financial health check with benchmark comparisons. Break down my revenue, expenses, margins, and flag anything that needs attention.",
              )
            }
            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 min-h-[44px]"
          >
            <MessageSquare size={16} />
            Run my first financial report
          </button>
          <button
            type="button"
            onClick={() =>
              handleClick(
                "Which machines are performing best and worst? Compare against industry benchmarks.",
              )
            }
            className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-[#d0d0d0] text-sm font-medium text-[#555] rounded-lg hover:bg-[#f5f5f5] min-h-[44px]"
          >
            Show my best and worst machines
          </button>
          <button
            type="button"
            onClick={() => setShow(false)}
            className="text-xs text-[#999] hover:text-[#555] py-1"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

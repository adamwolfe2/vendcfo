"use client";

import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

interface AskRouteCFOProps {
  prompt: string;
  label?: string;
}

export function AskRouteCFO({ prompt, label = "Ask Route CFO" }: AskRouteCFOProps) {
  const router = useRouter();

  const handleClick = () => {
    // Store the prompt in sessionStorage so the chat page can pick it up
    sessionStorage.setItem("vendcfo-chat-prompt", prompt);
    router.push("/chat");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#555] border border-[#d0d0d0] rounded-lg hover:bg-[#f5f5f5] transition-colors min-h-[44px]"
    >
      <MessageSquare size={16} strokeWidth={1.5} />
      {label}
    </button>
  );
}

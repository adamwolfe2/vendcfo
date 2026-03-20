"use client";

import { useTRPC } from "@/trpc/client";
import { useChatId } from "@ai-sdk-tools/store";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@vendcfo/ui/cn";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { useState } from "react";

interface MessageFeedbackProps {
  messageId: string;
}

const NEGATIVE_REASONS = [
  "Numbers seem wrong",
  "Didn't answer my question",
  "Too vague / generic",
  "Other",
];

export function MessageFeedback({ messageId }: MessageFeedbackProps) {
  const chatId = useChatId();
  const [rating, setRating] = useState<"positive" | "negative" | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const trpc = useTRPC();

  const createFeedbackMutation = useMutation(
    trpc.chatFeedback.create.mutationOptions(),
  );

  const deleteFeedbackMutation = useMutation(
    trpc.chatFeedback.delete.mutationOptions(),
  );

  const submitFeedback = (type: "positive" | "negative", comment?: string) => {
    setRating(type);
    setSubmitted(true);
    setShowReasons(false);

    if (!chatId) return;

    createFeedbackMutation.mutate({
      chatId,
      messageId,
      type,
      comment,
    });
  };

  const handlePositive = () => {
    if (rating === "positive") {
      // Toggle off
      setRating(null);
      setSubmitted(false);
      if (!chatId) return;
      deleteFeedbackMutation.mutate({ chatId, messageId });
      return;
    }
    submitFeedback("positive");
  };

  const handleNegative = () => {
    if (rating === "negative") {
      // Toggle off
      setRating(null);
      setSubmitted(false);
      setShowReasons(false);
      if (!chatId) return;
      deleteFeedbackMutation.mutate({ chatId, messageId });
      return;
    }
    // Show reasons panel before submitting
    setShowReasons(true);
  };

  // After submission, show a compact confirmation
  if (submitted && !showReasons) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
        {rating === "positive" ? (
          <ThumbsUp size={12} className="text-[#22c55e]" />
        ) : (
          <ThumbsDown size={12} className="text-[#ef4444]" />
        )}
        <span>Thanks for the feedback</span>
      </div>
    );
  }

  // Reasons popover for negative feedback
  if (showReasons) {
    return (
      <div className="flex flex-col gap-1 mt-2 p-2 border border-[#e0e0e0] rounded-lg bg-[#fafafa] max-w-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[#555]">
            What was off?
          </span>
          <button
            type="button"
            onClick={() => setShowReasons(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#f0f0f0] rounded"
          >
            <X size={14} className="text-[#999]" />
          </button>
        </div>
        {NEGATIVE_REASONS.map((reason) => (
          <button
            key={reason}
            type="button"
            onClick={() => submitFeedback("negative", reason)}
            className="text-left text-xs px-3 py-2.5 min-h-[44px] rounded hover:bg-[#f0f0f0] text-[#555] transition-colors flex items-center"
          >
            {reason}
          </button>
        ))}
      </div>
    );
  }

  // Default state: show thumbs up/down on hover (parent has group class)
  return (
    <div className="flex items-center gap-0.5 mt-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={handlePositive}
        disabled={createFeedbackMutation.isPending || deleteFeedbackMutation.isPending}
        className={cn(
          "min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors",
          "hover:bg-[#dcfce7]",
          (createFeedbackMutation.isPending || deleteFeedbackMutation.isPending) &&
            "opacity-50 cursor-not-allowed",
        )}
        title="Good response"
      >
        <ThumbsUp size={14} className="text-[#999] hover:text-[#22c55e]" />
      </button>
      <button
        type="button"
        onClick={handleNegative}
        disabled={createFeedbackMutation.isPending || deleteFeedbackMutation.isPending}
        className={cn(
          "min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors",
          "hover:bg-[#fee2e2]",
          (createFeedbackMutation.isPending || deleteFeedbackMutation.isPending) &&
            "opacity-50 cursor-not-allowed",
        )}
        title="Bad response"
      >
        <ThumbsDown size={14} className="text-[#999] hover:text-[#ef4444]" />
      </button>
    </div>
  );
}

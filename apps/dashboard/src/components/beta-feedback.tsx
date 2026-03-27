"use client";

import { createClient } from "@vendcfo/supabase/client";
import { Button } from "@vendcfo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@vendcfo/ui/dialog";
import { MessageCircle, Star, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function BetaFeedback() {
  const [open, setOpen] = useState(false);
  const [positive, setPositive] = useState("");
  const [negative, setNegative] = useState("");
  const [featureRequests, setFeatureRequests] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pathname = usePathname();

  const resetForm = () => {
    setPositive("");
    setNegative("");
    setFeatureRequests("");
    setRating(0);
    setHoveredStar(0);
    setSubmitting(false);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get team_id from user metadata or session
      const teamId = user?.user_metadata?.team_id ?? null;

      await (supabase as any).from("beta_feedback").insert({
        team_id: teamId,
        user_id: user?.id ?? null,
        positive: positive || null,
        negative: negative || null,
        feature_requests: featureRequests || null,
        rating: rating || null,
        page_route: pathname,
      });

      setSubmitted(true);

      // Close after showing confirmation
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1800);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  return (
    <>
      {/* Floating feedback button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-50 bg-white border border-[#d0d0d0] shadow-sm rounded-full px-3 py-2 flex items-center gap-1.5 text-sm text-[#555] hover:text-black hover:border-[#999] transition-colors min-h-[44px]"
      >
        <MessageCircle size={16} />
        <span className="hidden sm:inline">Beta Feedback</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[100vw] h-[100dvh] sm:h-auto sm:max-w-md rounded-none sm:rounded-lg p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Share Your Feedback
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 text-center">
              <p className="text-base font-medium text-foreground">
                Thanks for your feedback!
              </p>
              <p className="text-sm text-[#878787] mt-1">
                Your input helps us improve VendCFO.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* What's working well */}
              <div>
                <label
                  htmlFor="feedback-positive"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  What&apos;s working well?
                </label>
                <textarea
                  id="feedback-positive"
                  value={positive}
                  onChange={(e) => setPositive(e.target.value)}
                  placeholder="Features you enjoy, things that save you time..."
                  rows={2}
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-foreground placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                />
              </div>

              {/* What's frustrating */}
              <div>
                <label
                  htmlFor="feedback-negative"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  What&apos;s frustrating or broken?
                </label>
                <textarea
                  id="feedback-negative"
                  value={negative}
                  onChange={(e) => setNegative(e.target.value)}
                  placeholder="Bugs, confusing flows, missing data..."
                  rows={2}
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-foreground placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                />
              </div>

              {/* Feature requests */}
              <div>
                <label
                  htmlFor="feedback-features"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Any features you wish existed?
                </label>
                <textarea
                  id="feedback-features"
                  value={featureRequests}
                  onChange={(e) => setFeatureRequests(e.target.value)}
                  placeholder="Integrations, reports, automations..."
                  rows={2}
                  className="w-full rounded-md border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-foreground placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                />
              </div>

              {/* Star rating */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Overall rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoveredStar || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          size={24}
                          className={
                            isFilled ? "text-[#f59e0b]" : "text-[#d0d0d0]"
                          }
                          fill={isFilled ? "#f59e0b" : "none"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || (!positive && !negative && !featureRequests && !rating)}
                className="w-full min-h-[44px]"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

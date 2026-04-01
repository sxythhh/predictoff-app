"use client";

import { useState, useCallback } from "react";

const STEPS = [
  {
    title: "Welcome to Waliet",
    description: "The decentralized sports betting platform. Browse live and upcoming events, pick your outcomes, and place bets — all on-chain.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="19" stroke="var(--accent)" strokeWidth="2"/>
        <path d="M14 20L18 24L26 16" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: "Pick Your Odds",
    description: "Tap any odds button on a game card to add it to your betslip. Combine multiple picks into a combo (parlay) for bigger payouts.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="4" y="8" width="32" height="24" rx="4" stroke="var(--accent)" strokeWidth="2"/>
        <path d="M12 18H18M22 18H28M12 24H16M20 24H28" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: "Place & Track",
    description: "Set your stake, place your bet, and track results in real-time. Cash out early or claim your winnings when the event settles.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" stroke="var(--accent)" strokeWidth="2"/>
        <path d="M20 12V20L26 24" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export function WelcomeModal({ open, onClose, onSignUp }: { open: boolean; onClose: () => void; onSignUp?: () => void }) {
  const [step, setStep] = useState(0);

  const dismiss = useCallback(() => {
    onClose();
    setStep(0);
  }, [onClose]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
      onSignUp?.();
    }
  }, [step, dismiss, onSignUp]);

  if (!open) return null;

  const current = STEPS[step];

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" onClick={dismiss} />

        {/* Modal */}
        <div className="relative w-full max-w-[380px] bg-bg-modal rounded-2xl border border-border-subtle overflow-hidden">
          {/* Skip button */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-[12px] text-text-muted hover:text-text-secondary transition-colors z-10 cursor-pointer"
          >
            Skip
          </button>

          {/* Content */}
          <div className="flex flex-col items-center px-8 pt-10 pb-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-accent-muted flex items-center justify-center mb-5">
              {current.icon}
            </div>

            {/* Title */}
            <h2 className="text-[18px] font-bold text-text-primary text-center mb-2">
              {current.title}
            </h2>

            {/* Description */}
            <p className="text-[14px] text-text-secondary text-center leading-relaxed mb-8">
              {current.description}
            </p>

            {/* Step indicators */}
            <div className="flex items-center gap-1.5 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-accent" : i < step ? "w-1.5 bg-accent/40" : "w-1.5 bg-border-primary"
                  }`}
                />
              ))}
            </div>

            {/* Action button */}
            <button
              onClick={next}
              className="w-full h-11 rounded-lg text-[14px] font-semibold bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover transition-[transform,colors] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.97] cursor-pointer"
            >
              {step === STEPS.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
  );
}

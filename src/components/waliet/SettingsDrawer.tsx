"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAccount, useDisconnect } from "wagmi";
import { useChain } from "@azuro-org/sdk";

import { useTheme } from "@/components/ui/theme";

interface SettingsDrawerProps {
  onClose: () => void;
  open: boolean;
}

const navItems = [
  { id: "account", label: "Account", icon: UserIcon },
  { id: "preferences", label: "Preferences", icon: SettingsIcon },
  { id: "about", label: "About Waliet", icon: InfoIcon },
];

function UserIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 17.5C3 14.5 6 12.5 10 12.5C14 12.5 17 14.5 17 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8.5 2.5L8 4.5L6 5.5L4 4.5L2.5 6.5L4 8L3.5 10L4 12L2.5 13.5L4 15.5L6 14.5L8 15.5L8.5 17.5H11.5L12 15.5L14 14.5L16 15.5L17.5 13.5L16 12L16.5 10L16 8L17.5 6.5L16 4.5L14 5.5L12 4.5L11.5 2.5H8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}


function InfoIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 9V14M10 7V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function SettingsDrawer({ onClose, open }: SettingsDrawerProps) {
  const [activeSection, setActiveSection] = useState("account");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      >
        <div className="group/close flex h-[20vh] items-end justify-center overflow-hidden pb-3 cursor-pointer">
          <div className="flex translate-y-[calc(100%+12px)] items-center gap-2 rounded-xl bg-bg-card border border-border-input px-4 py-2.5 transition-transform duration-200 ease-out group-hover/close:translate-y-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M8 13L4 9M8 13L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium text-text-primary">ESC to close</span>
          </div>
        </div>
      </div>

      {/* Drawer panel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex h-[80vh] flex-col rounded-t-2xl bg-bg-modal border-t border-border-input transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle px-5">
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-text-muted" />
            <span className="text-[14px] font-semibold text-text-secondary">Settings</span>
          </div>
          <button
            className="flex size-8 items-center justify-center rounded-lg hover:bg-bg-input transition-colors"
            onClick={onClose}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Nav — horizontal scrollable on mobile, vertical sidebar on desktop */}
          <div className="flex w-full lg:w-[260px] shrink-0 flex-row lg:flex-col justify-start lg:justify-between border-b lg:border-b-0 lg:border-r border-border-subtle overflow-x-auto lg:overflow-y-auto p-2 lg:p-4 gap-1">
            <div className="flex flex-row lg:flex-col gap-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    className={`flex h-9 items-center gap-2.5 rounded-lg px-3 whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "bg-bg-active text-text-primary"
                        : "text-text-secondary hover:bg-border-subtle hover:text-text-secondary"
                    }`}
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    type="button"
                  >
                    <item.icon className={isActive ? "text-text-primary" : "text-text-muted"} />
                    <span className="text-[13px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:block">
              <DisconnectButton />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeSection === "account" && <AccountSection />}
            {activeSection === "preferences" && <PreferencesSection />}

            {activeSection === "about" && <AboutSection />}
            <div className="lg:hidden px-8 pb-8">
              <DisconnectButton />
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function DisconnectButton() {
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();

  if (!isConnected) return null;

  return (
    <button
      className="flex h-9 items-center justify-center gap-2 rounded-lg bg-border-subtle hover:bg-red-500/10 hover:text-red-400 text-text-muted transition-colors"
      onClick={() => disconnect()}
      type="button"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6.75 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12.75L15.75 9L12 5.25M15.75 9H6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[13px] font-medium">Disconnect</span>
    </button>
  );
}

function AccountSection() {
  const { address, isConnected } = useAccount();
  const { betToken, appChain } = useChain();

  return (
    <div className="p-8 max-w-[600px]">
      <h2 className="text-[18px] font-semibold text-text-primary mb-6">Account</h2>

      {isConnected && address ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text-muted">Wallet Address</span>
            <div className="flex items-center gap-2 bg-border-subtle rounded-lg px-3 py-2.5 border border-border-subtle">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-[#1a8a4a]" />
              <span className="text-[13px] font-mono text-text-primary/80">{address}</span>
              <button
                onClick={() => navigator.clipboard.writeText(address)}
                className="ml-auto text-text-muted hover:text-text-secondary transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 11V3.5C3 2.67 3.67 2 4.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-muted">Network</span>
              <div className="bg-border-subtle rounded-lg px-3 py-2.5 border border-border-subtle text-[13px] text-text-primary/80">
                {appChain.name}
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-muted">Bet Token</span>
              <div className="bg-border-subtle rounded-lg px-3 py-2.5 border border-border-subtle text-[13px] text-text-primary/80">
                {betToken?.symbol ?? "—"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-muted text-[14px]">No wallet connected</p>
          <p className="text-text-muted text-[12px] mt-1">Connect a wallet to see account details</p>
        </div>
      )}
    </div>
  );
}

function PreferencesSection() {
  const [oddsFormat, setOddsFormat] = useState("decimal");
  const { preference, setPreference } = useTheme();

  const themeOptions = [
    { id: "light" as const, label: "Light", image: "/images/theme-light.png" },
    { id: "dark" as const, label: "Dark", image: "/images/theme-dark.png" },
    { id: "system" as const, label: "Follow System", image: "/images/theme-system.png" },
  ];

  return (
    <div className="p-8 max-w-[600px]">
      <h2 className="text-[18px] font-semibold text-text-primary mb-6">Preferences</h2>

      <div className="flex flex-col gap-5">
        {/* Appearance */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-medium text-text-muted">Appearance</span>
          <div className="flex gap-6">
            {themeOptions.map((opt) => {
              const isActive = preference === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPreference(opt.id)}
                  className="flex flex-col items-center gap-2 group"
                  type="button"
                >
                  <div
                    className={`w-[90px] h-[60px] rounded-[10px] overflow-hidden transition-all ${
                      isActive
                        ? "ring-2 ring-green-500"
                        : "ring-1 ring-border-subtle hover:ring-border-input"
                    }`}
                  >
                    <img
                      src={opt.image}
                      alt={opt.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-[13px] transition-colors ${
                      isActive ? "text-text-primary" : "text-text-muted"
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Odds Format */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-text-muted">Odds Format</span>
          <div className="flex gap-2">
            {["decimal", "fractional", "american"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setOddsFormat(fmt)}
                className={`flex-1 h-9 rounded-lg text-[13px] font-medium capitalize transition-colors ${
                  oddsFormat === fmt
                    ? "bg-accent-muted text-accent ring-1 ring-accent"
                    : "bg-border-subtle text-text-secondary hover:bg-bg-input"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-[13px] font-medium text-text-primary">Quick Bet</span>
            <p className="text-[12px] text-text-muted mt-0.5">Click odds to place instant bets</p>
          </div>
          <div className="w-10 h-6 rounded-full bg-bg-active relative cursor-pointer">
            <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-text-muted transition-transform" />
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-[13px] font-medium text-text-primary">Bet Confirmation</span>
            <p className="text-[12px] text-text-muted mt-0.5">Show confirmation before placing bets</p>
          </div>
          <div className="w-10 h-6 rounded-full bg-accent relative cursor-pointer">
            <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}


function AboutSection() {
  return (
    <div className="p-8 max-w-[600px]">
      <h2 className="text-[18px] font-semibold text-text-primary mb-6">About Waliet</h2>

      <div className="flex flex-col gap-4">
        <p className="text-[14px] text-text-secondary leading-relaxed">
          Waliet is a decentralized sports betting platform built on the Azuro protocol.
          Your bets are transparent, your funds stay under your control, and there&apos;s no middleman.
        </p>

        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] text-text-muted">Protocol</span>
            <span className="text-[13px] text-text-secondary">Azuro v3</span>
          </div>
          <div className="h-px bg-border-subtle" />
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] text-text-muted">Version</span>
            <span className="text-[13px] text-text-secondary">0.1.0-beta</span>
          </div>
          <div className="h-px bg-border-subtle" />
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] text-text-muted">SDK</span>
            <span className="text-[13px] text-text-secondary">@azuro-org/sdk v7</span>
          </div>
        </div>
      </div>
    </div>
  );
}

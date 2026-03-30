"use client";
import { useChain } from "@azuro-org/sdk";
import { useState } from "react";
import { polygon, gnosis, chiliz, base, polygonAmoy, baseSepolia } from "wagmi/chains";

type ChainEntry = {
  chain: { id: number; name: string };
  name: string;
  icon: string;
  token: string;
  testnet?: boolean;
};

const CHAINS: ChainEntry[] = [
  { chain: polygon, name: "Polygon", icon: "\u{1F7E3}", token: "USDT" },
  { chain: gnosis, name: "Gnosis", icon: "\u{1F7E2}", token: "xDAI" },
  { chain: chiliz, name: "Chiliz", icon: "\u{1F336}\uFE0F", token: "CHZ" },
  { chain: base, name: "Base", icon: "\u{1F535}", token: "WETH" },
  { chain: polygonAmoy, name: "Amoy Testnet", icon: "\u{1F9EA}", token: "USDT", testnet: true },
  { chain: baseSepolia, name: "Base Sepolia", icon: "\u{1F9EA}", token: "WETH", testnet: true },
];

export function ChainSwitcher() {
  const { appChain, setAppChainId } = useChain();
  const [open, setOpen] = useState(false);
  const current = CHAINS.find((c) => c.chain.id === appChain.id) ?? CHAINS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 h-9 px-3 rounded-lg border text-[13px] font-medium hover:bg-bg-active transition-colors ${
          current.testnet
            ? "bg-yellow-500/[0.08] border-yellow-500/20 text-yellow-300"
            : "bg-bg-input border-border-input text-text-primary"
        }`}
      >
        <span>{current.icon}</span>
        <span>{current.name}</span>
        {current.testnet && (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
            Test
          </span>
        )}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-50 w-52 rounded-xl bg-bg-card border border-border-input overflow-hidden shadow-xl">
            {/* Mainnet chains */}
            {CHAINS.filter((c) => !c.testnet).map((c) => (
              <button
                key={c.chain.id}
                onClick={() => {
                  setAppChainId(c.chain.id as any);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  c.chain.id === appChain.id
                    ? "bg-bg-active text-text-primary"
                    : "text-text-secondary hover:bg-border-subtle hover:text-text-primary"
                }`}
              >
                <span>{c.icon}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-[11px] text-text-muted">{c.token}</span>
                {c.chain.id === appChain.id && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="#ababfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
            {/* Separator */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-border-subtle">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-500/60">Testnets</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            {/* Testnet chains */}
            {CHAINS.filter((c) => c.testnet).map((c) => (
              <button
                key={c.chain.id}
                onClick={() => {
                  setAppChainId(c.chain.id as any);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  c.chain.id === appChain.id
                    ? "bg-yellow-500/[0.08] text-yellow-300"
                    : "text-text-muted hover:bg-border-subtle hover:text-text-secondary"
                }`}
              >
                <span>{c.icon}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-[11px] text-text-muted">{c.token}</span>
                {c.chain.id === appChain.id && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

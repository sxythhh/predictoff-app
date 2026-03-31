"use client";

import "@/lib/patch-websocket";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { http, createConfig, WagmiProvider } from "wagmi";
import { polygon, polygonAmoy, gnosis, chiliz, base, baseSepolia } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { AzuroSDKProvider, LiveProvider } from "@azuro-org/sdk";
import { type Address } from "viem";
import { ToastProvider } from "./Toast";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/ui/theme";
import { ConnectionStatus } from "./ConnectionStatus";
import { OddsFormatProvider } from "./OddsFormatContext";

const AFFILIATE_ADDRESS =
  (process.env.NEXT_PUBLIC_AFFILIATE_ADDRESS as Address) ??
  "0x0000000000000000000000000000000000000000";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

const IS_TESTNET = process.env.NEXT_PUBLIC_TESTNET === "true";
const DEFAULT_CHAIN = IS_TESTNET ? polygonAmoy : polygon;

// Only load WalletConnect connector if user has a previous session (saves ~50KB on initial load)
let wcConnector: ReturnType<typeof import("wagmi/connectors").walletConnect> | undefined;
if (typeof window !== "undefined" && WC_PROJECT_ID) {
  try {
    const stored = localStorage.getItem("wagmi.store");
    const hasWCSession = stored?.includes("walletConnect");
    if (hasWCSession) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { walletConnect } = require("wagmi/connectors") as typeof import("wagmi/connectors");
      wcConnector = walletConnect({ projectId: WC_PROJECT_ID, showQrModal: false });
    }
  } catch {}
}

const wagmiConfig = createConfig({
  chains: IS_TESTNET
    ? [polygonAmoy, baseSepolia]
    : [polygon, gnosis, chiliz, base, polygonAmoy, baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Waliet" }),
    ...(wcConnector ? [wcConnector] : []),
  ],
  transports: {
    [polygon.id]: http("https://polygon-bor-rpc.publicnode.com"),
    [gnosis.id]: http("https://gnosis-rpc.publicnode.com"),
    [chiliz.id]: http("https://chiliz-rpc.publicnode.com"),
    [base.id]: http("https://base-rpc.publicnode.com"),
    [polygonAmoy.id]: http("https://polygon-amoy-bor-rpc.publicnode.com"),
    [baseSepolia.id]: http("https://base-sepolia-rpc.publicnode.com"),
  },
  ssr: true,
});

export function WalietProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AzuroSDKProvider
          initialChainId={DEFAULT_CHAIN.id}
          affiliate={AFFILIATE_ADDRESS}
        >
          <LiveProvider initialLiveState={false}>
            <AuthProvider>
              <ThemeProvider>
                <OddsFormatProvider>
                <ToastProvider>
                  <ConnectionStatus />
                  {children}
                </ToastProvider>
                </OddsFormatProvider>
              </ThemeProvider>
            </AuthProvider>
          </LiveProvider>
        </AzuroSDKProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

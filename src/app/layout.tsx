import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { WalietProviders } from "@/components/waliet/WalietProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Waliet — Decentralized Sports Betting",
  description: "Bet on sports with crypto. No KYC, non-custodial, powered by Azuro protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark h-full antialiased ${inter.variable} ${ibmPlexSans.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg-page text-text-primary">
        <WalietProviders>
          {children}
        </WalietProviders>
      </body>
    </html>
  );
}

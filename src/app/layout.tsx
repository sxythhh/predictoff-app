import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Web3Boundary } from "@/components/waliet/Web3Boundary";
import { GlobalMobileNav } from "@/components/waliet/MobileNav";

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

// Raw inline splash HTML — this is NOT a React component.
// It's a string that gets injected directly into the HTML response
// and paints BEFORE any JavaScript downloads or executes.
const SPLASH_HTML = `
<script>if(!sessionStorage.getItem('w-splash')){sessionStorage.setItem('w-splash','1');document.write(\`
<div id="splash" style="position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a1a0f">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 735 735" width="72" height="72" style="animation:sf 1.5s ease-in-out infinite">
    <defs>
      <clipPath id="z1"><path d="M57 77v611c0 14 11 26 26 26h125c14 0 25-12 25-26V77c0-14-11-26-25-26H83c-15 0-26 12-26 26z"/></clipPath>
      <clipPath id="z2"><path d="M271 78v612c0 14 12 25 26 25h125c14 0 25-11 25-25V78c0-14-11-26-25-26H297c-14 0-26 12-26 26z"/></clipPath>
      <clipPath id="z3"><path d="M485 79v612c0 14 12 25 26 25h125c14 0 26-11 26-25V79c0-14-12-26-26-26H511c-14 0-26 12-26 26z"/></clipPath>
    </defs>
    <g clip-path="url(#z1)"><path fill="#29b764" d="M316 715L-1 393V-2h317v717"/></g>
    <g clip-path="url(#z2)"><path fill="#29b764" d="M531 715L270 393V-2h261v717"/></g>
    <g clip-path="url(#z3)"><path fill="#29b764" d="M745 715L484 393V-2h261v717"/></g>
  </svg>
  <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;margin-top:16px;font-family:system-ui,sans-serif">Waliet</span>
  <div style="width:40px;height:3px;border-radius:2px;margin-top:24px;background:rgba(41,183,100,0.2);overflow:hidden">
    <div style="width:100%;height:100%;background:#29b764;animation:sb 1.2s ease-in-out infinite;transform-origin:left"></div>
  </div>
</div>
<style>@keyframes sf{0%,100%{opacity:.7}50%{opacity:1}}@keyframes sb{0%{transform:scaleX(0)}50%{transform:scaleX(1)}100%{transform:scaleX(0)}}</style>
\`)}</script>
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark h-full antialiased ${inter.variable} ${ibmPlexSans.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preload" href="/images/waliet-logo.png" as="image" />
      </head>
      <body className="min-h-full flex flex-col bg-bg-page text-text-primary">
        {/* Inline splash — renders as raw HTML before ANY JS loads */}
        <div dangerouslySetInnerHTML={{ __html: SPLASH_HTML }} suppressHydrationWarning />

        {/* Prefetch sports data in parallel with JS bundle download */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.__PREFETCH_SPORTS = fetch('/api/prefetch-sports').then(r => r.json()).catch(() => null);
        `}} suppressHydrationWarning />

        <Web3Boundary>
          {children}
          <GlobalMobileNav />
        </Web3Boundary>
      </body>
    </html>
  );
}

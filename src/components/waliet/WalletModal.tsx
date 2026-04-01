"use client";

import { useEffect, useCallback, useState } from "react";
import { useConnect, useAccount, useDisconnect, useBalance } from "wagmi";
import { useChain, useBetTokenBalance } from "@azuro-org/sdk";
import { useAuth } from "@/hooks/useAuth";
import { FundWalletModal } from "./FundWalletModal";

/* ─── Wallet icons (32×32) ─── */
function MetaMaskIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <g clipPath="url(#mm)">
        <path d="M29.9002 30.3669L23.0082 28.3148L17.8109 31.4218L14.1846 31.4202L8.98411 28.3148L2.09532 30.3669L0 23.2929L2.09555 15.4418L0 8.80408L2.09555 0.577148L12.8597 7.00825H19.1358L29.9002 0.577148L31.9957 8.80408L29.9002 15.4418L31.9957 23.2929L29.9002 30.3669Z" fill="#FF5C16"/>
        <path d="M2.09668 0.577148L12.8611 7.01275L12.4331 11.4294L2.09668 0.577148ZM8.98569 23.2958L13.7219 26.9037L8.98569 28.3146V23.2958ZM13.3433 17.331L12.4331 11.4326L6.60643 15.4436L6.60327 15.442V15.445L6.6213 19.5737L8.98412 17.3312L13.3433 17.331ZM29.8999 0.577148L19.1356 7.01275L19.5621 11.4294L29.8999 0.577148ZM23.0112 23.2958L18.2747 26.9037L23.0112 28.3146V23.2958ZM25.392 15.4448V15.4418L25.3907 15.4434L19.5637 11.4326L18.6535 17.331H23.0109L25.3753 19.5732L25.392 15.4448Z" fill="#FF5C16"/>
        <path d="M8.98434 28.3146L2.09555 30.3666L0 23.2958H8.98434V28.3146ZM13.342 17.3293L14.6578 25.8567L12.834 21.1153L6.61859 19.5732L8.98276 17.3296L13.342 17.3293ZM23.0112 28.3146L29.9002 30.3666L31.9957 23.2955H23.0112C23.0112 23.2958 23.0112 28.3146 23.0112 28.3146ZM18.6537 17.3293L17.3379 25.8567L19.1615 21.1153L25.3774 19.5732L23.0116 17.3296L18.6537 17.3293Z" fill="#E34807"/>
        <path d="M0 23.2929L2.09555 15.4419H6.60192L6.61837 19.5719L12.8345 21.114L14.658 25.8552L13.7206 26.8992L8.98434 23.2913H0V23.2929ZM31.9957 23.2929L29.9002 15.4419H25.3936L25.3771 19.5719L19.1615 21.114L17.3377 25.8552L18.2749 26.8992L23.0114 23.2913H31.9957V23.2929ZM19.1358 7.0083H12.8597L12.4336 11.425L14.6583 25.8504H17.3379L19.5639 11.425L19.1358 7.0083Z" fill="#FF8D5D"/>
        <path d="M2.09555 0.577148L0 8.80408L2.09555 15.4418H6.60192L12.4318 11.4297L2.09555 0.577148ZM12.0397 19.0421H9.9982L8.88676 20.1316L12.8358 21.1106L12.0397 19.0405V19.0421ZM29.9002 0.577148L31.9957 8.80408L29.9002 15.4418H25.3936L19.5639 11.4297L29.9002 0.577148ZM19.959 19.0421H22.0034L23.1148 20.133L19.1612 21.1139L19.959 19.0405V19.0421ZM17.8094 28.6076L18.2752 26.9023L17.3377 25.8583H14.656L13.7188 26.9023L14.1843 28.6076" fill="#661800"/>
        <path d="M17.8091 28.6074V31.4232H14.1846V28.6074H17.8091Z" fill="#C0C4CD"/>
        <path d="M8.98584 28.3116L14.1876 31.4214V28.6056L13.7218 26.9006L8.98584 28.3116ZM23.0113 28.3116L17.8093 31.4214V28.6056L18.2751 26.9006L23.0113 28.3116Z" fill="#E7EBF6"/>
      </g>
      <defs><clipPath id="mm"><rect width="32" height="32" fill="white"/></clipPath></defs>
    </svg>
  );
}

function PhantomIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8.8" fill="#AB9FF2"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M13.7243 20.753C12.434 22.6678 10.2719 25.091 7.39491 25.091C6.03487 25.091 4.72709 24.5489 4.72705 22.1936C4.72694 16.1951 13.1836 6.90929 21.0301 6.90918C25.4937 6.90911 27.2725 9.90823 27.2725 13.3141C27.2725 17.6858 24.3431 22.6846 21.4313 22.6846C20.5072 22.6846 20.0539 22.1932 20.0539 21.4139C20.0539 21.2106 20.0886 20.9902 20.1585 20.753C19.1645 22.3965 17.2465 23.9219 15.4505 23.9219C14.1428 23.9219 13.4803 23.1253 13.4803 22.0069C13.4803 21.6002 13.5674 21.1767 13.7243 20.753ZM19.5484 11.5213C18.8381 11.5226 18.3539 12.1069 18.3554 12.9406C18.3569 13.7743 18.8433 14.3737 19.5536 14.3725C20.2467 14.3713 20.7307 13.7702 20.7292 12.9365C20.7276 12.1029 20.2415 11.5202 19.5484 11.5213ZM23.3159 11.5174C22.6056 11.5186 22.1214 12.103 22.1229 12.9366C22.1245 13.7703 22.6106 14.3697 23.3211 14.3685C24.0142 14.3673 24.4982 13.7662 24.4967 12.9326C24.4951 12.0989 24.009 11.5162 23.3159 11.5174Z" fill="white"/>
    </svg>
  );
}

function CoinbaseIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <g clipPath="url(#cb)">
        <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#0052FF"/>
        <path d="M23.36 0H8.64C3.86826 0 0 3.86826 0 8.64V23.36C0 28.1317 3.86826 32 8.64 32H23.36C28.1317 32 32 28.1317 32 23.36V8.64C32 3.86826 28.1317 0 23.36 0Z" fill="#0052FF"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M16.0003 27.2C22.1859 27.2 27.2003 22.1856 27.2003 16C27.2003 9.81447 22.1859 4.80005 16.0003 4.80005C9.81471 4.80005 4.80029 9.81447 4.80029 16C4.80029 22.1856 9.81471 27.2 16.0003 27.2ZM13.2003 12.3429C12.7269 12.3429 12.3432 12.7267 12.3432 13.2V18.8C12.3432 19.2735 12.7269 19.6572 13.2003 19.6572H18.8003C19.2737 19.6572 19.6574 19.2735 19.6574 18.8V13.2C19.6574 12.7267 19.2737 12.3429 18.8003 12.3429H13.2003Z" fill="white"/>
      </g>
      <defs><clipPath id="cb"><rect width="32" height="32" fill="white"/></clipPath></defs>
    </svg>
  );
}

function WalletConnectIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <path d="M12.5845 15.5606C17.2323 10.9128 24.7677 10.9128 29.4154 15.5606L29.9748 16.1199C30.2072 16.3523 30.2072 16.7291 29.9748 16.9614L28.0614 18.8749C27.9451 18.991 27.7568 18.991 27.6406 18.8749L26.8709 18.1051C23.6285 14.8627 18.3715 14.8627 15.1291 18.1051L14.3049 18.9293C14.1887 19.0456 14.0002 19.0456 13.8841 18.9293L11.9706 17.016C11.7382 16.7837 11.7382 16.4069 11.9706 16.1745L12.5845 15.5606ZM33.3727 19.5177L35.0757 21.2208C35.308 21.4532 35.308 21.83 35.0757 22.0623L27.3968 29.7412C27.1643 29.9738 26.7876 29.9738 26.5552 29.7412L21.1053 24.2913C21.0472 24.2333 20.9529 24.2333 20.8949 24.2913L15.4449 29.7412C15.2126 29.9738 14.8358 29.9738 14.6034 29.7413L6.92428 22.0622C6.69191 21.8298 6.69191 21.453 6.92428 21.2206L8.62728 19.5177C8.85967 19.2852 9.23645 19.2852 9.46883 19.5177L14.919 24.9678C14.977 25.0258 15.0712 25.0258 15.1294 24.9678L20.5791 19.5177C20.8114 19.2852 21.1883 19.2852 21.4207 19.5177L26.8709 24.9678C26.9289 25.0258 27.0231 25.0258 27.0811 24.9678L32.5311 19.5177C32.7636 19.2853 33.1404 19.2853 33.3727 19.5177Z" fill="#3B99FC"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-btn-primary-text">
      <path d="M14.72 8.15905C14.72 7.66255 14.6755 7.18555 14.5925 6.72705H8V9.43805H11.7675C11.602 10.3101 11.1055 11.0481 10.361 11.5446V13.3071H12.633C13.9565 12.0851 14.72 10.2906 14.72 8.15905Z" fill="currentColor"/>
      <path d="M7.99999 14.9999C9.88999 14.9999 11.4745 14.3764 12.6325 13.3074L10.3605 11.5449C9.73699 11.9649 8.94149 12.2194 7.99949 12.2194C6.17949 12.2194 4.63299 10.9914 4.07949 9.33691L2.72099 10.3819L1.75049 11.1444C2.90249 13.4289 5.26299 15.0009 7.99949 15.0009L7.99999 14.9999Z" fill="currentColor"/>
      <path d="M4.08 9.33005C3.94 8.91005 3.8575 8.46455 3.8575 8.00005C3.8575 7.53555 3.94 7.09005 4.08 6.67005V4.86255H1.751C1.2735 5.80455 1 6.86705 1 8.00005C1 9.13305 1.2735 10.1955 1.751 11.1375H3.417L4.08 9.33005Z" fill="currentColor"/>
      <path d="M7.99998 3.7875C9.03098 3.7875 9.94748 4.144 10.679 4.831L12.6835 2.8265C11.468 1.694 9.88998 1 7.99998 1C5.26348 1 2.90248 2.572 1.75098 4.8625L4.07998 6.67C4.63348 5.0155 6.17998 3.7875 7.99998 3.7875Z" fill="currentColor"/>
    </svg>
  );
}

/* ─── Connected state in header ─── */
export function WalletButton({ onClick }: { onClick: () => void }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { betToken } = useChain();
  const { data: tokenBalance } = useBetTokenBalance();
  const { data: nativeBalance } = useBalance({ address });

  if (!isConnected || !address) {
    return (
      <button
        onClick={onClick}
        className="h-9 px-3 flex items-center rounded-xl bg-white text-bg-page hover:bg-white/90 active:scale-[0.97] transition-all"
      >
        <span className="text-sm font-semibold">SIGN IN</span>
        <span className="text-sm font-semibold text-text-secondary mx-1.5">|</span>
        <span className="text-sm font-semibold">JOIN</span>
      </button>
    );
  }

  const bal = tokenBalance?.balance
    ? Number(tokenBalance.balance).toFixed(2)
    : nativeBalance
      ? Number(nativeBalance.formatted).toFixed(4)
      : null;
  const symbol = betToken?.symbol ?? nativeBalance?.symbol ?? "";

  return (
    <div className="flex items-center gap-2">
      {bal && (
        <span className="text-[13px] font-semibold text-text-secondary bg-bg-input px-3 py-1.5 rounded-lg tabular-nums">
          {bal} {symbol}
        </span>
      )}
      <button
        onClick={onClick}
        className="flex items-center gap-2 h-9 px-3 rounded-xl bg-bg-active border border-border-input hover:bg-bg-active transition-colors"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent-hover" />
        <span className="text-[13px] font-semibold text-text-primary">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </button>
    </div>
  );
}

/* ─── Modal ─── */
export function WalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { connectors, connect } = useConnect();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { betToken } = useChain();
  const { data: tokenBalance } = useBetTokenBalance();
  const { signInWithSocial, refreshUser } = useAuth();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Close modal on successful NEW connect
  const [connectedOnOpen, setConnectedOnOpen] = useState(isConnected);
  useEffect(() => {
    if (open) setConnectedOnOpen(isConnected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (open && isConnected && !connectedOnOpen) onClose();
  }, [isConnected, connectedOnOpen, open, onClose]);

  // ESC to close + lock all scroll
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    // Also lock any overflow-y-auto containers (like <main>)
    const scrollables = document.querySelectorAll<HTMLElement>('[class*="overflow-y-auto"], [class*="overflow-auto"]');
    scrollables.forEach((el) => { el.dataset.prevOverflow = el.style.overflow; el.style.overflow = "hidden"; });
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      scrollables.forEach((el) => { el.style.overflow = el.dataset.prevOverflow ?? ""; delete el.dataset.prevOverflow; });
      document.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  const handleConnect = useCallback(
    (connectorId: string) => {
      const connector = connectors.find((c) => c.id === connectorId) ?? connectors[0];
      if (!connector) return;
      setConnectingId(connectorId);
      connect(
        { connector },
        {
          onSettled: () => setConnectingId(null),
        }
      );
    },
    [connectors, connect]
  );

  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEmailLogin = useCallback(async () => {
    if (!email.trim() || emailLoading) return;
    setEmailLoading(true);
    setEmailError(null);
    try {
      const { getMagic } = await import("@/lib/magic");
      const magic = getMagic();

      // Magic handles OTP UI — this blocks until user verifies
      await magic.auth.loginWithEmailOTP({ email: email.trim() });

      // Get DID token (cryptographically signed, verified server-side)
      const didToken = await magic.user.getIdToken();

      // Authenticate directly via Magic DID token (no SIWE needed)
      const res = await fetch("/api/auth/magic-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ didToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Authentication failed");
      }

      // Session cookie is set — refresh user state
      await refreshUser();

      // Connect Magic wallet to wagmi for transactions
      const magicProvider = magic.rpcProvider;
      if (magicProvider) {
        const originalProvider = (window as any).ethereum;
        (window as any).ethereum = magicProvider;
        const inj = connectors.find((c) => c.id === "injected");
        if (inj) {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 10_000); // 10s safety timeout
            connect({ connector: inj }, {
              onSettled: () => {
                clearTimeout(timeout);
                if (originalProvider) {
                  (window as any).ethereum = originalProvider;
                }
                resolve();
              },
            });
          });
        }
      }

      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (!msg.includes("user denied") && !msg.includes("cancelled")) {
        setEmailError(msg);
      }
      console.error("Magic login error:", err);
    } finally {
      setEmailLoading(false);
    }
  }, [email, emailLoading, connectors, connect, refreshUser, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[448px] mx-4 rounded-3xl p-6 bg-bg-modal border border-border-subtle" style={{ boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)" }}>

        {isConnected && address ? (
          /* ─── Connected view ─── */
          <div className="flex flex-col gap-[18px]">
            <h2 className="text-[20px] font-semibold text-text-primary">Account</h2>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-surface border border-border-subtle">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-sm">
                {address.slice(2, 4).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-text-primary">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </p>
                <p className="text-[12px] text-text-muted mt-0.5">Connected</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(address)}
                className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                title="Copy address"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 11V3.5C3 2.67 3.67 2 4.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Balance + Fund */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-surface border border-border-subtle">
              <div>
                <p className="text-[11px] text-text-muted">Balance</p>
                <p className="text-[16px] font-bold text-text-primary tabular-nums">
                  {tokenBalance?.balance ? Number(tokenBalance.balance).toFixed(2) : "0.00"}{" "}
                  <span className="text-[12px] text-text-muted font-medium">{betToken?.symbol ?? "—"}</span>
                </p>
              </div>
              <button
                onClick={() => setFundOpen(true)}
                className="h-9 px-4 rounded-lg bg-accent hover:bg-accent-hover text-btn-primary-text text-[13px] font-semibold transition-colors cursor-pointer"
              >
                Fund Wallet
              </button>
            </div>

            <button
              onClick={() => { disconnect(); onClose(); }}
              className="w-full h-11 rounded-[7.2px] bg-red-500/10 text-red-400 text-[14px] font-semibold hover:bg-red-500/20 active:scale-[0.97] transition-all border border-red-500/10 cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        ) : (
          /* ─── Connect view (Polymarket-style) ─── */
          <div className="flex flex-col gap-[18px]">
            {/* Logo + Title */}
            <img src="/images/waliet-logo.png" alt="Waliet" className="w-10 h-10 brightness-0 invert mx-auto" />
            <h2 className="text-[20px] font-semibold text-text-primary text-center">Welcome to Waliet</h2>

            {/* Continue with Google */}
            <button
              onClick={() => signInWithSocial("google")}
              className="w-full h-[52px] flex items-center justify-center gap-2.5 rounded-[7.2px] bg-accent hover:brightness-110 text-btn-primary-text text-[14px] font-semibold tracking-[-0.02em] border-t border-border-subtle transition-all active:scale-[0.97] cursor-pointer"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* OR divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-[14px] font-medium text-text-muted">OR</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Email input with inline Continue button */}
            <div className="relative flex items-center w-full h-14 rounded-[11.2px] border border-border-subtle focus-within:border-accent/50 transition-colors">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleEmailLogin(); }}
                placeholder="Email address"
                className="flex-1 h-full px-3 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none rounded-[11.2px]"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <button
                  onClick={handleEmailLogin}
                  disabled={!email.trim() || emailLoading}
                  className="h-9 px-4 rounded-[7.2px] bg-accent text-btn-primary-text text-[14px] font-medium tracking-[-0.09px] transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailLoading ? (
                    <span className="flex items-center justify-center w-full">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </span>
                  ) : "Continue"}
                </button>
              </div>
            </div>

            {/* Email error */}
            {emailError && (
              <p className="text-[12px] text-red-400 -mt-2">{emailError}</p>
            )}

            {/* Wallet buttons row */}
            <div className="flex gap-[18px]">
              {[
                { id: "injected", icon: <MetaMaskIcon />, connecting: connectingId === "injected" },
                { id: "phantom", icon: <PhantomIcon />, connecting: connectingId === "phantom" },
                { id: "coinbaseWalletSDK", icon: <CoinbaseIcon />, connecting: connectingId === "coinbaseWalletSDK" },
                { id: "walletConnect", icon: <WalletConnectIcon />, connecting: connectingId === "walletConnect" },
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleConnect(w.id)}
                  disabled={w.connecting}
                  className="flex-1 h-14 flex items-center justify-center rounded-[7.2px] bg-bg-hover hover:bg-bg-input border-t border-border-subtle transition-colors active:scale-[0.97] cursor-pointer disabled:opacity-50"
                >
                  {w.connecting ? (
                    <svg className="animate-spin h-5 w-5 text-text-muted" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    w.icon
                  )}
                </button>
              ))}
            </div>

            {/* Footer links */}
            <div className="flex items-center justify-center gap-1.5 text-[12px] text-text-muted">
              <span className="hover:text-text-primary hover:underline cursor-pointer">Terms</span>
              <span>&middot;</span>
              <span className="hover:text-text-primary hover:underline cursor-pointer">Privacy</span>
            </div>
          </div>
        )}
      </div>

      {/* Fund Wallet sub-modal */}
      <FundWalletModal open={fundOpen} onClose={() => setFundOpen(false)} />
    </div>
  );
}

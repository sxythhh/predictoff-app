"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useAccount, useSignMessage, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { SiweMessage } from "siwe";
import { AuthContext, type DbUser } from "@/hooks/useAuth";
import { applyReferral } from "@/hooks/useReferral";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { connectAsync } = useConnect();
  const [user, setUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionChecked = useRef(false);
  const signingIn = useRef(false);
  const lastSignedAddress = useRef<string | null>(null);

  // Check existing session on mount
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      const sessionUser = data.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        lastSignedAddress.current = sessionUser.walletAddress?.toLowerCase() ?? null;
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
      sessionChecked.current = true;
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Handle Magic OAuth redirect (after Google login redirects back)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    // Magic OAuth adds a `magic_credential` or `magic_oauth_request_id` param
    if (url.searchParams.has("magic_credential") || url.searchParams.has("magic_oauth_request_id")) {
      (async () => {
        try {
          const { getMagic } = await import("@/lib/magic");
          const magic = getMagic();
          const result = await (magic as any).oauth.getRedirectResult();
          const didToken = result.magic.idToken;

          // Authenticate via our Magic verify endpoint
          const res = await fetch("/api/auth/magic-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ didToken }),
          });

          if (res.ok) {
            await checkSession();
          }

          // Clean URL
          window.history.replaceState({}, "", "/");
        } catch (err) {
          console.error("Magic OAuth callback error:", err);
          window.history.replaceState({}, "", "/");
        }
      })();
    }
  }, [checkSession]);

  // Auto sign-in ONLY when:
  // 1. Session check completed (no race)
  // 2. Wallet is connected with an address
  // 3. No existing session for this address
  // 4. Not already in the middle of signing in
  useEffect(() => {
    if (!sessionChecked.current || isLoading) return;
    if (!isConnected || !address) return;
    if (signingIn.current) return;

    const addr = address.toLowerCase();

    // Already have a session for this address — don't prompt again
    if (user && user.walletAddress?.toLowerCase() === addr) return;

    // Already signed this address in this page lifecycle — don't prompt again
    if (lastSignedAddress.current === addr) return;

    // If user just authenticated via Magic (session exists but user state not yet updated),
    // skip SIWE and refresh instead
    if (!user) {
      // Guard: mark as signing in BEFORE the async fetch to prevent concurrent calls
      signingIn.current = true;

      fetch("/api/auth/session").then(r => r.json()).then(data => {
        if (data.user) {
          // Session exists — use it (don't re-prompt SIWE even if wallet differs)
          setUser(data.user);
          lastSignedAddress.current = data.user.walletAddress?.toLowerCase() ?? addr;
          signingIn.current = false;
        } else {
          // No session — trigger SIWE
          signingIn.current = false;
          signIn();
        }
      }).catch(() => {
        signingIn.current = false;
        signIn();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, isLoading, user]);

  // Auto sign-out only when wallet ACTIVELY disconnects
  // (not on initial page load when wagmi hasn't reconnected yet)
  const walletEverConnected = useRef(false);
  useEffect(() => {
    if (isConnected) walletEverConnected.current = true;
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected && user && walletEverConnected.current) {
      // Logout from Magic if user signed in via Magic
      if (user.authProvider === "magic") {
        import("@/lib/magic").then(({ getMagic }) => {
          try { getMagic().user.logout(); } catch {}
        }).catch(() => {});
      }

      fetch("/api/auth/logout", { method: "POST" }).then(() => {
        setUser(null);
        lastSignedAddress.current = null;
        walletEverConnected.current = false;
      });
    }
  }, [isConnected, user]);

  const signIn = useCallback(async () => {
    if (signingIn.current) return; // Prevent concurrent sign-in attempts
    signingIn.current = true;

    let walletAddress = address;
    let walletChainId = chainId;

    // Connect wallet first if not connected
    if (!walletAddress) {
      try {
        const result = await connectAsync({ connector: injected() });
        walletAddress = result.accounts[0];
        walletChainId = result.chainId;
      } catch (err) {
        console.error("Wallet connect failed:", err);
        signingIn.current = false;
        return;
      }
    }

    if (!walletAddress || !walletChainId) {
      signingIn.current = false;
      return;
    }

    try {
      // Get nonce
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address: walletAddress,
        statement: "Sign in to Waliet",
        uri: window.location.origin,
        version: "1",
        chainId: walletChainId,
        nonce,
      });

      const messageStr = message.prepareMessage();

      // Sign with wallet
      const signature = await signMessageAsync({ message: messageStr });

      // Verify on server
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageStr, signature }),
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        setUser(data.user);
        lastSignedAddress.current = walletAddress.toLowerCase();
        // Apply any stored referral code after sign-in
        applyReferral();
      }
    } catch (err) {
      console.error("Sign in failed:", err);
    } finally {
      signingIn.current = false;
    }
  }, [address, chainId, signMessageAsync, connectAsync]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const signInWithSocial = useCallback(
    (provider: "google" | "twitter" | "apple") => {
      // Navigate to the CSRF page first via an iframe to set the cookie,
      // then submit the form. Or simpler: use a two-step redirect.
      // The simplest reliable approach: navigate to a server endpoint that
      // handles the CSRF + redirect internally.
      window.location.href = `/api/oauth/social-redirect?provider=${provider}`;
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshUser: checkSession,
        signInWithSocial,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

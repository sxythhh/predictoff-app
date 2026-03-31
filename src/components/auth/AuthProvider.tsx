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

    // No session + wallet connected = new connection, trigger SIWE
    if (!user) {
      signIn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, isLoading, user]);

  // Auto sign-out if wallet disconnects
  useEffect(() => {
    if (!isConnected && user) {
      fetch("/api/auth/logout", { method: "POST" }).then(() => {
        setUser(null);
        lastSignedAddress.current = null;
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
    async (provider: "google" | "twitter" | "apple") => {
      // Fetch CSRF token from NextAuth, then POST to trigger OAuth flow
      try {
        const csrfRes = await fetch("/api/oauth/csrf");
        const { csrfToken } = await csrfRes.json();

        // Create a hidden form and submit it to trigger the OAuth redirect
        const form = document.createElement("form");
        form.method = "POST";
        form.action = `/api/oauth/signin/${provider}`;

        const csrfInput = document.createElement("input");
        csrfInput.type = "hidden";
        csrfInput.name = "csrfToken";
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        const callbackInput = document.createElement("input");
        callbackInput.type = "hidden";
        callbackInput.name = "callbackUrl";
        callbackInput.value = "/";
        form.appendChild(callbackInput);

        document.body.appendChild(form);
        form.submit();
      } catch (err) {
        console.error("Social sign-in failed:", err);
      }
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

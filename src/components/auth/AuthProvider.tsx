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
  const wasConnectedOnMount = useRef(isConnected);

  // Check existing session on mount
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Auto sign-in only on NEW wallet connections (not page reloads with existing session)
  useEffect(() => {
    // Skip if wallet was already connected when the page loaded — session check handles that
    if (wasConnectedOnMount.current) {
      wasConnectedOnMount.current = false;
      return;
    }
    // Wallet just connected fresh → trigger SIWE sign-in
    if (isConnected && address && !user && !isLoading) {
      signIn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, isLoading]);

  // Auto sign-out if wallet disconnects
  useEffect(() => {
    if (!isConnected && user) {
      fetch("/api/auth/logout", { method: "POST" }).then(() => setUser(null));
    }
  }, [isConnected, user]);

  const signIn = useCallback(async () => {
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
        return;
      }
    }

    if (!walletAddress || !walletChainId) return;

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
        // Apply any stored referral code after sign-in
        applyReferral();
      }
    } catch (err) {
      console.error("Sign in failed:", err);
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

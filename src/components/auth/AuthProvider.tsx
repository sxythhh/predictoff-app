"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useAccount, useSignMessage, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { SiweMessage } from "siwe";
import { AuthContext, type DbUser } from "@/hooks/useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { connectAsync } = useConnect();
  const [user, setUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        statement: "Sign in to PredictOff",
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
      }
    } catch (err) {
      console.error("Sign in failed:", err);
    }
  }, [address, chainId, signMessageAsync, connectAsync]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshUser: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

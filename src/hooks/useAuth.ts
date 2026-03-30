"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";

interface DbUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
}

interface AuthContextValue {
  user: DbUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };
export type { DbUser, AuthContextValue };

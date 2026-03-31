import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import Apple from "next-auth/providers/apple";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { generateEmbeddedWallet } from "./embedded-wallet";

export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/api/oauth",
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
    }),
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      const provider = account.provider; // "google" | "twitter" | "apple"
      const oauthId = account.providerAccountId;
      const email = user.email ?? undefined;

      // Look up existing user by provider+oauthId
      let dbUser = await prisma.user.findUnique({
        where: { authProvider_oauthId: { authProvider: provider, oauthId } },
      });

      if (!dbUser) {
        // Also check by email if available
        if (email) {
          dbUser = await prisma.user.findUnique({ where: { email } });
        }

        if (!dbUser) {
          // Create new user with embedded wallet
          const { address, encryptedKey } = generateEmbeddedWallet();
          dbUser = await prisma.user.create({
            data: {
              walletAddress: address,
              email: email ?? null,
              authProvider: provider,
              oauthId,
              embeddedWalletKey: encryptedKey,
              displayName: user.name ?? null,
              avatar: user.image ?? null,
            },
          });
        } else {
          // Link OAuth to existing email user
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { authProvider: provider, oauthId },
          });
        }
      }

      // Create a predictoff-session for unified auth
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.session.create({
        data: { userId: dbUser.id, token, expiresAt },
      });

      // Store token in user object so jwt callback can access it
      (user as any).sessionToken = token;
      (user as any).dbUserId = dbUser.id;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sessionToken = (user as any).sessionToken;
        token.dbUserId = (user as any).dbUserId;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose the predictoff session token in the NextAuth session
      if (token.sessionToken) {
        (session as any).sessionToken = token.sessionToken;
      }
      if (token.dbUserId) {
        (session as any).dbUserId = token.dbUserId;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After sign-in completes, redirect to our sync endpoint that sets the predictoff-session cookie.
      // External OAuth URLs (to Google, Twitter, Apple) won't start with baseUrl, so they pass through.
      if (url.startsWith(baseUrl) || url.startsWith("/")) {
        return `${baseUrl}/api/oauth/sync`;
      }
      return url;
    },
  },
});

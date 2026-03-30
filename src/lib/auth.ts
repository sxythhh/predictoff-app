import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const SESSION_COOKIE = "predictoff-session";

export async function getAuthUser(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };

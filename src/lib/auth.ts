import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName, verifySessionToken } from "@/lib/auth-core";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = verifySessionToken(cookies().get(authCookieName)?.value);
  if (!session) return null;

  const user = await prisma.appUser.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, status: true }
  });

  if (!user || user.status !== "ACTIVO") return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName, createResetToken, createSessionToken, hashPassword, hashResetToken, isSafeRedirect, sessionMaxAge, verifyPassword } from "@/lib/auth-core";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/services/email";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value ? String(value).trim() : "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function setAuthCookie(token: string) {
  cookies().set(authCookieName, token, {
    httpOnly: true,
    maxAge: sessionMaxAge(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

function clearAuthCookie() {
  cookies().delete(authCookieName);
}

export async function loginAction(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = normalizeEmail(textValue(formData, "email"));
  const password = textValue(formData, "password");
  const next = textValue(formData, "next");

  if (!email || !password) {
    return { error: "Ingresa correo y clave." };
  }

  const user = await prisma.appUser.findUnique({ where: { email } });

  if (!user || user.status !== "ACTIVO" || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Correo o clave incorrectos." };
  }

  await prisma.appUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  setAuthCookie(createSessionToken(user));
  redirect(isSafeRedirect(next) ? next : "/");
}

export async function logoutAction() {
  clearAuthCookie();
  redirect("/login?salida=1");
}

export async function requestPasswordResetAction(_prevState: { ok?: boolean; error?: string; resetUrl?: string } | undefined, formData: FormData) {
  const email = normalizeEmail(textValue(formData, "email"));
  if (!email) return { error: "Ingresa tu correo." };

  const user = await prisma.appUser.findUnique({ where: { email } });

  if (!user || user.status !== "ACTIVO") {
    return { ok: true };
  }

  const token = createResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + 45 * 60 * 1000)
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const resetUrl = `${appUrl.replace(/\/$/, "")}/recuperar-clave/nueva?token=${encodeURIComponent(token)}`;
  const delivery = await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

  return {
    ok: true,
    resetUrl: delivery.sent || process.env.NODE_ENV === "production" ? undefined : resetUrl
  };
}

export async function resetPasswordAction(_prevState: { ok?: boolean; error?: string } | undefined, formData: FormData) {
  const token = textValue(formData, "token");
  const password = textValue(formData, "password");
  const confirmPassword = textValue(formData, "confirmPassword");

  if (!token) return { error: "El enlace de recuperacion no es valido." };
  if (password.length < 8) return { error: "La nueva clave debe tener al menos 8 caracteres." };
  if (password !== confirmPassword) return { error: "Las claves no coinciden." };

  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    include: { user: true }
  });

  if (!reset || reset.usedAt || reset.expiresAt < new Date() || reset.user.status !== "ACTIVO") {
    return { error: "El enlace expiro o ya fue usado. Solicita uno nuevo." };
  }

  await prisma.$transaction([
    prisma.appUser.update({
      where: { id: reset.userId },
      data: { passwordHash: await hashPassword(password) }
    }),
    prisma.passwordResetToken.update({
      where: { id: reset.id },
      data: { usedAt: new Date() }
    })
  ]);

  clearAuthCookie();
  redirect("/login?clave=actualizada");
}

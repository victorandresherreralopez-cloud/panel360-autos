"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";
import { loginAction, requestPasswordResetAction, resetPasswordAction } from "@/lib/actions/auth";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? "Procesando..." : children}
    </button>
  );
}

export function LoginForm({
  next,
  message
}: {
  next?: string;
  message?: string;
}) {
  const [state, formAction] = useFormState(loginAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {message ? <p className="rounded-lg border border-signal/20 bg-signal/5 p-3 text-sm font-bold text-signal">{message}</p> : null}
      {state?.error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{state.error}</p> : null}

      <label className="grid gap-2 text-sm font-black text-ink">
        Correo
        <input className="input" name="email" type="email" autoComplete="email" placeholder="tu@correo.cl" required />
      </label>

      <label className="grid gap-2 text-sm font-black text-ink">
        Clave
        <input className="input" name="password" type="password" autoComplete="current-password" placeholder="Tu clave" required />
      </label>

      <SubmitButton>
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Entrar al sistema
      </SubmitButton>

      <Link href="/recuperar-clave" className="text-center text-sm font-black text-signal">
        Olvide mi clave
      </Link>
    </form>
  );
}

export function RequestPasswordResetForm() {
  const [state, formAction] = useFormState(requestPasswordResetAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{state.error}</p> : null}
      {state?.ok ? (
        <div className="rounded-lg border border-signal/20 bg-signal/5 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-ink">
            <Mail className="h-4 w-4 text-signal" aria-hidden="true" />
            Solicitud recibida
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-steel">
            Si el correo existe, se genero un enlace de recuperacion valido por 45 minutos.
          </p>
          {state.resetUrl ? (
            <Link href={state.resetUrl} className="btn btn-secondary mt-3 w-full">
              Abrir enlace local
            </Link>
          ) : null}
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-black text-ink">
        Correo de tu usuario
        <input className="input" name="email" type="email" autoComplete="email" placeholder="tu@correo.cl" required />
      </label>

      <SubmitButton>
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        Enviar enlace de recuperacion
      </SubmitButton>

      <Link href="/login" className="text-center text-sm font-black text-signal">
        Volver al login
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(resetPasswordAction, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      {state?.error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{state.error}</p> : null}

      <label className="grid gap-2 text-sm font-black text-ink">
        Nueva clave
        <input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>

      <label className="grid gap-2 text-sm font-black text-ink">
        Confirmar clave
        <input className="input" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
      </label>

      <SubmitButton>
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Cambiar clave
      </SubmitButton>
    </form>
  );
}

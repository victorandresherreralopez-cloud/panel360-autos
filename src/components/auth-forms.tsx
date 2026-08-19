"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";
import { loginAction, requestPasswordResetAction, resetPasswordAction } from "@/lib/actions/auth";

// Sonido corto de "inicio de sesion" (power-up) generado con Web Audio,
// sin archivos externos. Se dispara con el clic (gesto del usuario), asi el
// navegador permite reproducirlo.
function playLoginSound() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const sweepGain = ctx.createGain();
    sweepGain.gain.setValueAtTime(0.0001, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    sweepGain.connect(ctx.destination);
    const sweep = ctx.createOscillator();
    sweep.type = "sine";
    sweep.frequency.setValueAtTime(200, now);
    sweep.frequency.exponentialRampToValueAtTime(900, now + 0.5);
    sweep.connect(sweepGain);
    sweep.start(now);
    sweep.stop(now + 0.72);

    ([[523.25, 0.12], [783.99, 0.26]] as Array<[number, number]>).forEach(([freq, at]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.18, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.4);
    });

    window.setTimeout(() => ctx.close().catch(() => {}), 1100);
  } catch {
    // Silencioso: si el navegador bloquea el audio, el login igual funciona.
  }
}

function SubmitButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending} onClick={onClick}>
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

      <label className="grid gap-2 text-sm font-black text-ink dark:text-slate-100">
        Correo
        <input className="input" name="email" type="email" autoComplete="email" placeholder="tu@correo.cl" required />
      </label>

      <label className="grid gap-2 text-sm font-black text-ink dark:text-slate-100">
        Clave
        <input className="input" name="password" type="password" autoComplete="current-password" placeholder="Tu clave" required />
      </label>

      <SubmitButton onClick={playLoginSound}>
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
          <p className="flex items-center gap-2 text-sm font-black text-ink dark:text-slate-100">
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

      <label className="grid gap-2 text-sm font-black text-ink dark:text-slate-100">
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

      <label className="grid gap-2 text-sm font-black text-ink dark:text-slate-100">
        Nueva clave
        <input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>

      <label className="grid gap-2 text-sm font-black text-ink dark:text-slate-100">
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

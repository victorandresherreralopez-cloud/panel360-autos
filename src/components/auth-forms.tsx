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

    // Reverb suave para dar cuerpo/calidad al sonido.
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    const convolver = ctx.createConvolver();
    const reverbLen = Math.floor(ctx.sampleRate * 1.1);
    const impulse = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < reverbLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.6);
      }
    }
    convolver.buffer = impulse;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.28;
    convolver.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    // Arpegio ascendente en Do mayor (C5, E5, G5, C6) con timbre limpio.
    const notes: Array<[number, number]> = [
      [523.25, 0],
      [659.25, 0.09],
      [783.99, 0.18],
      [1046.5, 0.28]
    ];
    notes.forEach(([freq, at]) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.16, now + at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.9);
      gain.connect(master);
      gain.connect(convolver);
      // dos osciladores levemente desafinados = mas riqueza (menos "sintetico")
      [freq, freq * 1.004].forEach((f, index) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const oGain = ctx.createGain();
        oGain.gain.value = index === 0 ? 1 : 0.5;
        osc.connect(oGain);
        oGain.connect(gain);
        osc.start(now + at);
        osc.stop(now + at + 1.0);
      });
    });

    window.setTimeout(() => ctx.close().catch(() => {}), 1600);
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

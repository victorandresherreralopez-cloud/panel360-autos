import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

function firstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function NewPasswordPage({ searchParams }: { searchParams: { token?: string | string[] } }) {
  const token = firstParam(searchParams.token);

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="panel mx-auto mt-12 max-w-md rounded-lg p-6">
        <p className="flex items-center gap-2 text-xs font-black uppercase text-copper">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Nueva clave
        </p>
        <h1 className="mt-2 text-2xl font-black text-ink">Crear nueva clave</h1>
        <p className="mb-5 mt-2 text-sm font-semibold leading-6 text-steel">La clave debe tener al menos 8 caracteres.</p>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="grid gap-4">
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">El enlace no incluye token de recuperacion.</p>
            <Link href="/recuperar-clave" className="btn btn-primary">
              Solicitar otro enlace
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

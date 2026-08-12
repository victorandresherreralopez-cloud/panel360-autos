import { KeyRound } from "lucide-react";
import { RequestPasswordResetForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export default function RecoverPasswordPage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <section className="panel mx-auto mt-12 max-w-md rounded-lg p-6">
        <p className="flex items-center gap-2 text-xs font-black uppercase text-copper">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Recuperar acceso
        </p>
        <h1 className="mt-2 text-2xl font-black text-ink">Recuperar clave</h1>
        <p className="mb-5 mt-2 text-sm font-semibold leading-6 text-steel">
          Ingresa tu correo. El enlace dura 45 minutos y solo se puede usar una vez.
        </p>
        <RequestPasswordResetForm />
      </section>
    </main>
  );
}

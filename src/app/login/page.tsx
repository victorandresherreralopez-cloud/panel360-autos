import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth-forms";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

function firstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function loginMessage(searchParams: Record<string, string | string[] | undefined>) {
  if (firstParam(searchParams.salida)) return "Sesion cerrada correctamente.";
  if (firstParam(searchParams.clave) === "actualizada") return "Clave actualizada. Ya puedes entrar con tu nueva clave.";
  return "";
}

export default function LoginPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section>
          <BrandLogo variant="auth" />
          <p className="mt-6 text-xs font-black uppercase text-copper">Sistema privado Panel360</p>
          <h1 className="mt-2 text-4xl font-black tracking-normal text-ink md:text-5xl">Asistente Comercial Automotriz</h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-steel">
            Modulo independiente para ventas, clientes, cotizaciones, rentabilidad, documentos y Vitoko IA.
          </p>
          <div className="mt-6 grid gap-3 text-sm font-semibold text-graphite sm:grid-cols-2">
            <p className="rounded-lg border border-graphite/10 bg-white/78 p-4">Datos comerciales protegidos por sesion.</p>
            <p className="rounded-lg border border-graphite/10 bg-white/78 p-4">Recuperacion de clave con enlace temporal.</p>
          </div>
        </section>

        <section className="panel rounded-lg p-6">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-copper">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Iniciar sesion
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">Entra a tu panel</h2>
          <p className="mb-5 mt-2 text-sm font-semibold leading-6 text-steel">Usa tu correo y clave del sistema.</p>
          <LoginForm next={firstParam(searchParams.next)} message={loginMessage(searchParams)} />
        </section>
      </div>
    </main>
  );
}

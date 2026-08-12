"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  Bell,
  BookOpen,
  Calculator,
  CalendarDays,
  CarFront,
  ClipboardCheck,
  CreditCard,
  Gauge,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Settings,
  SlidersHorizontal,
  LogOut,
  UserCircle2,
  UsersRound,
  Wrench
} from "lucide-react";
import clsx from "clsx";
import { BrandLogo } from "@/components/brand-logo";
import { VitokoAssistant } from "@/components/vitoko-assistant";
import { logoutAction } from "@/lib/actions/auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehiculos", label: "Vehiculos", icon: CarFront },
  { href: "/actualizaciones", label: "Actualizaciones", icon: Bell },
  { href: "/comparador", label: "Comparador", icon: SlidersHorizontal },
  { href: "/cliente-frente-a-mi", label: "Cliente frente a mi", icon: Gauge },
  { href: "/cotizador", label: "Cotizador", icon: ClipboardCheck },
  { href: "/rentabilidad", label: "Rentabilidad", icon: Calculator },
  { href: "/creditos", label: "Creditos", icon: CreditCard },
  { href: "/plan-comercial", label: "Plan comercial", icon: ClipboardCheck },
  { href: "/ayudas-comerciales", label: "Ayudas comerciales", icon: BadgeDollarSign },
  { href: "/promociones", label: "Promociones", icon: Bell },
  { href: "/modo-vendedor", label: "Modo vendedor", icon: Gauge },
  { href: "/clientes", label: "Clientes", icon: UsersRound },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquareText },
  { href: "/aprender", label: "Aprender", icon: BookOpen },
  { href: "/admin", label: "Administracion", icon: Wrench },
  { href: "/configuracion/telegram", label: "Telegram", icon: Settings }
];

export function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user?: { name: string; email: string; role: string } | null;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname.startsWith("/recuperar-clave");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-graphite/10 bg-white/82 px-4 py-5 backdrop-blur-xl lg:block">
        <Link href="/" className="block rounded-lg px-2 py-1 transition hover:bg-mist/70">
          <BrandLogo />
        </Link>

        <nav className="mt-8 grid gap-1" aria-label="Principal">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition",
                  active ? "bg-ink text-white shadow-panel" : "text-graphite hover:bg-mist"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-lg border border-graphite/10 bg-mist/70 p-3">
          <p className="flex items-center gap-2 text-sm font-black text-ink">
            <UserCircle2 className="h-4 w-4 text-signal" aria-hidden="true" />
            {user?.name ?? "Usuario"}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-steel">{user?.email ?? ""}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="btn btn-secondary w-full">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-graphite/10 bg-white/78 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="min-w-0">
              <BrandLogo variant="mobile" />
            </Link>
            <Link href="/buscar" className="btn btn-secondary" aria-label="Buscar">
              <Search className="h-4 w-4" aria-hidden="true" />
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-secondary" aria-label="Salir">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Principal movil">
            {navItems.slice(0, 10).map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold",
                    active ? "bg-ink text-white" : "bg-mist text-graphite"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <VitokoAssistant />
    </div>
  );
}

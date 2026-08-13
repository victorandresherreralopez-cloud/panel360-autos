"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  Bell,
  BookOpen,
  Calculator,
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  Settings,
  SlidersHorizontal,
  Sun,
  UserCircle2,
  UsersRound,
  Wrench,
  X
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

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load stored sidebar collapse preference
    const savedCollapsed = localStorage.getItem("panel360_sidebar_collapsed");
    if (savedCollapsed === "true") {
      setIsCollapsed(true);
    }

    // Load stored theme preference
    const savedTheme = localStorage.getItem("panel360_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function toggleSidebar() {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("panel360_sidebar_collapsed", String(nextState));
  }

  function toggleTheme() {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    localStorage.setItem("panel360_theme", nextTheme ? "dark" : "light");
    if (nextTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* DESKTOP SIDEBAR */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white/90 backdrop-blur-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/90 lg:flex lg:flex-col",
          isCollapsed ? "w-20 px-2 py-5" : "w-72 px-4 py-5"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="block min-w-0 rounded-lg px-2 py-1 transition hover:bg-slate-100 dark:hover:bg-slate-800">
            <BrandLogo />
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            title={isCollapsed ? "Expandir menú" : "Contraer menú"}
            aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Navegación principal">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-lg py-2.5 text-sm font-bold transition",
                  isCollapsed ? "justify-center px-2" : "px-3",
                  active
                    ? "bg-slate-900 text-white shadow-md dark:bg-teal-600 dark:text-white"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div
          className={clsx(
            "mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60",
            isCollapsed ? "text-center" : ""
          )}
        >
          {!isCollapsed && (
            <>
              <p className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <UserCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <span className="truncate">{user?.name ?? "Usuario"}</span>
              </p>
              <p className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">{user?.email ?? ""}</p>
            </>
          )}

          <div className={clsx("flex items-center gap-2", isCollapsed ? "flex-col" : "mt-3")}>
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                className={clsx(
                  "flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
                  isCollapsed ? "px-0" : "px-3"
                )}
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                {!isCollapsed && <span>Salir</span>}
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-80 max-w-[calc(100vw-3rem)] border-r border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <BrandLogo />
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-6 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition",
                      active
                        ? "bg-slate-900 text-white dark:bg-teal-600"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 lg:hidden"
              aria-label="Abrir menú móvil"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="lg:hidden">
              <BrandLogo variant="mobile" />
            </Link>
          </div>

          {/* Action Tools & Theme Toggle */}
          <div className="flex items-center gap-2">
            <Link
              href="/buscar"
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Buscar en el catálogo"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Buscar...</span>
            </Link>

            {/* Dark Mode / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
              title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              aria-label={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className={clsx("transition-all duration-300", isCollapsed ? "lg:pl-20" : "lg:pl-72")}>
        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* VITOKO IA FLOATING MASCOT */}
      <VitokoAssistant />
    </div>
  );
}

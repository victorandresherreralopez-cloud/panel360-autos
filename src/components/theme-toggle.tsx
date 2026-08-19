"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Boton dia/noche independiente (para paginas sin AppShell, como el login).
// AppShell ya aplica el tema guardado al cargar; aqui solo lo alternamos.
export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("panel360_theme", next ? "dark" : "light");
    } catch {
      // sin acceso a localStorage: igual cambia el tema en pantalla
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        className ??
        "flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
      }
      title={isDark ? "Cambiar a modo dia" : "Cambiar a modo noche"}
      aria-label={isDark ? "Cambiar a modo dia" : "Cambiar a modo noche"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

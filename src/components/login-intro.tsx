"use client";

import { useEffect, useState } from "react";

// Intro cinematografica: el vehiculo aparece a PANTALLA COMPLETA con un barrido
// de luz y luego se desvanece revelando el contenido. Se puede saltar con clic.
// Con `once`, solo se muestra una vez por sesion (para el ingreso al sistema).
export function LoginIntro({ once = false }: { once?: boolean }) {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    if (once) {
      try {
        if (sessionStorage.getItem("panel360_intro_seen")) {
          setPhase("done");
          return;
        }
        sessionStorage.setItem("panel360_intro_seen", "1");
      } catch {
        // sin sessionStorage: se muestra igual
      }
    }
    const toOut = window.setTimeout(() => setPhase("out"), 2300);
    const toDone = window.setTimeout(() => setPhase("done"), 3200);
    return () => {
      window.clearTimeout(toOut);
      window.clearTimeout(toDone);
    };
  }, [once]);

  if (phase === "done") return null;

  return (
    <div
      className={phase === "out" ? "login-intro login-intro-out" : "login-intro"}
      onClick={() => setPhase("out")}
      role="presentation"
      aria-hidden="true"
    >
      {/* imagen del auto de frente, a pantalla completa (img normal, sin optimizador) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/login-auto.jpg" alt="" className="login-intro-fullimg" />
      <span className="login-intro-shine" />
      <p className="login-intro-title">
        PANEL360 <span>Autos</span>
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

// Intro cinematografica: muestra el vehiculo, hace un barrido de luz y se
// desvanece. Se puede saltar con un clic. Con `once`, solo se muestra una vez
// por sesion (para el ingreso al sistema).
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
    const toOut = window.setTimeout(() => setPhase("out"), 2000);
    const toDone = window.setTimeout(() => setPhase("done"), 2900);
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
      <div className="login-intro-cars">
        <div className="login-intro-car login-intro-car-1">
          {/* img normal (no next/image) para evitar el optimizador que fallaba */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/prentacion.jpg" alt="" className="login-intro-img" />
        </div>
        <div className="login-intro-car login-intro-car-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/login-auto.jpg" alt="" className="login-intro-img" />
        </div>
      </div>
      <p className="login-intro-title">
        PANEL360 <span>Autos</span>
      </p>
    </div>
  );
}

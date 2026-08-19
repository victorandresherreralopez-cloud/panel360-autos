"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Intro cinematografica: muestra el vehiculo, hace un barrido de luz y se
// desvanece revelando el login. Se puede saltar con un clic.
export function LoginIntro() {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    const toOut = window.setTimeout(() => setPhase("out"), 2000);
    const toDone = window.setTimeout(() => setPhase("done"), 2900);
    return () => {
      window.clearTimeout(toOut);
      window.clearTimeout(toDone);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={phase === "out" ? "login-intro login-intro-out" : "login-intro"}
      onClick={() => setPhase("out")}
      role="presentation"
      aria-hidden="true"
    >
      <div className="login-intro-car">
        <Image src="/prentacion.jpg" alt="" width={640} height={400} priority className="login-intro-img" />
      </div>
      <p className="login-intro-title">
        PANEL360 <span>Autos</span>
      </p>
    </div>
  );
}

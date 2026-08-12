"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, ExternalLink, Lightbulb, Send, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import type { VitokoAction, VitokoBrief, VitokoTone } from "@/lib/vitoko";

type VitokoMessage = {
  role: "user" | "vitoko";
  text: string;
  actions?: VitokoAction[];
  sources?: string[];
};

const quickPrompts = [
  "Tengo un cliente con presupuesto y quiere SUV",
  "Revisa bonos o campañas importantes",
  "Necesito cuidar rentabilidad e impuesto verde",
  "Quiero evaluar credito Amicar"
];

function toneClasses(tone: VitokoTone = "neutral") {
  return clsx(
    tone === "good" && "border-emerald-200 bg-emerald-50 text-emerald-900",
    tone === "warn" && "border-amber-200 bg-amber-50 text-amber-900",
    tone === "bad" && "border-red-200 bg-red-50 text-red-900",
    tone === "neutral" && "border-graphite/10 bg-white text-graphite"
  );
}

function ActionLink({ action }: { action: VitokoAction }) {
  return (
    <Link
      href={action.href}
      className={clsx(
        "inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition hover:-translate-y-0.5",
        toneClasses(action.tone)
      )}
    >
      {action.label}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}

export function VitokoAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [brief, setBrief] = useState<VitokoBrief | null>(null);
  const [messages, setMessages] = useState<VitokoMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/vitoko")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data?.brief) setBrief(data.brief);
      })
      .catch(() => {
        if (!cancelled) setError("Vitoko no pudo leer el resumen ahora.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isOpen]);

  async function sendMessage(message: string) {
    const cleanMessage = message.trim();
    if (!cleanMessage || isLoading) return;

    setInput("");
    setError("");
    setIsLoading(true);
    setMessages((current) => [...current, { role: "user", text: cleanMessage }]);

    try {
      const response = await fetch("/api/vitoko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanMessage })
      });
      const data = await response.json();

      if (!response.ok || !data?.answer) {
        throw new Error("Respuesta no disponible");
      }

      setMessages((current) => [
        ...current,
        {
          role: "vitoko",
          text: data.answer.reply,
          actions: data.answer.actions,
          sources: data.answer.sources
        }
      ]);
    } catch {
      setError("No pude consultar Vitoko. Reintenta en unos segundos.");
    } finally {
      setIsLoading(false);
    }
  }

  const primaryInsight = brief?.insights[0];
  const actionItems = brief?.insights.flatMap((insight) => insight.actions).slice(0, 5) ?? [];

  return (
    <div className="no-print fixed bottom-4 right-4 z-40 sm:bottom-5 sm:right-5">
      {isOpen ? (
        <section
          role="dialog"
          aria-label="Vitoko IA"
          className="fixed inset-x-4 bottom-4 max-h-[calc(100vh-2rem)] overflow-hidden rounded-lg border border-graphite/15 bg-white shadow-panel sm:left-auto sm:right-5 sm:w-[430px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-graphite/10 bg-ink px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/12">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">Vitoko IA</p>
                <p className="truncate text-xs font-semibold text-white/72">Agente comercial, CRM y rentabilidad</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-white/80 transition hover:bg-white/10" aria-label="Cerrar Vitoko">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[calc(100vh-13rem)] overflow-y-auto px-4 py-4">
            {brief ? (
              <div className="rounded-lg border border-signal/20 bg-signal/5 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-ink">
                  <Sparkles className="h-4 w-4 text-signal" aria-hidden="true" />
                  {brief.headline}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-steel">{brief.summary}</p>
                {primaryInsight ? (
                  <div className={clsx("mt-3 rounded-lg border p-3 text-xs font-semibold leading-5", toneClasses(primaryInsight.tone))}>
                    <p className="mb-1 flex items-center gap-2 font-black">
                      {primaryInsight.tone === "warn" ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                      {primaryInsight.agent}
                    </p>
                    <p>{primaryInsight.title}</p>
                    <p className="mt-1 opacity-80">{primaryInsight.detail}</p>
                  </div>
                ) : null}
                {actionItems.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {actionItems.map((item) => (
                      <ActionLink key={`${item.label}-${item.href}`} action={item} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-graphite/10 bg-mist p-4 text-sm font-semibold text-steel">Vitoko esta leyendo el sistema...</div>
            )}

            <div className="mt-4 grid gap-2">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-copper">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                Atajos utiles
              </p>
              <div className="grid gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-lg border border-graphite/10 bg-white px-3 py-2 text-left text-xs font-bold leading-5 text-graphite transition hover:border-signal/30 hover:bg-signal/5"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {messages.length ? (
              <div className="mt-4 grid gap-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={clsx(
                      "rounded-lg border p-3 text-sm font-semibold leading-6",
                      message.role === "user" ? "ml-8 border-graphite/10 bg-mist text-ink" : "mr-4 border-signal/20 bg-white text-graphite"
                    )}
                  >
                    <p className="text-xs font-black uppercase text-steel">{message.role === "user" ? "Tu" : "Vitoko"}</p>
                    <p className="mt-1">{message.text}</p>
                    {message.actions?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((item) => (
                          <ActionLink key={`${item.label}-${item.href}`} action={item} />
                        ))}
                      </div>
                    ) : null}
                    {message.sources?.length ? <p className="mt-2 text-xs font-bold text-steel">Fuente: {message.sources.join(", ")}</p> : null}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : null}

            {isLoading ? <p className="mt-4 text-sm font-bold text-steel">Vitoko esta cruzando datos...</p> : null}
            {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p> : null}
          </div>

          <form
            className="border-t border-graphite/10 bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="input min-h-11"
                placeholder="Dime que estas vendiendo o que cliente tienes enfrente..."
                aria-label="Mensaje para Vitoko"
              />
              <button type="submit" className="btn btn-primary shrink-0" disabled={isLoading || !input.trim()} aria-label="Enviar a Vitoko">
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-ink/10 bg-ink px-4 py-3 text-left text-white shadow-panel transition hover:-translate-y-0.5"
          aria-label="Abrir Vitoko IA"
          aria-expanded={isOpen}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/12">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black">Vitoko</span>
            <span className="block truncate text-xs font-semibold text-white/72">{primaryInsight?.title ?? "Mirando ventas, bonos y clientes"}</span>
          </span>
          <Sparkles className="h-4 w-4 shrink-0 text-white/80" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

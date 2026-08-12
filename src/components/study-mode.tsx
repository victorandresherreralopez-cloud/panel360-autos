"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";

type Question = {
  id: string;
  prompt: string;
  answer: string;
  explanation: string | null;
};

export function StudyMode({ questions }: { questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const question = questions[index];
  const percent = useMemo(() => {
    const total = score.correct + score.wrong;
    return total ? Math.round((score.correct / total) * 100) : 0;
  }, [score]);

  if (!question) {
    return <p className="text-sm font-semibold text-steel">No hay preguntas de estudio cargadas.</p>;
  }

  function next() {
    setRevealed(false);
    setIndex((current) => (current + 1) % questions.length);
  }

  return (
    <div className="panel rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-copper">Modo estudio</p>
          <h2 className="mt-1 text-2xl font-black text-ink">{question.prompt}</h2>
        </div>
        <div className="rounded-lg bg-mist px-3 py-2 text-right">
          <p className="text-xs font-black uppercase text-steel">Puntuación</p>
          <p className="text-lg font-black text-ink">
            {score.correct}/{score.correct + score.wrong || 0} · {percent}%
          </p>
        </div>
      </div>

      {revealed ? (
        <div className="mt-5 rounded-lg border border-signal/20 bg-signal/5 p-4">
          <p className="text-sm font-black text-signal">Respuesta correcta</p>
          <p className="mt-1 text-lg font-black text-ink">{question.answer}</p>
          {question.explanation ? <p className="mt-2 text-sm font-semibold leading-6 text-graphite">{question.explanation}</p> : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-primary" type="button" onClick={() => setRevealed(true)}>
          Mostrar respuesta
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            setScore((current) => ({ ...current, correct: current.correct + 1 }));
            next();
          }}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Correcta
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            setScore((current) => ({ ...current, wrong: current.wrong + 1 }));
            next();
          }}
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Repasar
        </button>
        <button className="btn btn-secondary" type="button" onClick={next}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Siguiente
        </button>
      </div>
    </div>
  );
}

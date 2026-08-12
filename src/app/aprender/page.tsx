import { StudyMode } from "@/components/study-mode";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const [questions, acronyms] = await Promise.all([
    prisma.studyQuestion.findMany({ where: { status: "VIGENTE" }, orderBy: { prompt: "asc" } }),
    prisma.acronym.findMany({ orderBy: { code: "asc" } })
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader title="Modo estudio" description="Tarjetas para aprender siglas, conceptos y diferencias sin mezclar datos no documentados." />
      {questions.length ? <StudyMode questions={questions} /> : <EmptyState title="No hay preguntas de estudio." description="Cargue siglas o versiones para generar contenido de estudio." />}

      <Panel>
        <h2 className="text-xl font-black text-ink">Diccionario de siglas</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Sigla</th>
                <th>Significado</th>
                <th>Descripción</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {acronyms.map((item) => (
                <tr key={item.id}>
                  <td className="font-black text-ink">{item.code}</td>
                  <td>{item.meaning ?? "Significado no documentado"}</td>
                  <td>{item.description ?? "Información pendiente de cargar"}</td>
                  <td>{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

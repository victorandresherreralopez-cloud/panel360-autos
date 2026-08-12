import { Search } from "lucide-react";

export function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/buscar" className="flex flex-col gap-3 rounded-lg border border-graphite/10 bg-white p-2 shadow-panel sm:flex-row">
      <label className="sr-only" htmlFor="q">
        Buscar
      </label>
      <div className="flex flex-1 items-center gap-2 px-3">
        <Search className="h-5 w-5 text-steel" aria-hidden="true" />
        <input
          id="q"
          name="q"
          defaultValue={defaultValue}
          className="h-12 flex-1 border-0 bg-transparent text-base font-semibold outline-none"
          placeholder="¿Qué vehículo, versión o promoción está buscando?"
        />
      </div>
      <button className="btn btn-primary" type="submit">
        Buscar
      </button>
    </form>
  );
}

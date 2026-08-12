import { createBrand, createManualPrice, createModel, createVersion } from "@/lib/actions";
import { PRICE_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { PageHeader, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [brands, models, versions] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.vehicleModel.findMany({ include: { brand: true }, orderBy: [{ brand: { name: "asc" } }, { name: "asc" }] }),
    prisma.version.findMany({ include: { brand: true, model: true }, orderBy: [{ brand: { name: "asc" } }, { model: { name: "asc" } }, { commercialOrder: "asc" }] })
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Administración"
        description="Gestione catálogo, versiones, precios y datos de apoyo. Toda modificación comercial queda registrada en auditoría."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <h2 className="text-xl font-black text-ink">Marcas</h2>
          <form action={createBrand} className="mt-4 flex gap-3">
            <input className="input" name="name" placeholder="Nueva marca" />
            <button className="btn btn-primary" type="submit">
              Guardar
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {brands.map((brand) => (
              <span key={brand.id} className="rounded-full bg-mist px-3 py-1 text-sm font-black text-graphite">
                {brand.name}
              </span>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-black text-ink">Modelos</h2>
          <form action={createModel} className="mt-4 grid gap-3">
            <select className="input" name="brandId" required>
              <option value="">Marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" name="name" placeholder="Modelo" required />
              <input className="input" name="segment" placeholder="Segmento" />
              <input className="input" name="fuelTypes" placeholder="Combustible disponible" />
              <input className="input" name="transmissions" placeholder="Transmisiones disponibles" />
              <input className="input" name="tractions" placeholder="Tracciones disponibles" />
            </div>
            <button className="btn btn-primary w-fit" type="submit">
              Crear modelo
            </button>
          </form>
        </Panel>
      </div>

      <Panel>
        <h2 className="text-xl font-black text-ink">Versiones</h2>
        <form action={createVersion} className="mt-4 grid gap-3">
          <select className="input" name="modelId" required>
            <option value="">Modelo</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.brand.name} · {model.name}
              </option>
            ))}
          </select>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="input" name="name" placeholder="Nombre completo versión" required />
            <input className="input" name="sapCode" placeholder="Codigo CIT" />
            <input className="input" name="modelYear" placeholder="Año/model year" />
            <input className="input" name="engine" placeholder="Motor" />
            <input className="input" name="displacement" placeholder="Cilindrada" />
            <input className="input" name="power" placeholder="Potencia" />
            <input className="input" name="torque" placeholder="Torque" />
            <input className="input" name="transmission" placeholder="Transmisión" />
            <input className="input" name="gears" placeholder="Velocidades" />
            <input className="input" name="traction" placeholder="Tracción" />
            <input className="input" name="fuelType" placeholder="Combustible" />
            <input className="input" name="consumption" placeholder="Consumo" />
            <input className="input" name="passengers" placeholder="Pasajeros" />
            <input className="input" name="cargoCapacity" placeholder="Maletero" />
            <input className="input" name="wheels" placeholder="Llantas" />
            <input className="input" name="screen" placeholder="Pantalla" />
            <input className="input" name="carPlay" placeholder="CarPlay" />
            <input className="input" name="androidAuto" placeholder="Android Auto" />
            <input className="input" name="camera" placeholder="Cámara" />
            <input className="input" name="sensors" placeholder="Sensores" />
            <input className="input" name="roof" placeholder="Techo" />
            <input className="input" name="seats" placeholder="Asientos" />
            <input className="input" name="climateControl" placeholder="Climatizador" />
            <input className="input" name="airbags" placeholder="Airbags" />
            <input className="input" name="adas" placeholder="ADAS" />
            <input className="input" name="cruiseControl" placeholder="Control crucero" />
            <input className="input" name="warranty" placeholder="Garantía" />
            <input className="input" name="commercialOrder" placeholder="Orden comercial" type="number" />
          </div>
          <textarea className="input min-h-24" name="equipmentSummary" placeholder="Equipamiento comprobado" />
          <textarea className="input min-h-24" name="safetySummary" placeholder="Seguridad comprobada" />
          <textarea className="input min-h-24" name="observations" placeholder="Observaciones" />
          <button className="btn btn-primary w-fit" type="submit">
            Crear versión
          </button>
        </form>
      </Panel>

      <Panel>
        <h2 className="text-xl font-black text-ink">Precios manuales aprobados</h2>
        <p className="mt-1 text-sm font-semibold text-steel">Antes de registrar un precio se crea un backup local de la base. El precio anterior no se elimina.</p>
        <form action={createManualPrice} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <select className="input xl:col-span-2" name="versionId" required>
            <option value="">Versión</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.brand.name} {version.model.name} {version.name}
              </option>
            ))}
          </select>
          <select className="input" name="priceType" required>
            {PRICE_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input className="input" name="amount" placeholder="$19.990.000" required />
          <input className="input" name="sourceName" placeholder="Fuente" />
          <textarea className="input md:col-span-2 xl:col-span-5" name="observation" placeholder="Observación o condición" />
          <button className="btn btn-primary w-fit" type="submit">
            Guardar precio
          </button>
        </form>
      </Panel>
    </div>
  );
}

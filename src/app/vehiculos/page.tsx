import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { VehiclesExplorer, type VehicleExplorerBrand } from "@/components/vehicles-explorer";
import { commercialAidMatchesVehicle, getCommercialAidAlerts } from "@/lib/commercial-aids";
import { normalizeText } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function documentKey(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function documentBaseKey(value: string) {
  return documentKey(value.replace(/\.[^.]+$/, ""));
}

function firstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function VehiclesPage({ searchParams }: { searchParams?: { q?: string | string[] } }) {
  const [brands, technicalSheets, commercialAidAlerts] = await Promise.all([
    prisma.brand.findMany({
      include: {
        models: {
          include: {
            versions: {
              include: {
                prices: { where: { status: "VIGENTE" }, orderBy: { effectiveFrom: "desc" } }
              },
              orderBy: [{ commercialOrder: "asc" }, { name: "asc" }]
            }
          },
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.document.findMany({
      where: { status: { in: ["VIGENTE", "DETECTADO"] } },
      select: { id: true, brandId: true, originalName: true, type: true },
      orderBy: { originalName: "asc" }
    }),
    getCommercialAidAlerts(300)
  ]);

  const explorerBrands: VehicleExplorerBrand[] = brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    models: brand.models.map((model) => {
      const prices = model.versions.flatMap((version) => version.prices.filter((price) => price.priceType === "LIST"));
      const fromPrice = prices.length ? Math.min(...prices.map((price) => price.amount)) : null;
      const cleanModel = normalizeText(model.name).replace(/[^a-z0-9]/g, "");
      const modelSheet =
        (model as any).technicalSheet ??
        technicalSheets.find((sheet) => sheet.brandId === brand.id && normalizeText(sheet.originalName).replace(/[^a-z0-9]/g, "").includes(cleanModel)) ??
        technicalSheets.find((sheet) => normalizeText(sheet.originalName).replace(/[^a-z0-9]/g, "").includes(cleanModel)) ??
        null;
      const modelAidAlerts = commercialAidAlerts.filter((alert) => commercialAidMatchesVehicle(alert, brand.name, model.name)).slice(0, 3);


      return {
        id: model.id,
        brandId: brand.id,
        brandName: brand.name,
        name: model.name,
        segment: model.segment,
        fuelTypes: model.fuelTypes,
        transmissions: model.transmissions,
        tractions: model.tractions,
        imagePath: model.imagePath,
        status: model.status,
        fromPrice,
        technicalSheet: {
          id: modelSheet?.id ?? model.id,
          originalName: modelSheet?.originalName ?? `Ficha Técnica ${brand.name} ${model.name}`
        },

        aids: modelAidAlerts.map((alert) => ({
          id: alert.id,
          title: alert.title,
          detail: alert.detail,
          category: alert.category,
          tone: alert.tone
        })),
        versions: model.versions.map((version) => {
          const listPrice = version.prices.find((price) => price.priceType === "LIST")?.amount ?? null;
          const campaignPrice = version.prices.find((price) => price.priceType === "CAMPAIGN")?.amount ?? null;
          const cashPrice = version.prices.find((price) => price.priceType === "CASH")?.amount ?? null;
          const financingPrice = version.prices.find((price) => price.priceType === "FINANCING")?.amount ?? null;

          return {
            id: version.id,
            name: version.name,
            sapCode: version.sapCode,
            engine: version.engine,
            transmission: version.transmission,
            traction: version.traction,
            fuelType: version.fuelType,
            listPrice,
            bestPrice: campaignPrice ?? cashPrice ?? financingPrice ?? listPrice,
            prices: version.prices.map((p) => ({ priceType: p.priceType, amount: p.amount }))
          };
        })
      };
    })
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Vehiculos"
        description="Busca rapido por marca, modelo, version, ficha tecnica o Codigo CIT. La idea es llegar al dato en segundos cuando tienes al cliente enfrente."
        action={
          <Link href="/admin" className="btn btn-primary">
            Administrar catalogo
          </Link>
        }
      />

      <VehiclesExplorer brands={explorerBrands} initialQuery={firstParam(searchParams?.q)} />
    </div>
  );
}

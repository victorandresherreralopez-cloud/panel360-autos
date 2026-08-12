import { prisma } from "../src/lib/prisma";

async function main() {
  const [brands, models, versions, dercoDocs, dercoPrices, sample] = await Promise.all([
    prisma.brand.findMany({ select: { name: true, _count: { select: { models: true, versions: true } } }, orderBy: { name: "asc" } }),
    prisma.vehicleModel.count({ where: { status: "VIGENTE" } }),
    prisma.version.count({ where: { status: "VIGENTE" } }),
    prisma.document.count({ where: { type: { in: ["DERCO WEB", "FICHA TECNICA DERCO"] } } }),
    prisma.price.count({ where: { status: "VIGENTE", document: { type: "DERCO WEB" } } }),
    prisma.version.findFirst({
      where: { brand: { name: "GWM" }, model: { name: "Haval Jolion" } },
      include: {
        brand: true,
        model: true,
        prices: { where: { status: "VIGENTE" }, include: { document: true }, orderBy: { priceType: "asc" } }
      }
    })
  ]);

  console.log(
    JSON.stringify(
      {
        brands,
        models,
        versions,
        dercoDocs,
        dercoPrices,
        sample: sample
          ? {
              vehicle: `${sample.brand.name} ${sample.model.name} ${sample.name}`,
              power: sample.power,
              transmission: sample.transmission,
              fuelType: sample.fuelType,
              consumption: sample.consumption,
              equipmentContainsPrice: /precio y financiamiento/i.test(sample.equipmentSummary ?? ""),
              prices: sample.prices.map((price) => ({
                type: price.priceType,
                amount: price.amount,
                source: price.document?.originalName
              }))
            }
          : null
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

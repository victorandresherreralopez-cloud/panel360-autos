import { prisma } from "@/lib/prisma";

export async function searchAll(query: string) {
  const q = query.trim();
  if (!q) {
    return {
      brands: [],
      models: [],
      versions: [],
      customers: [],
      campaigns: []
    };
  }

  const [brands, models, versions, customers, campaigns] = await Promise.all([
    prisma.brand.findMany({ where: { name: { contains: q } }, orderBy: { name: "asc" }, take: 10 }),
    prisma.vehicleModel.findMany({
      where: { name: { contains: q } },
      include: { brand: true },
      orderBy: { name: "asc" },
      take: 10
    }),
    prisma.version.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { model: { name: { contains: q } } },
          { brand: { name: { contains: q } } },
          { sapCode: { contains: q } },
          { engine: { contains: q } },
          { transmission: { contains: q } },
          { traction: { contains: q } }
        ]
      },
      include: { brand: true, model: true, prices: { where: { status: "VIGENTE" }, orderBy: { effectiveFrom: "desc" } } },
      orderBy: { name: "asc" },
      take: 10
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { rut: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
          { currentPlate: { contains: q } },
          { interestedModel: { contains: q } },
          { interestedVersion: { contains: q } }
        ]
      },
      include: { status: true },
      orderBy: { updatedAt: "desc" },
      take: 10
    }),
    prisma.commercialCampaign.findMany({
      where: {
        OR: [{ title: { contains: q } }, { benefit: { contains: q } }, { promotionType: { contains: q } }]
      },
      orderBy: { updatedAt: "desc" },
      take: 10
    })
  ]);

  return { brands, models, versions, customers, campaigns };
}

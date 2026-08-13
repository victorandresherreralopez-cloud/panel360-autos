const directUrl = "postgresql://postgres.vesobzvcorxxxvdxdzqk:Vitoko.2022@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";
const { PrismaClient } = await import("../node_modules/@prisma/client-vercel/index.js");
const prismaPg = new PrismaClient({ datasources: { db: { url: directUrl } } });

async function main() {
  console.log("Checking columns of storage.objects and storage.buckets...");

  const colsBucket = await prismaPg.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'storage' AND table_name = 'buckets';
  `;
  console.log("storage.buckets columns:", colsBucket);

  const colsObj = await prismaPg.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'storage' AND table_name = 'objects';
  `;
  console.log("storage.objects columns:", colsObj);

  await prismaPg.$disconnect();
}

main();

const postgresCandidates = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_DATABASE_URL"
];

export function resolveDatabaseUrl() {
  const found = postgresCandidates.map((key) => process.env[key]).find(Boolean);
  if (found && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = found;
  }

  return process.env.DATABASE_URL ?? "";
}

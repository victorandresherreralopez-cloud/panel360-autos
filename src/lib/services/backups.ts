import fs from "node:fs/promises";
import path from "node:path";
import { assertInsideWorkspace } from "@/lib/safe-paths";

export async function createDatabaseBackup(reason: string) {
  if (process.env.VERCEL) {
    return null;
  }

  const dbPath = path.join(process.cwd(), "prisma", "dev.db");

  try {
    await fs.access(dbPath);
  } catch {
    return null;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeReason = reason.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 40) || "backup";
  const targetDir = assertInsideWorkspace(path.join(process.cwd(), "backups", stamp.slice(0, 10)));
  await fs.mkdir(targetDir, { recursive: true });
  const target = assertInsideWorkspace(path.join(targetDir, `${stamp}-${safeReason}.db`));
  await fs.copyFile(dbPath, target);
  return target;
}

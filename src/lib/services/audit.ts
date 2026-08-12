import { prisma } from "@/lib/prisma";

type AuditInput = {
  entityType: string;
  entityId?: string | null;
  brandName?: string | null;
  modelName?: string | null;
  versionName?: string | null;
  fieldModified: string;
  previousValue?: string | null;
  newValue?: string | null;
  source?: string | null;
  user?: string | null;
  observation?: string | null;
};

export async function writeAudit(input: AuditInput) {
  return prisma.auditLog.create({ data: input });
}

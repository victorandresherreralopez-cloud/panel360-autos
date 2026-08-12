import path from "node:path";

export function sanitizeFilename(name: string) {
  const extension = path.extname(name).toLowerCase();
  const base = path.basename(name, extension);
  const safeBase = base
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

  return `${safeBase || "documento"}${extension}`;
}

export function assertInsideWorkspace(targetPath: string) {
  const workspace = path.resolve(process.cwd());
  const resolved = path.resolve(targetPath);
  const relative = path.relative(workspace, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Ruta invalida: el archivo debe quedar dentro del proyecto.");
  }

  return resolved;
}

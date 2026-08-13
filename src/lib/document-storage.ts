import fs from "node:fs/promises";
import path from "node:path";
import { assertInsideWorkspace } from "@/lib/safe-paths";

type StoreDocumentInput = {
  buffer: Buffer;
  contentType?: string;
  directoryParts: string[];
  filename: string;
};

function shouldUseVercelBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
}

function toBlobPath(parts: string[], filename: string) {
  return [...parts, filename]
    .map((part) => part.replace(/^\/+|\/+$/g, "").replace(/\\/g, "/"))
    .filter(Boolean)
    .join("/");
}

export function isRemoteStoredDocument(storedPath: string) {
  return /^https?:\/\//i.test(storedPath);
}

function isLocalFilePath(storedPath: string) {
  return path.isAbsolute(storedPath) || /^[a-zA-Z]:[\\/]/.test(storedPath);
}

export async function storeDocumentFile({ buffer, contentType, directoryParts, filename }: StoreDocumentInput) {
  if (shouldUseVercelBlob()) {
    const { put } = await import("@vercel/blob");
    const blobPath = toBlobPath(directoryParts, filename);
    const blob = await put(blobPath, buffer, {
      access: "private",
      contentType
    });

    return blob.pathname;
  }

  const directory = assertInsideWorkspace(path.join(process.cwd(), ...directoryParts));
  await fs.mkdir(directory, { recursive: true });
  const storedPath = assertInsideWorkspace(path.join(directory, filename));
  await fs.writeFile(storedPath, buffer);

  return storedPath;
}

export async function readStoredDocument(storedPath: string) {
  if (shouldUseVercelBlob() && !isRemoteStoredDocument(storedPath) && !isLocalFilePath(storedPath)) {
    const { get } = await import("@vercel/blob");
    const result = await get(storedPath, { access: "private" });

    if (result?.statusCode !== 200) {
      throw new Error("Documento privado no encontrado en Vercel Blob.");
    }

    return {
      buffer: Buffer.from(await new Response(result.stream).arrayBuffer()),
      contentType: result.blob.contentType
    };
  }

  if (isRemoteStoredDocument(storedPath)) {
    const response = await fetch(storedPath);
    if (!response.ok) {
      throw new Error(`No fue posible descargar el documento remoto (${response.status}).`);
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? undefined
    };
  }

  if (storedPath.startsWith("/")) {
    const fullPublicPath = path.join(process.cwd(), "public", storedPath);
    return {
      buffer: await fs.readFile(fullPublicPath),
      contentType: undefined
    };
  }

  const filePath = assertInsideWorkspace(storedPath);
  return {
    buffer: await fs.readFile(filePath),
    contentType: undefined
  };
}

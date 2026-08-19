import https from "node:https";
import { formatRut, normalizeRut } from "@/lib/rut";

// Consulta de RUT en fuentes publicas chilenas (scraping server-side):
//  - nombrerutyfirma.com  -> nombre, sexo, direccion, comuna (personas)
//  - volanteomaleta.com   -> patentes (vehiculos a nombre del RUT)
//  - boletaofactura.com   -> razon social y giro (empresas)
// Todas se consultan por POST con campo "term" y el RUT en formato con puntos.

export type RutVehicle = {
  patente: string;
  tipo: string;
  marca: string;
  modelo: string;
  anio: string;
  motor: string;
};

export type RutCompany = {
  razonSocial: string;
  tipo: string;
  actividades: string;
};

export type RutProfile = {
  fullName: string;
  firstName: string;
  lastName: string;
  sex: string;
  address: string;
  commune: string;
  vehicles: RutVehicle[];
  company: RutCompany | null;
  sources: string[];
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function stripTags(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Convierte cada <table> de la pagina en una lista de objetos {encabezado: valor}.
function parseTable(html: string): Array<Record<string, string>> {
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) return [];
  const rows = [...tableMatch[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1]))
  );
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.toLowerCase());
  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
}

// Usamos el modulo https (HTTP/1.1) en vez de fetch: el WAF de estos sitios
// bloquea la huella del fetch de Node (403) pero acepta una peticion HTTP/1.1
// con cabeceras de navegador.
function postTerm(url: string, term: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const body = new URLSearchParams({ term }).toString();
      const request = https.request(
        {
          host: parsed.host,
          path: parsed.pathname,
          method: "POST",
          timeout: 9000,
          headers: {
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(body),
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-CL,es;q=0.9",
            Referer: url
          }
        },
        (response) => {
          if (!response.statusCode || response.statusCode >= 400) {
            response.resume();
            resolve(null);
            return;
          }
          const chunks: Buffer[] = [];
          response.on("data", (chunk: Buffer) => chunks.push(chunk));
          response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        }
      );
      request.on("timeout", () => request.destroy());
      request.on("error", () => resolve(null));
      request.write(body);
      request.end();
    } catch {
      resolve(null);
    }
  });
}

function findByHeader(record: Record<string, string>, includes: string): string {
  const key = Object.keys(record).find((header) => header.includes(includes));
  return key ? record[key] : "";
}

// En Chile el rutificador entrega el nombre como "Apellido1 Apellido2 Nombre1 Nombre2".
function splitChileanName(fullName: string) {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return { firstName: tokens[0] ?? "", lastName: "" };
  if (tokens.length === 2) return { firstName: tokens[1], lastName: tokens[0] };
  if (tokens.length === 3) return { firstName: tokens.slice(2).join(" "), lastName: tokens.slice(0, 2).join(" ") };
  return { firstName: tokens.slice(2).join(" "), lastName: tokens.slice(0, 2).join(" ") };
}

async function fetchPersona(rutDotted: string) {
  const html = await postTerm("https://www.nombrerutyfirma.com/rut", rutDotted);
  if (!html) return null;
  const rows = parseTable(html);
  const row = rows.find((record) => normalizeRut(findByHeader(record, "rut")) === normalizeRut(rutDotted)) ?? rows[0];
  if (!row) return null;
  const fullName = findByHeader(row, "nombre");
  const address = findByHeader(row, "direcci");
  const commune = findByHeader(row, "ciudad") || findByHeader(row, "comuna");
  const sex = findByHeader(row, "sexo");
  if (!fullName && !address) return null;
  return { fullName, address, commune, sex };
}

async function fetchVehicles(rutDotted: string): Promise<{ fullName: string; vehicles: RutVehicle[] } | null> {
  const html = await postTerm("https://www.volanteomaleta.com/rut", rutDotted);
  if (!html) return null;
  const rows = parseTable(html).filter((record) => normalizeRut(findByHeader(record, "rut")) === normalizeRut(rutDotted));
  if (!rows.length) return null;
  const vehicles = rows
    .map((record) => ({
      patente: findByHeader(record, "patente"),
      tipo: findByHeader(record, "tipo"),
      marca: findByHeader(record, "marca"),
      modelo: findByHeader(record, "modelo"),
      anio: findByHeader(record, "año") || findByHeader(record, "ano"),
      motor: findByHeader(record, "motor")
    }))
    .filter((vehicle) => vehicle.patente);
  const fullName = findByHeader(rows[0], "nombre");
  return { fullName, vehicles };
}

async function fetchCompany(rutDotted: string): Promise<RutCompany | null> {
  const html = await postTerm("https://www.boletaofactura.com/rut", rutDotted);
  if (!html) return null;
  const rows = parseTable(html);
  const row = rows.find((record) => normalizeRut(findByHeader(record, "rut")) === normalizeRut(rutDotted)) ?? rows[0];
  if (!row) return null;
  const razonSocial = findByHeader(row, "raz");
  if (!razonSocial) return null;
  return {
    razonSocial,
    tipo: findByHeader(row, "tipo"),
    actividades: findByHeader(row, "actividad")
  };
}

export async function lookupRutProfile(rut: string): Promise<RutProfile | null> {
  const rutDotted = formatRut(rut);
  if (!rutDotted) return null;

  const [persona, vehicleData, company] = await Promise.all([
    fetchPersona(rutDotted).catch(() => null),
    fetchVehicles(rutDotted).catch(() => null),
    fetchCompany(rutDotted).catch(() => null)
  ]);

  const fullName = persona?.fullName || vehicleData?.fullName || company?.razonSocial || "";
  const sources: string[] = [];
  if (persona) sources.push("nombrerutyfirma.com");
  if (vehicleData?.vehicles.length) sources.push("volanteomaleta.com");
  if (company) sources.push("boletaofactura.com");

  if (!fullName && !(vehicleData?.vehicles.length)) return null;

  // Para empresas el "nombre" es la razon social; para personas separamos apellidos/nombres.
  const isCompany = Boolean(company) && !persona;
  const name = isCompany ? { firstName: fullName, lastName: "" } : splitChileanName(fullName);

  return {
    fullName,
    firstName: name.firstName,
    lastName: name.lastName,
    sex: persona?.sex ?? "",
    address: persona?.address ?? "",
    commune: persona?.commune ?? "",
    vehicles: vehicleData?.vehicles ?? [],
    company: company ?? null,
    sources
  };
}

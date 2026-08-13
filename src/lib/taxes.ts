const siiVehicleCsvUrl = "https://www4.sii.cl/calcImpVehiculoNuevoInternet/listadoVehiculosCsv";
const siiUtmUrl = (year: number) => `https://www.sii.cl/valores_y_fechas/utm/utm${year}.htm`;

const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const fallbackUtmByYearMonth: Record<string, number> = {
  "2026-01": 69751,
  "2026-02": 69611,
  "2026-03": 69889,
  "2026-04": 69889,
  "2026-05": 70588,
  "2026-06": 71506,
  "2026-07": 71649,
  "2026-08": 71649,
  "2026-09": 71721
};

export type SiiVehicleTaxRecord = {
  citCode: string;
  brandName: string;
  vehicleType: string;
  modelName: string;
  lawType: string;
  payloadKg: number | null;
  seats: number | null;
  nox: number;
  urbanPerformance: number;
  validity: string;
};

let vehicleRecordsCache: Promise<Map<string, SiiVehicleTaxRecord>> | null = null;
const utmCache = new Map<number, Promise<Map<number, number>>>();

function parseDecimal(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized || normalized === "-1") return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  if (!normalized || normalized === "-1") return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ";" && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }

  values.push(value.trim());
  return values;
}

function normalizeCit(citCode: string) {
  return citCode.toUpperCase().replace(/\s+/g, "").trim();
}

async function loadSiiVehicleRecords() {
  const response = await fetch(siiVehicleCsvUrl, {
    cache: "no-store",
    headers: { accept: "text/csv,*/*" }
  });

  if (!response.ok) {
    throw new Error(`SII respondio ${response.status} al descargar homologacion`);
  }

  const csv = await response.text();
  const records = new Map<string, SiiVehicleTaxRecord>();
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const citCode = normalizeCit(cells[0] ?? "");
    const nox = parseDecimal(cells[7] ?? "");
    const urbanPerformance = parseDecimal(cells[8] ?? "");
    if (!citCode || nox === null || urbanPerformance === null) continue;

    records.set(citCode, {
      citCode,
      brandName: cells[1] ?? "",
      vehicleType: cells[2] ?? "",
      modelName: cells[3] ?? "",
      lawType: cells[4] ?? "",
      payloadKg: parseInteger(cells[5] ?? ""),
      seats: parseInteger(cells[6] ?? ""),
      nox,
      urbanPerformance,
      validity: cells[9] ?? ""
    });
  }

  return records;
}

async function getSiiVehicleRecords() {
  vehicleRecordsCache = vehicleRecordsCache ?? loadSiiVehicleRecords();
  return vehicleRecordsCache;
}

function parseUtmRows(html: string) {
  const rows = new Map<number, number>();
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ");

  monthNames.forEach((monthName, index) => {
    const pattern = new RegExp(`${monthName}\\s+([0-9.]{5,})`, "i");
    const match = plain.match(pattern);
    if (!match) return;
    const amount = Number.parseInt(match[1].replace(/\./g, ""), 10);
    if (amount) rows.set(index + 1, amount);
  });

  return rows;
}

async function loadUtmValues(year: number) {
  const response = await fetch(siiUtmUrl(year), {
    cache: "no-store",
    headers: { accept: "text/html,*/*" }
  });

  if (!response.ok) {
    throw new Error(`SII respondio ${response.status} al descargar UTM`);
  }

  return parseUtmRows(await response.text());
}

async function getUtmValues(year: number) {
  if (!utmCache.has(year)) {
    utmCache.set(year, loadUtmValues(year));
  }
  return utmCache.get(year)!;
}

export async function getUtmForDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00`) : value;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const key = `${year}-${String(month).padStart(2, "0")}`;

  try {
    const values = await getUtmValues(year);
    return values.get(month) ?? fallbackUtmByYearMonth[key] ?? null;
  } catch {
    return fallbackUtmByYearMonth[key] ?? null;
  }
}

export async function calculateGreenTax({
  citCode,
  salePriceWithVat,
  calculationDate = new Date()
}: {
  citCode: string;
  salePriceWithVat: number;
  calculationDate?: string | Date;
}) {
  const records = await getSiiVehicleRecords();
  const record = records.get(normalizeCit(citCode));

  if (!record) {
    return {
      ok: false as const,
      message: "Codigo CIT no encontrado en el listado publico del SII."
    };
  }

  const utm = await getUtmForDate(calculationDate);
  if (!utm) {
    return {
      ok: false as const,
      message: "No se pudo obtener la UTM para la fecha indicada."
    };
  }

  if (record.seats !== null && record.seats > 9) {
    return {
      ok: true as const,
      exempt: true,
      amountClp: 0,
      taxUtm: 0,
      utm,
      record,
      message: "Vehiculo con mas de 9 asientos: posible exencion segun regla general."
    };
  }

  if (record.payloadKg !== null && record.payloadKg >= 2000) {
    return {
      ok: true as const,
      exempt: true,
      amountClp: 0,
      taxUtm: 0,
      utm,
      record,
      message: "Vehiculo con carga util de 2.000 kg o mas: posible exencion segun regla general."
    };
  }

  const taxUtm = ((35 / record.urbanPerformance) + 120 * record.nox) * (salePriceWithVat * 0.00000006);
  const amountClp = Math.round(taxUtm * utm);

  return {
    ok: true as const,
    exempt: false,
    amountClp,
    taxUtm,
    utm,
    record,
    message: "Calculado con listado publico SII, formula legal vigente y UTM SII."
  };
}

export async function fetchLasCondesPermit({
  netPrice,
  invoiceDate
}: {
  netPrice: number;
  invoiceDate: string;
}) {
  const [year, month, day] = invoiceDate.split("-");
  const body = new URLSearchParams({
    FECFAC: `${day}/${month}/${year}`,
    VALNETO: String(Math.round(netPrice)),
    VALPERMISO: "0"
  });

  const response = await fetch("https://www.lascondesonline.cl/Permisos%20Circulacion/asp/ConsultaValorPermiso.asp", {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "Mozilla/5.0",
      referer: "https://www.lascondesonline.cl/Permisos%20Circulacion/asp/ConsultaValorPermiso.asp"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`Las Condes respondio ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/<input[^>]*name=["']VALPERMISO["'][^>]*value=["']([^"']+)["']/i);
  const rawValue = match?.[1]?.replace(/\./g, "").replace(/[^\d]/g, "");
  const amount = rawValue ? Number.parseInt(rawValue, 10) : null;
  if (!amount && amount !== 0) {
    throw new Error("Las Condes no devolvio VALPERMISO.");
  }

  return {
    amount,
    invoiceDate: `${day}/${month}/${year}`,
    netPrice: Math.round(netPrice)
  };
}

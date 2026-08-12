import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth-core";

const prisma = new PrismaClient();

const brands = ["SUZUKI", "MAZDA", "GWM", "CHANGAN"];

const statuses = [
  ["NUEVO LEAD", "NUEVO", 10],
  ["CONTACTADO", "CONTACTADO", 20],
  ["EN SEGUIMIENTO", "CONTACTADO", 30],
  ["COTIZADO", "COTIZADO", 40],
  ["NEGOCIANDO", "NEGOCIANDO", 50],
  ["CRÉDITO EN EVALUACIÓN", "CRÉDITO", 60],
  ["CRÉDITO APROBADO", "CRÉDITO", 70],
  ["RESERVADO", "RESERVADO", 80],
  ["VENDIDO", "VENDIDO", 90],
  ["ENTREGADO", "ENTREGADO", 100],
  ["POSTVENTA", "ENTREGADO", 110],
  ["RENOVACIÓN", "RENOVACIÓN", 120],
  ["PERDIDO", "PERDIDO", 130]
] as const;

const origins = ["Sala", "WhatsApp", "Instagram", "Facebook", "Web", "Referido", "Base de datos", "Otro"];

const acronyms = [
  ["MT", "Transmisión manual", "Caja manual."],
  ["AT", "Transmisión automática", "Caja automática."],
  ["CVT", "Transmisión continuamente variable", "Tipo de transmisión automática sin marchas fijas tradicionales."],
  ["DCT", "Transmisión de doble embrague", "Caja automática con dos embragues."],
  ["AMT", "Transmisión manual automatizada", "Caja manual con accionamiento automatizado."],
  ["2WD", "Tracción en dos ruedas", "Tracción en un eje."],
  ["AWD", "Tracción integral", "Tracción en las cuatro ruedas según el sistema del vehículo."],
  ["4WD", "Tracción 4x4", "Tracción a las cuatro ruedas."],
  ["HEV", "Híbrido no enchufable", "Vehículo híbrido que no requiere carga externa."],
  ["PHEV", "Híbrido enchufable", "Vehículo híbrido con carga externa."],
  ["EV", "Vehículo eléctrico", "Vehículo impulsado por energía eléctrica."],
  ["BEV", "Vehículo eléctrico a batería", "Vehículo 100% eléctrico con batería."],
  ["REEV", "Eléctrico de rango extendido", "Vehículo eléctrico con generador auxiliar para extender autonomía."]
] as const;

const notificationSettings = [
  ["telegram", true, { channel: "telegram" }],
  ["birthdays", true, { daysBefore: [7, 1, 0] }],
  ["followups", true, { overdueDaysByStatus: { "NUEVO LEAD": 2, COTIZADO: 3, NEGOCIANDO: 2, "CRÉDITO EN EVALUACIÓN": 2 } }],
  ["credits", true, { monthsBefore: [12, 6, 3, 1] }],
  ["renewals", true, { windowsMonths: [12, 6, 3, 1] }],
  ["deliveries", true, {}],
  ["promotions", true, {}],
  ["price_changes", true, {}],
  ["daily_summary", false, { time: "08:30", timezone: "America/Santiago" }]
] as const;

async function main() {
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL ?? "victorherrera@sergioescobar.cl").trim().toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (adminPassword && adminPassword.length >= 8) {
    await prisma.appUser.upsert({
      where: { email: adminEmail },
      update: {
        name: process.env.INITIAL_ADMIN_NAME ?? "Victor Herrera",
        passwordHash: await hashPassword(adminPassword),
        role: "ADMIN",
        status: "ACTIVO"
      },
      create: {
        name: process.env.INITIAL_ADMIN_NAME ?? "Victor Herrera",
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        role: "ADMIN",
        status: "ACTIVO"
      }
    });
  } else {
    console.warn("INITIAL_ADMIN_PASSWORD no configurada o menor a 8 caracteres. No se creo usuario inicial.");
  }

  for (const name of brands) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  for (const [name, stage, position] of statuses) {
    await prisma.customerStatus.upsert({
      where: { name },
      update: { stage, position },
      create: { name, stage, position }
    });
  }

  for (const name of origins) {
    await prisma.customerOrigin.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  for (const [code, meaning, description] of acronyms) {
    await prisma.acronym.upsert({
      where: { code },
      update: { meaning, description, source: "ESTÁNDAR" },
      create: { code, meaning, description, source: "ESTÁNDAR" }
    });

    await prisma.studyQuestion.upsert({
      where: { id: `seed-${code}` },
      update: {},
      create: {
        id: `seed-${code}`,
        category: "Siglas",
        prompt: `¿Qué significa ${code}?`,
        answer: meaning,
        explanation: description,
        source: "Diccionario estándar inicial"
      }
    });
  }

  for (const [key, enabled, config] of notificationSettings) {
    await prisma.notificationSetting.upsert({
      where: { key },
      update: { enabled, configJson: JSON.stringify(config) },
      create: { key, enabled, configJson: JSON.stringify(config) }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

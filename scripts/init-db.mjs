import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  status TEXT NOT NULL DEFAULT 'ACTIVO',
  lastLoginAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  tokenHash TEXT NOT NULL UNIQUE,
  expiresAt DATETIME NOT NULL,
  usedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES app_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_userId_expiresAt_idx ON password_reset_tokens(userId, expiresAt);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY NOT NULL,
  brandId TEXT NOT NULL,
  name TEXT NOT NULL,
  segment TEXT,
  fuelTypes TEXT,
  transmissions TEXT,
  tractions TEXT,
  imagePath TEXT,
  commercialPosition INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'BORRADOR',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brandId) REFERENCES brands(id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS models_brandId_name_key ON models(brandId, name);

CREATE TABLE IF NOT EXISTS versions (
  id TEXT PRIMARY KEY NOT NULL,
  brandId TEXT NOT NULL,
  modelId TEXT NOT NULL,
  name TEXT NOT NULL,
  sapCode TEXT,
  modelYear TEXT,
  engine TEXT,
  displacement TEXT,
  turbo BOOLEAN,
  power TEXT,
  torque TEXT,
  transmission TEXT,
  gears TEXT,
  traction TEXT,
  fuelType TEXT,
  consumption TEXT,
  autonomy TEXT,
  passengers TEXT,
  cargoCapacity TEXT,
  wheels TEXT,
  screen TEXT,
  carPlay TEXT,
  androidAuto TEXT,
  camera TEXT,
  sensors TEXT,
  roof TEXT,
  seats TEXT,
  climateControl TEXT,
  airbags TEXT,
  adas TEXT,
  cruiseControl TEXT,
  equipmentSummary TEXT,
  safetySummary TEXT,
  warranty TEXT,
  observations TEXT,
  commercialOrder INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'BORRADOR',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brandId) REFERENCES brands(id) ON DELETE RESTRICT,
  FOREIGN KEY (modelId) REFERENCES models(id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS versions_modelId_name_key ON versions(modelId, name);

CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY NOT NULL,
  versionId TEXT NOT NULL,
  priceType TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP',
  effectiveFrom DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effectiveTo DATETIME,
  status TEXT NOT NULL DEFAULT 'DETECTADO',
  sourceId TEXT,
  documentId TEXT,
  approvedBy TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (versionId) REFERENCES versions(id) ON DELETE RESTRICT,
  FOREIGN KEY (documentId) REFERENCES documents(id),
  FOREIGN KEY (sourceId) REFERENCES updates(id)
);
CREATE INDEX IF NOT EXISTS prices_versionId_priceType_status_idx ON prices(versionId, priceType, status);

CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY NOT NULL,
  versionId TEXT NOT NULL,
  priceId TEXT,
  priceType TEXT NOT NULL,
  previousAmount INTEGER,
  newAmount INTEGER NOT NULL,
  difference INTEGER,
  changedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sourceName TEXT,
  sourceId TEXT,
  approvedBy TEXT,
  observation TEXT,
  FOREIGN KEY (versionId) REFERENCES versions(id) ON DELETE RESTRICT,
  FOREIGN KEY (priceId) REFERENCES prices(id)
);

CREATE TABLE IF NOT EXISTS commercial_campaigns (
  id TEXT PRIMARY KEY NOT NULL,
  brandId TEXT,
  modelId TEXT,
  versionId TEXT,
  title TEXT NOT NULL,
  promotionType TEXT NOT NULL,
  condition TEXT,
  exception TEXT,
  benefit TEXT,
  startDate DATETIME,
  endDate DATETIME,
  status TEXT NOT NULL DEFAULT 'BORRADOR',
  sourceId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (modelId) REFERENCES models(id),
  FOREIGN KEY (versionId) REFERENCES versions(id)
);

CREATE TABLE IF NOT EXISTS bonuses (
  id TEXT PRIMARY KEY NOT NULL,
  brandId TEXT,
  modelId TEXT,
  versionId TEXT,
  name TEXT NOT NULL,
  amount INTEGER,
  conditions TEXT,
  startDate DATETIME,
  endDate DATETIME,
  status TEXT NOT NULL DEFAULT 'BORRADOR',
  sourceId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (versionId) REFERENCES versions(id)
);

CREATE TABLE IF NOT EXISTS benefits (
  id TEXT PRIMARY KEY NOT NULL,
  brandId TEXT,
  modelId TEXT,
  versionId TEXT,
  name TEXT NOT NULL,
  appliesTo TEXT,
  exception TEXT,
  conditions TEXT,
  startDate DATETIME,
  endDate DATETIME,
  status TEXT NOT NULL DEFAULT 'BORRADOR',
  sourceId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (versionId) REFERENCES versions(id)
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY NOT NULL,
  brandId TEXT,
  type TEXT NOT NULL,
  originalName TEXT NOT NULL,
  storedPath TEXT,
  mimeType TEXT,
  extension TEXT,
  textSource TEXT,
  receivedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'DETECTADO',
  FOREIGN KEY (brandId) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS document_imports (
  id TEXT PRIMARY KEY NOT NULL,
  documentId TEXT,
  importType TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'EN_REVISION',
  detectedBrand TEXT,
  detectedMonth TEXT,
  summaryJson TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (documentId) REFERENCES documents(id)
);

CREATE TABLE IF NOT EXISTS document_extractions (
  id TEXT PRIMARY KEY NOT NULL,
  importId TEXT NOT NULL,
  category TEXT NOT NULL,
  rawText TEXT NOT NULL,
  payloadJson TEXT,
  confidence TEXT NOT NULL DEFAULT 'REQUIERE_REVISION',
  status TEXT NOT NULL DEFAULT 'DETECTADO',
  FOREIGN KEY (importId) REFERENCES document_imports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS updates (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  sourceType TEXT NOT NULL,
  documentId TEXT,
  rawText TEXT,
  status TEXT NOT NULL DEFAULT 'DETECTADO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approvedAt DATETIME,
  approvedBy TEXT
);

CREATE TABLE IF NOT EXISTS update_items (
  id TEXT PRIMARY KEY NOT NULL,
  updateId TEXT NOT NULL,
  category TEXT NOT NULL,
  brandName TEXT,
  modelName TEXT,
  versionName TEXT,
  fieldName TEXT,
  previousValue TEXT,
  proposedValue TEXT,
  amount INTEGER,
  rawText TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'REQUIERE_REVISION',
  status TEXT NOT NULL DEFAULT 'DETECTADO',
  ambiguityReason TEXT,
  payloadJson TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updateId) REFERENCES updates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  entityType TEXT NOT NULL,
  entityId TEXT,
  brandName TEXT,
  modelName TEXT,
  versionName TEXT,
  fieldModified TEXT NOT NULL,
  previousValue TEXT,
  newValue TEXT,
  source TEXT,
  user TEXT,
  observation TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS acronyms (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  meaning TEXT,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'DEFINIDO_MANUALMENTE',
  status TEXT NOT NULL DEFAULT 'VIGENTE',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_statuses (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  stage TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS customer_origins (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT,
  rut TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  birthDate DATETIME,
  address TEXT,
  commune TEXT,
  city TEXT,
  region TEXT,
  rutLookupConsentAt DATETIME,
  rutLookupSource TEXT,
  statusId TEXT,
  originId TEXT,
  interestedBrand TEXT,
  interestedModel TEXT,
  interestedVersion TEXT,
  budget INTEGER,
  purchaseType TEXT,
  currentVehicle TEXT,
  currentPlate TEXT,
  notes TEXT,
  lastContactAt DATETIME,
  nextActionType TEXT,
  nextActionAt DATETIME,
  nextActionNote TEXT,
  nextActionPriority TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (statusId) REFERENCES customer_statuses(id),
  FOREIGN KEY (originId) REFERENCES customer_origins(id)
);
CREATE INDEX IF NOT EXISTS customers_firstName_lastName_rut_phone_email_idx ON customers(firstName, lastName, rut, phone, email);

CREATE TABLE IF NOT EXISTS customer_vehicles (
  id TEXT PRIMARY KEY NOT NULL,
  customerId TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT,
  year TEXT,
  plate TEXT,
  vin TEXT,
  purchaseDate DATETIME,
  deliveryDate DATETIME,
  purchasePrice INTEGER,
  financingType TEXT,
  executive TEXT,
  observations TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_interests (
  id TEXT PRIMARY KEY NOT NULL,
  customerId TEXT NOT NULL,
  brandId TEXT,
  modelId TEXT,
  versionId TEXT,
  brandName TEXT,
  modelName TEXT,
  versionName TEXT,
  source TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (versionId) REFERENCES versions(id)
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY NOT NULL,
  customerId TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  activityAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  customerId TEXT,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  dueAt DATETIME NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'PENDIENTE',
  lastNotificationAt DATETIME,
  snoozedUntil DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS reminders_dueAt_status_idx ON reminders(dueAt, status);

CREATE TABLE IF NOT EXISTS credit_contracts (
  id TEXT PRIMARY KEY NOT NULL,
  customerId TEXT NOT NULL,
  financialEntity TEXT,
  purchaseDate DATETIME,
  creditStartDate DATETIME,
  installments INTEGER,
  firstInstallmentDate DATETIME,
  lastInstallmentDate DATETIME,
  endDateSource TEXT,
  financedAmount INTEGER,
  downPayment INTEGER,
  installmentAmount INTEGER,
  rate TEXT,
  cae TEXT,
  creditType TEXT,
  observations TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY NOT NULL,
  customerId TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'BORRADOR',
  snapshotJson TEXT NOT NULL,
  totalAmount INTEGER,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY NOT NULL,
  quoteId TEXT NOT NULL,
  versionId TEXT,
  brandName TEXT NOT NULL,
  modelName TEXT NOT NULL,
  versionName TEXT NOT NULL,
  priceUsed INTEGER,
  bonusUsed INTEGER,
  conditions TEXT,
  FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (versionId) REFERENCES versions(id)
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY NOT NULL,
  customerId TEXT NOT NULL,
  quoteId TEXT,
  brandName TEXT NOT NULL,
  modelName TEXT NOT NULL,
  versionName TEXT,
  agreedPrice INTEGER,
  saleDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'VENDIDO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY NOT NULL,
  saleId TEXT,
  customerId TEXT,
  plate TEXT,
  deliveryAt DATETIME,
  status TEXT NOT NULL DEFAULT 'PROGRAMADA',
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id TEXT PRIMARY KEY NOT NULL,
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  configJson TEXT,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_history (
  id TEXT PRIMARY KEY NOT NULL,
  channel TEXT NOT NULL,
  eventType TEXT NOT NULL,
  entityType TEXT,
  entityId TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  sentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  error TEXT
);

CREATE TABLE IF NOT EXISTS study_questions (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'VIGENTE',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_progress (
  id TEXT PRIMARY KEY NOT NULL,
  questionId TEXT NOT NULL,
  correctCount INTEGER NOT NULL DEFAULT 0,
  wrongCount INTEGER NOT NULL DEFAULT 0,
  review BOOLEAN NOT NULL DEFAULT 0,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (questionId) REFERENCES study_questions(id) ON DELETE CASCADE
);
`);

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

ensureColumn("customers", "address", "TEXT");
ensureColumn("customers", "commune", "TEXT");
ensureColumn("customers", "city", "TEXT");
ensureColumn("customers", "region", "TEXT");
ensureColumn("customers", "rutLookupConsentAt", "DATETIME");
ensureColumn("customers", "rutLookupSource", "TEXT");

db.close();
console.log(`Base SQLite inicializada en ${dbPath}`);

export const INFO_STATUS = {
  DRAFT: "BORRADOR",
  DETECTED: "DETECTADO",
  IN_REVIEW: "EN_REVISION",
  APPROVED: "APROBADO",
  ACTIVE: "VIGENTE",
  REPLACED: "REEMPLAZADO",
  EXPIRED: "VENCIDO",
  IGNORED: "IGNORADO"
} as const;

export const CONFIDENCE = {
  HIGH: "ALTA_CONFIANZA",
  REVIEW: "REQUIERE_REVISION",
  AMBIGUOUS: "AMBIGUA"
} as const;

export const PRICE_TYPES = [
  ["LIST", "Precio lista"],
  ["CASH", "Precio contado"],
  ["FINANCING", "Precio financiamiento"],
  ["CAMPAIGN", "Precio campana"]
] as const;

export const SALES_STAGES = ["NUEVO", "CONTACTADO", "COTIZADO", "NEGOCIANDO", "CREDITO", "RESERVADO", "VENDIDO", "ENTREGADO"];

export const VEHICLE_COMPARE_FIELDS = [
  ["Codigo CIT", "sapCode"],
  ["Ano modelo", "modelYear"],
  ["Cilindrada", "displacement"],
  ["Motor", "engine"],
  ["Potencia", "power"],
  ["Torque", "torque"],
  ["Transmision", "transmission"],
  ["Traccion", "traction"],
  ["Combustible", "fuelType"],
  ["Consumo", "consumption"],
  ["Llantas", "wheels"],
  ["Pantalla", "screen"],
  ["CarPlay", "carPlay"],
  ["Android Auto", "androidAuto"],
  ["Camara", "camera"],
  ["Techo", "roof"],
  ["Asientos", "seats"],
  ["Climatizador", "climateControl"],
  ["Airbags", "airbags"],
  ["ADAS", "adas"],
  ["Control crucero", "cruiseControl"],
  ["Sensores", "sensors"],
  ["Maletero", "cargoCapacity"],
  ["Garantia", "warranty"],
  ["Equipamiento", "equipmentSummary"]
] as const;

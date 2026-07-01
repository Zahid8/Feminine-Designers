import type { GarmentType, MeasurementTemplate, StoreSettings } from "@/types/domain";

export const STORE_SETTINGS: StoreSettings = {
  id: "settings-default",
  storeName: "Feminine Designer by Sajida",
  brandSubtitle: "By Sajida",
  gstin: "06AYWPB8525D1ZB",
  phonePrimary: "9718926185",
  phoneSecondary: "8447371925",
  email: "bsajida77@gmail.com",
  addressLines: [
    "Shop No. 222, 2nd Floor",
    "City Centre Mall",
    "MG Road Metro Station",
    "Gurugram-122002"
  ],
  logoPath: "/Logo.PNG",
  defaultCgstRate: 2.5,
  defaultSgstRate: 2.5,
  receiptPrefix: "SJD",
  receiptResetFrequency: "yearly",
  currencyCode: "INR",
  measurementUnitDefault: "in",
  termsAndConditions:
    "Delivery date is approximate. Please bring this receipt at delivery. Alterations after delivery may be chargeable."
};

export const GARMENT_TYPES: GarmentType[] = [
  "Blouse",
  "Suit",
  "Salwar Suit",
  "Kurti",
  "Lehenga",
  "Gown",
  "Saree Fall/Pico",
  "Petticoat",
  "Alteration",
  "Dupatta",
  "Skirt",
  "Top",
  "Custom"
].map((name, index) => ({ id: `garment-${index + 1}`, name, active: true }));

const baseMeasurementCodes = [
  ["length", "L", "Length"],
  ["chest", "C", "Chest"],
  ["waist", "K", "Waist"],
  ["hip", "H", "Hip"],
  ["depth", "D", "Depth"],
  ["shoulder", "SH", "Shoulder"],
  ["round", "R", "Round"],
  ["sleeve_length", "SL", "Sleeve Length"],
  ["neck", "N", "Neck"],
  ["measurement_c_2", "C2", "Secondary C"],
  ["measurement_l_2", "L2", "Secondary L"],
  ["piping", "P", "Piping"],
  ["bust", "B", "Bust"],
  ["armhole", "A", "Armhole"],
  ["measurement_h_2", "H2", "Secondary H"],
  ["tucks", "T", "Tucks"],
  ["ak", "AK", "AK"],
  ["opening", "O", "Opening"],
  ["collar", "CL", "Collar"],
  ["thigh", "TH", "Thigh"],
  ["knee", "KN", "Knee"],
  ["cup_size", "CP", "Cup Size"],
  ["backcross", "BC", "Backcross"],
  ["frontcross", "FC", "Frontcross"]
] as const;

function makeFields(templateId: string) {
  return baseMeasurementCodes.map(([fieldKey, code, longLabel], index) => ({
    id: `${templateId}-${fieldKey}`,
    fieldKey,
    displayCode: code,
    displayLabel: code,
    longLabel,
    inputType: "number" as const,
    unit: "in" as const,
    isRequired: index < 6,
    sortOrder: index + 1,
    active: true
  }));
}

export const MEASUREMENT_TEMPLATES: MeasurementTemplate[] = [
  {
    id: "tmpl-blouse",
    name: "Blouse measurements",
    garmentCategories: ["Blouse"],
    description: "Compact blouse-focused measurement set based on the paper bill codes.",
    isActive: true,
    fields: makeFields("tmpl-blouse")
  },
  {
    id: "tmpl-suit-kurti",
    name: "Suit/Kurti measurements",
    garmentCategories: ["Suit", "Salwar Suit", "Kurti", "Top"],
    description: "Reusable upper-body and length measurements for daily stitching orders.",
    isActive: true,
    fields: makeFields("tmpl-suit-kurti")
  },
  {
    id: "tmpl-lehenga-gown",
    name: "Gown/Lehenga measurements",
    garmentCategories: ["Gown", "Lehenga", "Skirt"],
    description: "General template for full-length garments and occasion wear.",
    isActive: true,
    fields: makeFields("tmpl-lehenga-gown")
  },
  {
    id: "tmpl-general",
    name: "General/custom measurements",
    garmentCategories: ["Custom", "Alteration", "Petticoat", "Dupatta", "Saree Fall/Pico"],
    description: "Fallback configurable template for alteration and custom work.",
    isActive: true,
    fields: makeFields("tmpl-general")
  }
];

export const ORDER_STATUSES = [
  "Draft",
  "New",
  "In Stitching",
  "Ready",
  "Delivered",
  "Cancelled"
] as const;

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  Draft: ["New", "Cancelled"],
  New: ["In Stitching", "Cancelled"],
  "In Stitching": ["Ready", "Cancelled"],
  Ready: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: []
};

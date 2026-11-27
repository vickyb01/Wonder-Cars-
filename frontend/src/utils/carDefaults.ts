import type {
  AccidentHistory,
  BatteryDetails,
  Car,
  CategorizedFeatures,
  DocumentItem,
  InspectionItem,
  ServiceHistory,
  TyreDetail,
  UsageHistory,
} from '../types/car.ts';

export const EXTERIOR_COMPONENTS = [
  'Front bumper',
  'Rear bumper',
  'Bonnet',
  'Roof',
  'Front left door',
  'Front right door',
  'Rear left door',
  'Rear right door',
  'Left and right fenders',
  'Side mirrors',
  'Headlights',
  'Taillights',
  'Windshield',
  'Other windows',
  'Paint condition',
  'Visible scratches',
  'Dents',
  'Rust',
  'Repainted panels',
] as const;

export const INTERIOR_COMPONENTS = [
  'Steering wheel',
  'Dashboard',
  'Instrument cluster',
  'Front seats',
  'Rear seats',
  'Seat belts',
  'Door panels',
  'Roof lining',
  'Floor mats',
  'AC system',
  'Power windows',
  'Music system',
  'Infotainment screen',
  'Speakers',
  'Gear lever',
  'Centre console',
  'Boot interior',
] as const;

export const MECHANICAL_COMPONENTS = [
  'Engine condition',
  'Engine oil leakage check',
  'Gearbox condition',
  'Clutch condition',
  'Brake condition',
  'Suspension',
  'Steering',
  'Battery',
  'Cooling system',
  'Radiator',
  'Electrical systems',
  'Tyre condition',
  'Exhaust system',
  'Warning lights',
] as const;

export const DOCUMENT_KEYS: { key: string; label: string }[] = [
  { key: 'rc', label: 'Registration Certificate (RC)' },
  { key: 'insurance', label: 'Comprehensive Insurance' },
  { key: 'puc', label: 'Pollution Under Control (PUC)' },
  { key: 'fitness', label: 'Fitness Certificate' },
  { key: 'noc', label: 'Inter-State NOC' },
  { key: 'hypothecation', label: 'Loan / Hypothecation Status' },
  { key: 'challans', label: 'Pending Traffic Challans' },
  { key: 'transfer', label: 'Ownership Transfer Assistance' },
  { key: 'tax', label: 'Road Tax Status' },
];

export const TYRE_POSITIONS = [
  'Front Left',
  'Front Right',
  'Rear Left',
  'Rear Right',
  'Spare Tyre',
] as const;

export function createDefaultInspectionList(components: readonly string[]): InspectionItem[] {
  return components.map((component) => ({
    component,
    status: 'Not Inspected',
    notes: '',
  }));
}

export function createDefaultDocuments(): DocumentItem[] {
  return DOCUMENT_KEYS.map((item) => ({
    key: item.key,
    label: item.label,
    status: 'Not Verified',
    note: '',
  }));
}

export function createDefaultTyres(): TyreDetail[] {
  return TYRE_POSITIONS.map((position) => ({
    position,
    brand: '',
    treadCondition: 'Not Inspected',
    replacementNote: '',
  }));
}

export function createDefaultBattery(): BatteryDetails {
  return {
    brand: '',
    age: '',
    condition: 'Not Inspected',
    replacementHistory: '',
  };
}

export function createDefaultAccidentHistory(): AccidentHistory {
  return {
    overallStatus: 'Not Disclosed',
    majorAccidents: 'Not Disclosed',
    minorAccidents: 'Not Disclosed',
    repaintedPanels: 'Not Inspected',
    replacedParts: 'Not Disclosed',
    floodDamage: 'Not Disclosed',
    structuralDamage: 'Not Inspected',
    insuranceClaims: 'Verification Pending',
    majorMechanicalRepairs: 'Not Disclosed',
    otherRepairNotes: '',
    evidenceNote: '',
  };
}

export function createDefaultServiceHistory(): ServiceHistory {
  return {
    lastServiceDate: '',
    lastServiceOdometerKm: undefined,
    records: [],
  };
}

export function createDefaultFeatures(): CategorizedFeatures {
  return {
    comfort: [],
    entertainment: [],
    safety: [],
    exterior: [],
  };
}

export function createDefaultUsageHistory(): UsageHistory {
  return {
    previousOwnersCount: 0,
    usageType: 'Personal',
    drivingPattern: 'Not Disclosed',
    reasonForSelling: '',
    registrationHistoryNote: '',
    recordVerification: 'Seller Provided',
  };
}

export function mergeInspectionItems(
  defaults: readonly string[],
  existing?: InspectionItem[]
): InspectionItem[] {
  const map = new Map((existing || []).map((item) => [item.component, item]));
  return defaults.map(
    (component) =>
      map.get(component) || {
        component,
        status: 'Not Inspected',
        notes: '',
      }
  );
}

export function mergeDocuments(existing?: DocumentItem[]): DocumentItem[] {
  const map = new Map((existing || []).map((item) => [item.key, item]));
  return DOCUMENT_KEYS.map(
    (def) =>
      map.get(def.key) || {
        key: def.key,
        label: def.label,
        status: 'Not Verified',
        note: '',
      }
  );
}

export function mergeTyres(existing?: TyreDetail[]): TyreDetail[] {
  const map = new Map((existing || []).map((item) => [item.position, item]));
  return TYRE_POSITIONS.map(
    (pos) =>
      map.get(pos) || {
        position: pos,
        brand: '',
        treadCondition: 'Not Inspected',
        replacementNote: '',
      }
  );
}

export function normalizeCarRecord(raw: Partial<Car> & { id: string }): Car {
  const gallery =
    Array.isArray(raw.gallery) && raw.gallery.length > 0
      ? raw.gallery
      : (raw.images || []).map((url, idx) => ({
          id: `${raw.id}-img-${idx + 1}`,
          url,
          category: 'Exterior' as const,
          angleLabel: idx === 0 ? 'Front-Left 45° Studio View' : `Gallery Photo ${idx + 1}`,
          order: idx,
        }));

  const images = gallery.length > 0 ? gallery.map((g) => g.url) : raw.images || [];

  return {
    id: raw.id,
    listingCode: raw.listingCode || `SM-${raw.id.slice(-4).toUpperCase()}`,
    slug: raw.slug || raw.id,
    brand: raw.brand || '',
    model: raw.model || '',
    variant: raw.variant || 'Standard',
    year: Number(raw.year || 2022),
    registrationYear: raw.registrationYear || Number(raw.year || 2022),
    registrationDate: raw.registrationDate || '',
    priceInr: Number(raw.priceInr || 0),
    priceType: raw.priceType || 'Negotiable',
    priceLastUpdated: raw.priceLastUpdated || raw.createdAt || new Date().toISOString(),
    priceExplanation: raw.priceExplanation || '',
    discountNote: raw.discountNote || '',
    marketComparisonNote: raw.marketComparisonNote || '',
    kilometres: Number(raw.kilometres || 0),
    fuelType: raw.fuelType || 'Petrol',
    transmission: raw.transmission || 'Automatic',
    ownership: raw.ownership || '1st Owner',
    location: raw.location || 'Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi, India - 110092',
    status: raw.status || 'Available',
    featured: Boolean(raw.featured),
    featuredOrder: typeof raw.featuredOrder === 'number' ? raw.featuredOrder : undefined,
    category: raw.category || 'Luxury & Performance',
    bodyType: raw.bodyType || 'Coupe',
    color: raw.color || '',
    interiorColor: raw.interiorColor || '',
    seatingCapacity: raw.seatingCapacity,
    doors: raw.doors,
    engineCc: raw.engineCc || '',
    engine: raw.engine || '',
    cylinders: raw.cylinders || '',
    power: raw.power || '',
    torque: raw.torque || '',
    drivetrain: raw.drivetrain || '',
    claimedMileage: raw.claimedMileage || '',
    emissionStandard: raw.emissionStandard || '',
    registrationState: raw.registrationState || '',
    insuranceValidUntil: raw.insuranceValidUntil || '',
    warrantyPeriod:
      raw.warrantyPeriod ||
      (Number(raw.year || 2022) >= 2023
        ? '2 Years'
        : Number(raw.year || 2022) >= 2021
        ? '1 Year'
        : '6 Months'),
    warrantyDetails:
      raw.warrantyPeriod === 'No Warranty'
        ? raw.warrantyDetails || 'Standard inspection verified'
        : raw.warrantyDetails || 'Engine, Gearbox, Electronics & 24×7 Roadside Assistance',
    images,
    gallery,
    videoWalkthroughUrl: raw.videoWalkthroughUrl || '',
    description: raw.description || '',
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    features: {
      comfort: raw.features?.comfort || [],
      entertainment: raw.features?.entertainment || [],
      safety: raw.features?.safety || [],
      exterior: raw.features?.exterior || [],
    },
    usageHistory: {
      ...createDefaultUsageHistory(),
      ...(raw.usageHistory || {}),
    },
    exteriorReport: mergeInspectionItems(EXTERIOR_COMPONENTS, raw.exteriorReport),
    interiorReport: mergeInspectionItems(INTERIOR_COMPONENTS, raw.interiorReport),
    mechanicalReport: mergeInspectionItems(MECHANICAL_COMPONENTS, raw.mechanicalReport),
    tyreDetails: mergeTyres(raw.tyreDetails),
    batteryDetails: {
      ...createDefaultBattery(),
      ...(raw.batteryDetails || {}),
    },
    accidentHistory: {
      ...createDefaultAccidentHistory(),
      ...(raw.accidentHistory || {}),
    },
    serviceHistory: {
      lastServiceDate: raw.serviceHistory?.lastServiceDate || '',
      lastServiceOdometerKm: raw.serviceHistory?.lastServiceOdometerKm,
      records: Array.isArray(raw.serviceHistory?.records) ? raw.serviceHistory.records : [],
    },
    documents: mergeDocuments(raw.documents),
    sellerName: raw.sellerName || 'Wonder Cars Preet Vihar Showroom',
    sellerType: raw.sellerType || 'Certified Gallery',
    sellerProfile:
      raw.sellerProfile ||
      'Wonder Cars official showroom at Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi, India - 110092.',
    sellerPhone: raw.sellerPhone || '+91 83840 68347',
    sellerWhatsapp: raw.sellerWhatsapp || '918384068347',
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

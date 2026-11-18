export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  country: string;
  aliases: string[];
}

export const BRAND_CATALOG: BrandItem[] = [
  {
    id: 'maruti-suzuki',
    name: 'Maruti Suzuki',
    slug: 'maruti-suzuki',
    country: 'India · Japan',
    aliases: ['maruti-suzuki', 'maruti suzuki', 'maruti', 'suzuki'],
  },
  {
    id: 'tata',
    name: 'Tata',
    slug: 'tata',
    country: 'India',
    aliases: ['tata', 'tata motors', 'tata-motors'],
  },
  {
    id: 'kia',
    name: 'Kia',
    slug: 'kia',
    country: 'South Korea',
    aliases: ['kia', 'kia india'],
  },
  {
    id: 'toyota',
    name: 'Toyota',
    slug: 'toyota',
    country: 'Japan',
    aliases: ['toyota', 'toyota kirloskar'],
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    slug: 'hyundai',
    country: 'South Korea',
    aliases: ['hyundai', 'hyundai india'],
  },
  {
    id: 'mahindra',
    name: 'Mahindra',
    slug: 'mahindra',
    country: 'India',
    aliases: ['mahindra', 'mahindra & mahindra'],
  },
  {
    id: 'honda',
    name: 'Honda',
    slug: 'honda',
    country: 'Japan',
    aliases: ['honda', 'honda cars'],
  },
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    slug: 'volkswagen',
    country: 'Germany',
    aliases: ['volkswagen', 'vw'],
  },
  {
    id: 'skoda',
    name: 'Skoda',
    slug: 'skoda',
    country: 'Czech Republic',
    aliases: ['skoda', 'škoda', 'skoda auto'],
  },
  {
    id: 'renault',
    name: 'Renault',
    slug: 'renault',
    country: 'France',
    aliases: ['renault'],
  },
  {
    id: 'nissan',
    name: 'Nissan',
    slug: 'nissan',
    country: 'Japan',
    aliases: ['nissan'],
  },
  {
    id: 'mg',
    name: 'MG',
    slug: 'mg',
    country: 'UK · India',
    aliases: ['mg', 'mg motor', 'morris garages'],
  },
  {
    id: 'bmw',
    name: 'BMW',
    slug: 'bmw',
    country: 'Germany',
    aliases: ['bmw'],
  },
  {
    id: 'mercedes-benz',
    name: 'Mercedes-Benz',
    slug: 'mercedes-benz',
    country: 'Germany',
    aliases: ['mercedes-benz', 'mercedes benz', 'mercedes-amg', 'mercedes amg', 'mercedes'],
  },
  {
    id: 'audi',
    name: 'Audi',
    slug: 'audi',
    country: 'Germany',
    aliases: ['audi'],
  },
  {
    id: 'jeep',
    name: 'Jeep',
    slug: 'jeep',
    country: 'United States',
    aliases: ['jeep'],
  },
];

export function toBrandSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function findBrandByParam(rawParam: string): BrandItem | undefined {
  const normalized = rawParam.trim().toLowerCase();
  const slug = toBrandSlug(rawParam);
  if (!slug) return undefined;

  return BRAND_CATALOG.find(
    (b) =>
      b.slug === slug ||
      b.name.toLowerCase() === normalized ||
      b.aliases.some((alias) => alias.toLowerCase() === normalized || toBrandSlug(alias) === slug)
  );
}

export function resolveBrandDisplayName(rawParam: string, knownCarBrands: string[] = []): string {
  if (!rawParam || rawParam === 'All') return 'All';
  const normalized = rawParam.trim().toLowerCase();
  const slug = toBrandSlug(rawParam);

  // Check exact match against known car brands first (e.g. "Mercedes-AMG" vs "mercedes-benz")
  const exactKnown = knownCarBrands.find(
    (kb) => kb.toLowerCase() === normalized || toBrandSlug(kb) === slug
  );

  const catalogMatch = findBrandByParam(rawParam);
  if (catalogMatch) {
    // Prefer catalog name for canonical slugs (e.g. mercedes-benz -> Mercedes-Benz),
    // while keeping explicit Mercedes-AMG if requested directly
    if (exactKnown && toBrandSlug(exactKnown) === slug) {
      return catalogMatch.slug === slug ? catalogMatch.name : exactKnown;
    }
    return catalogMatch.name;
  }

  if (exactKnown) return exactKnown;

  // Fallback title case for unknown slug
  return rawParam
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function matchesBrandFilter(carBrand: string, filterParam: string): boolean {
  if (!filterParam || filterParam === 'All') return true;
  const carSlug = toBrandSlug(carBrand);
  const filterSlug = toBrandSlug(filterParam);
  if (carSlug === filterSlug) return true;

  const catalogEntry = findBrandByParam(filterParam);
  if (!catalogEntry) return false;

  // Allow specific sub-marque query like "Mercedes-AMG" to match only Mercedes-AMG,
  // while canonical "mercedes-benz" matches all Mercedes-Benz / Mercedes-AMG aliases.
  if (filterSlug === 'mercedes-amg') {
    return carSlug === 'mercedes-amg';
  }

  return (
    carSlug === catalogEntry.slug ||
    catalogEntry.aliases.some((alias) => toBrandSlug(alias) === carSlug)
  );
}

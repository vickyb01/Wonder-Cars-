const OPTIMIZED_WEBP_PATHS = new Set<string>([
  '/src/assets/images/about-hero-bg.webp',
  '/src/assets/images/car_audi_rs_etron_1794898131413.webp',
  '/src/assets/images/car_audi_rs_etron_mobile.webp',
  '/src/assets/images/car_bmw_m4_1794898129243.webp',
  '/src/assets/images/car_interior_cockpit_1794898131578.webp',
  '/src/assets/images/car_mercedes_g63_1794898130781.webp',
  '/src/assets/images/car_porsche_911_1794898129646.webp',
  '/src/assets/images/car_porsche_911_mobile.webp',
  '/src/assets/images/car_range_rover_1794898131419.webp',
  '/src/assets/images/hero_luxury_coupe_1794898128860.webp',
  '/src/assets/images/hero_luxury_coupe_mobile.webp',
  '/assets/about-hero-bg.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{0F4383D2-721A-4084-A47F-8623F1A0264C}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{1A2EE97F-E2D3-4488-8F35-62D8693F2B99}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{4707AFD9-4B0A-4D7B-BA68-CE89EC6EEFBE}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{511F6B84-5122-4CFB-9D24-B68AABD55389}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{552AC3F3-9EE4-4D35-8100-C9A03D5D2170}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{5F6AD725-7AD9-4F6D-986E-BC7AEC2D9ED2}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{669CECEE-A7A2-4335-9742-FB506DEA2EBF}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{6E069925-246E-473A-98B9-2A7F9B1DED2A}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{95CAB99D-8299-4837-887D-C85A436732EA}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{B9D5D637-03CF-4EA0-B49B-54D932452D62}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{BDAF5D8B-15DF-4448-A2C8-64EAD526B7F9}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{F835C8F6-6AAC-49A3-AF3E-FA0A888C3344}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{FDD380DB-C85E-4218-9DFA-8C62509DBE33}.webp',
  '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{FE667DA2-BA12-4ADE-B3F1-CC79CCBB73A9}.webp',
  '/assets/aistudio/image_07541e42.webp',
  '/assets/aistudio/_0F7E204B-0FD3-40D0-8308-A6C439A87D00__af53f6c4.webp',
  '/assets/aistudio/_15D532E4-917E-4179-A013-E5C41A5A4276__8e3ec754.webp',
  '/assets/aistudio/_345C7D95-666A-4207-AEE2-ABFA14A7323F__150a90d6.webp',
  '/assets/aistudio/_8C9F661E-D42A-4BF5-AC2C-F94B8D394BEA__725fb3df.webp',
  '/assets/car_audi_rs_etron_mobile.webp',
  '/assets/car_porsche_911_mobile.webp',
  '/assets/certificates/olx-autos-recognition-certificate.webp',
  '/assets/hero_luxury_coupe_mobile.webp',
  '/assets/naman-jain-owner.webp',
  '/assets/owner-naman-jain.webp',
  '/assets/Showroom, Fleet & Delivery Moments/WhatsApp Image 2026-11-18 at 10.12.29 AM.webp',
  '/assets/Showroom, Fleet & Delivery Moments/WhatsApp Image 2026-11-18 at 10.16.23 AM.webp',
  '/assets/Showroom, Fleet & Delivery Moments/WhatsApp Image 2026-11-18 at 10.17.09 AM.webp',
  '/assets/wonder-cars-emblem-clean.webp',
  '/assets/wonder-cars-emblem-full.webp',
  '/assets/wonder-cars-emblem-transparent.webp',
  '/assets/wonder-cars-emblem.webp',
  '/assets/wonder-cars-logo-dark.webp',
  '/assets/wonder-cars-logo.webp',
  '/assets/wonder-cars-qr.webp',
]);

/**
 * Returns the verified sibling `.webp` path for a static JPG/JPEG/PNG asset,
 * or empty string if the source is already WebP, dynamic, or unoptimized.
 */
export function getOptimizedWebpUrl(src?: string): string {
  if (!src) return '';
  const trimmed = src.trim();
  if (!trimmed || trimmed.startsWith('data:')) return '';

  const [pathPart] = trimmed.split('?');
  if (!/\.(jpg|jpeg|png)$/i.test(pathPart)) return '';

  const candidatePath = pathPart.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  let decodedCandidate = candidatePath;
  try {
    decodedCandidate = decodeURI(candidatePath);
  } catch {
    decodedCandidate = candidatePath;
  }

  return OPTIMIZED_WEBP_PATHS.has(decodedCandidate) ? candidatePath : '';
}

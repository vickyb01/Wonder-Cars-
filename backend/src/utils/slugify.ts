export function slugifyCar(year: number, brand: string, model: string): string {
  return `${year}-${brand}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}


export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    const crores = amount / 10000000;
    return `₹${crores.toFixed(crores % 1 === 0 ? 0 : 2)} Cr`;
  }
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 2)} L`;
  }
  return formatINR(amount);
}

export function formatKm(km: number): string {
  return `${new Intl.NumberFormat('en-IN').format(km)} km`;
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function estimateMonthlyEmi(priceInr: number, tenureMonths = 60, annualRate = 9.25): number {
  const principal = priceInr * 0.8;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return Math.round((principal * monthlyRate * factor) / (factor - 1));
}

export function calculateVehicleAge(registrationDate?: string, fallbackYear?: number): {
  label: string;
  totalMonths: number | null;
} {
  if (registrationDate) {
    const reg = new Date(registrationDate);
    if (!Number.isNaN(reg.getTime())) {
      const now = new Date();
      let months = (now.getFullYear() - reg.getFullYear()) * 12 + (now.getMonth() - reg.getMonth());
      if (now.getDate() < reg.getDate()) {
        months -= 1;
      }
      months = Math.max(0, months);
      const years = Math.floor(months / 12);
      const remMonths = months % 12;
      const yearPart = years > 0 ? `${years} ${years === 1 ? 'Year' : 'Years'}` : '';
      const monthPart = remMonths > 0 ? `${remMonths} ${remMonths === 1 ? 'Month' : 'Months'}` : '';
      const label = [yearPart, monthPart].filter(Boolean).join(' ') || 'Under 1 Month';
      return { label, totalMonths: months };
    }
  }

  if (fallbackYear) {
    const approxYears = Math.max(0, new Date().getFullYear() - fallbackYear);
    return {
      label: approxYears === 0 ? 'Under 1 Year (Approx.)' : `~${approxYears} ${approxYears === 1 ? 'Year' : 'Years'} (Exact Reg. Date Not Provided)`,
      totalMonths: null,
    };
  }

  return { label: 'Not Provided', totalMonths: null };
}

export function calculateAvgAnnualKm(kilometres: number, registrationDate?: string): string {
  if (!registrationDate || kilometres <= 0) return 'Not Available (Insufficient Date Data)';
  const { totalMonths } = calculateVehicleAge(registrationDate);
  if (totalMonths === null || totalMonths < 3) {
    return 'Too Recent to Calculate';
  }
  const years = totalMonths / 12;
  const avg = Math.round(kilometres / years);
  return `${new Intl.NumberFormat('en-IN').format(avg)} km / year`;
}

export function formatReadableDate(isoOrDate?: string): string {
  if (!isoOrDate) return 'Not Provided';
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

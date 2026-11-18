export interface EmiConfig {
  downPaymentPercent: number;
  annualInterestRate: number;
  tenureMonths: number;
}

export const DEFAULT_EMI_CONFIG: EmiConfig = {
  downPaymentPercent: 20,
  annualInterestRate: 9.25,
  tenureMonths: 60,
};

export const EMI_SLIDER_MIN = 0;
export const EMI_SLIDER_MAX = 700000;
export const EMI_SLIDER_STEP = 10000;

export interface EmiPresetRange {
  id: string;
  label: string;
  minEmi: number | null;
  maxEmi: number | null;
}

export const EMI_PRESET_RANGES: EmiPresetRange[] = [
  { id: 'under-50k', label: 'Under ₹50K', minEmi: null, maxEmi: 50000 },
  { id: '50k-150k', label: '₹50K – ₹1.5L', minEmi: 50000, maxEmi: 150000 },
  { id: '150k-250k', label: '₹1.5L – ₹2.5L', minEmi: 150000, maxEmi: 250000 },
  { id: '250k-400k', label: '₹2.5L – ₹4.0L', minEmi: 250000, maxEmi: 400000 },
  { id: '400k-650k', label: '₹4.0L – ₹6.5L', minEmi: 400000, maxEmi: 650000 },
  { id: 'above-500k', label: '₹5.0L+', minEmi: 500000, maxEmi: null },
];

export interface EmiCalculationResult {
  carPriceInr: number;
  downPaymentInr: number;
  loanAmountInr: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterestInr: number;
  totalRepaymentInr: number;
}

/**
 * Standard reducing-balance monthly EMI formula:
 * EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
 */
export function calculateLoanEmi(params: {
  carPriceInr: number;
  downPaymentInr: number;
  annualInterestRate: number;
  tenureMonths: number;
}): EmiCalculationResult {
  const carPriceInr = Math.max(0, Number(params.carPriceInr) || 0);
  const clampedDownPayment = Math.min(carPriceInr, Math.max(0, Number(params.downPaymentInr) || 0));
  const loanAmountInr = Math.max(0, carPriceInr - clampedDownPayment);
  const annualInterestRate = Math.max(0, Number(params.annualInterestRate) || 0);
  const tenureMonths = Math.max(1, Math.round(Number(params.tenureMonths) || 1));

  if (loanAmountInr <= 0) {
    return {
      carPriceInr,
      downPaymentInr: clampedDownPayment,
      loanAmountInr: 0,
      annualInterestRate,
      tenureMonths,
      monthlyEmi: 0,
      totalInterestInr: 0,
      totalRepaymentInr: 0,
    };
  }

  const monthlyRate = annualInterestRate / 12 / 100;
  let monthlyEmi: number;

  if (monthlyRate === 0) {
    monthlyEmi = Math.round(loanAmountInr / tenureMonths);
  } else {
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    monthlyEmi = Math.round((loanAmountInr * monthlyRate * factor) / (factor - 1));
  }

  const totalRepaymentInr = monthlyEmi * tenureMonths;
  const totalInterestInr = Math.max(0, totalRepaymentInr - loanAmountInr);

  return {
    carPriceInr,
    downPaymentInr: clampedDownPayment,
    loanAmountInr,
    annualInterestRate,
    tenureMonths,
    monthlyEmi,
    totalInterestInr,
    totalRepaymentInr,
  };
}

export function estimateCarEmiWithConfig(
  carPriceInr: number,
  config: Partial<EmiConfig> = {}
): number {
  const downPaymentPercent = clampNumber(
    config.downPaymentPercent ?? DEFAULT_EMI_CONFIG.downPaymentPercent,
    0,
    90
  );
  const annualInterestRate = clampNumber(
    config.annualInterestRate ?? DEFAULT_EMI_CONFIG.annualInterestRate,
    0,
    30
  );
  const tenureMonths = clampNumber(
    config.tenureMonths ?? DEFAULT_EMI_CONFIG.tenureMonths,
    6,
    120
  );

  const downPaymentInr = Math.round((carPriceInr * downPaymentPercent) / 100);
  return calculateLoanEmi({
    carPriceInr,
    downPaymentInr,
    annualInterestRate,
    tenureMonths,
  }).monthlyEmi;
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

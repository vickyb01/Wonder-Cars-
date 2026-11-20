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

export function calculateLoanEmi(params: {
  carPriceInr: number;
  downPaymentInr: number;
  annualInterestRate: number;
  tenureMonths: number;
}): {
  carPriceInr: number;
  downPaymentInr: number;
  loanAmountInr: number;
  annualInterestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterestInr: number;
  totalRepaymentInr: number;
} {
  const { carPriceInr, downPaymentInr, annualInterestRate, tenureMonths } = params;
  const loanAmountInr = Math.max(0, carPriceInr - downPaymentInr);
  if (loanAmountInr <= 0 || tenureMonths <= 0) {
    return {
      carPriceInr,
      downPaymentInr,
      loanAmountInr: 0,
      annualInterestRate,
      tenureMonths,
      monthlyEmi: 0,
      totalInterestInr: 0,
      totalRepaymentInr: 0,
    };
  }

  const monthlyRate = annualInterestRate / 12 / 100;
  if (monthlyRate === 0) {
    const monthlyEmi = Math.round(loanAmountInr / tenureMonths);
    return {
      carPriceInr,
      downPaymentInr,
      loanAmountInr,
      annualInterestRate,
      tenureMonths,
      monthlyEmi,
      totalInterestInr: 0,
      totalRepaymentInr: loanAmountInr,
    };
  }

  const compounding = Math.pow(1 + monthlyRate, tenureMonths);
  const rawEmi = (loanAmountInr * monthlyRate * compounding) / (compounding - 1);
  const monthlyEmi = Math.round(rawEmi);
  const totalRepaymentInr = monthlyEmi * tenureMonths;
  const totalInterestInr = Math.max(0, totalRepaymentInr - loanAmountInr);

  return {
    carPriceInr,
    downPaymentInr,
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
  config: EmiConfig = DEFAULT_EMI_CONFIG
): number {
  const downPayment = Math.round((carPriceInr * config.downPaymentPercent) / 100);
  const res = calculateLoanEmi({
    carPriceInr,
    downPaymentInr: downPayment,
    annualInterestRate: config.annualInterestRate,
    tenureMonths: config.tenureMonths,
  });
  return res.monthlyEmi;
}


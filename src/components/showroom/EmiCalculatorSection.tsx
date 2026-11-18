import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Info, RotateCcw } from 'lucide-react';
import { DEFAULT_EMI_CONFIG, calculateLoanEmi, clampNumber } from '../../utils/emi';
import { formatINR, formatINRCompact } from '../../utils/format';

interface EmiCalculatorSectionProps {
  carPriceInr: number;
  carTitle: string;
}

const DOWN_PAYMENT_PRESETS = [15, 20, 30, 50];
const TENURE_PRESETS = [12, 24, 36, 48, 60, 72, 84];

export function EmiCalculatorSection({ carPriceInr, carTitle }: EmiCalculatorSectionProps) {
  const defaultDownPayment = Math.round((carPriceInr * DEFAULT_EMI_CONFIG.downPaymentPercent) / 100);

  const [downPaymentInr, setDownPaymentInr] = useState<number>(defaultDownPayment);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(
    DEFAULT_EMI_CONFIG.annualInterestRate
  );
  const [tenureMonths, setTenureMonths] = useState<number>(DEFAULT_EMI_CONFIG.tenureMonths);

  useEffect(() => {
    setDownPaymentInr(Math.round((carPriceInr * DEFAULT_EMI_CONFIG.downPaymentPercent) / 100));
    setAnnualInterestRate(DEFAULT_EMI_CONFIG.annualInterestRate);
    setTenureMonths(DEFAULT_EMI_CONFIG.tenureMonths);
  }, [carPriceInr]);

  const minDownPayment = Math.round(carPriceInr * 0.1);
  const maxDownPayment = Math.round(carPriceInr * 0.85);
  const dpStep = carPriceInr >= 5000000 ? 100000 : 25000;

  const result = useMemo(
    () =>
      calculateLoanEmi({
        carPriceInr,
        downPaymentInr,
        annualInterestRate,
        tenureMonths,
      }),
    [carPriceInr, downPaymentInr, annualInterestRate, tenureMonths]
  );

  const downPaymentPercent = carPriceInr > 0 ? Math.round((result.downPaymentInr / carPriceInr) * 100) : 0;
  const principalSharePercent =
    result.totalRepaymentInr > 0
      ? Math.round((result.loanAmountInr / result.totalRepaymentInr) * 100)
      : 100;
  const interestSharePercent = Math.max(0, 100 - principalSharePercent);

  function handleReset() {
    setDownPaymentInr(Math.round((carPriceInr * DEFAULT_EMI_CONFIG.downPaymentPercent) / 100));
    setAnnualInterestRate(DEFAULT_EMI_CONFIG.annualInterestRate);
    setTenureMonths(DEFAULT_EMI_CONFIG.tenureMonths);
  }

  return (
    <section
      id="emi-calculator"
      aria-labelledby="emi-calculator-heading"
      className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.07]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1 inline-flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive Financing Estimator</span>
          </p>
          <h2 id="emi-calculator-heading" className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
            Monthly EMI Calculator
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
            Configure down payment, interest rate, and tenure for {carTitle}.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          <span>Reset Calculator</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Cols: Interactive Sliders & Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Down Payment */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="calc-downpayment" className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                Down Payment ({downPaymentPercent}%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="calc-downpayment"
                  type="number"
                  min={0}
                  max={carPriceInr}
                  step={dpStep}
                  value={downPaymentInr}
                  onChange={(e) =>
                    setDownPaymentInr(clampNumber(Number(e.target.value), 0, carPriceInr))
                  }
                  className="w-36 h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono tabular-nums text-right focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>
            </div>

            <input
              type="range"
              aria-label="Down payment amount slider"
              min={minDownPayment}
              max={maxDownPayment}
              step={dpStep}
              value={clampNumber(downPaymentInr, minDownPayment, maxDownPayment)}
              onChange={(e) => setDownPaymentInr(Number(e.target.value))}
              className="w-full accent-blue-700 dark:accent-blue-500 cursor-pointer"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {DOWN_PAYMENT_PRESETS.map((pct) => {
                  const active = Math.abs(downPaymentPercent - pct) <= 1;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDownPaymentInr(Math.round((carPriceInr * pct) / 100))}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono tabular-nums border transition-colors cursor-pointer ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-white font-semibold'
                          : 'bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-slate-500 dark:text-zinc-500 font-mono tabular-nums">
                {formatINRCompact(result.downPaymentInr)} upfront
              </span>
            </div>
          </div>

          {/* Annual Interest Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="calc-rate" className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                Annual Interest Rate (%)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="calc-rate"
                  type="number"
                  min={0}
                  max={25}
                  step={0.25}
                  value={annualInterestRate}
                  onChange={(e) =>
                    setAnnualInterestRate(clampNumber(Number(e.target.value), 0, 25))
                  }
                  className="w-24 h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono tabular-nums text-right focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                />
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">% p.a.</span>
              </div>
            </div>

            <input
              type="range"
              aria-label="Annual interest rate slider"
              min={7}
              max={16}
              step={0.25}
              value={clampNumber(annualInterestRate, 7, 16)}
              onChange={(e) => setAnnualInterestRate(Number(e.target.value))}
              className="w-full accent-blue-700 dark:accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-500">
              <span>7.0%</span>
              <span>11.5%</span>
              <span>16.0%</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="calc-tenure" className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                Loan Tenure (Months)
              </label>
              <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                {tenureMonths} months ({(tenureMonths / 12).toFixed(1).replace('.0', '')}{' '}
                {tenureMonths === 12 ? 'year' : 'years'})
              </span>
            </div>

            <input
              id="calc-tenure"
              type="range"
              aria-label="Loan tenure slider in months"
              min={12}
              max={84}
              step={6}
              value={clampNumber(tenureMonths, 12, 84)}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              className="w-full accent-blue-700 dark:accent-blue-500 cursor-pointer"
            />

            <div className="grid grid-cols-7 gap-1.5">
              {TENURE_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTenureMonths(m)}
                  className={`py-1.5 rounded-md text-xs font-mono tabular-nums border transition-colors cursor-pointer ${
                    tenureMonths === m
                      ? 'bg-blue-700 dark:bg-blue-600 border-blue-700 dark:border-blue-500 text-white font-semibold'
                      : 'bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Animated Breakdown Summary */}
        <div className="lg:col-span-5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] p-5 sm:p-6 space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Estimated Monthly EMI
            </p>
            <motion.p
              key={result.monthlyEmi}
              initial={{ opacity: 0.65, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1 font-mono text-3xl sm:text-[34px] font-bold text-slate-900 dark:text-white tabular-nums tracking-tight"
            >
              {formatINR(result.monthlyEmi)}
              <span className="text-sm font-normal text-slate-500 dark:text-zinc-400"> / mo</span>
            </motion.p>
          </div>

          {/* Visual Principal vs Interest Bar */}
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden flex">
              <motion.div
                className="h-full bg-slate-700 dark:bg-zinc-200"
                animate={{ width: `${principalSharePercent}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
              <motion.div
                className="h-full bg-blue-700 dark:bg-blue-500"
                animate={{ width: `${interestSharePercent}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-700 dark:bg-zinc-200" />
                Principal ({principalSharePercent}%)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-700 dark:bg-blue-500" />
                Interest ({interestSharePercent}%)
              </span>
            </div>
          </div>

          <dl className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-white/[0.07] text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600 dark:text-zinc-400">Vehicle Asking Price</dt>
              <dd className="font-mono text-slate-900 dark:text-zinc-200 tabular-nums">{formatINR(result.carPriceInr)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600 dark:text-zinc-400">Down Payment</dt>
              <dd className="font-mono text-slate-900 dark:text-zinc-200 tabular-nums">
                − {formatINR(result.downPaymentInr)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600 dark:text-zinc-400">Loan Amount</dt>
              <dd className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                {formatINR(result.loanAmountInr)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600 dark:text-zinc-400">Total Estimated Interest</dt>
              <dd className="font-mono font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                {formatINR(result.totalInterestInr)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 pt-2.5 border-t border-slate-200 dark:border-white/[0.07]">
              <dt className="text-slate-800 dark:text-zinc-200 font-medium">Total Repayment Amount</dt>
              <dd className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {formatINR(result.totalRepaymentInr)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Honest Regulatory Disclaimer */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090B]/70 border border-slate-200 dark:border-white/[0.06] text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
        <Info className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
        <p>
          Calculations use the standard reducing-balance EMI formula strictly for indicative comparison. No financing offer or loan approval is guaranteed; actual EMI depends on lender approval, interest rate, processing fees, credit profile, and loan conditions.
        </p>
      </div>
    </section>
  );
}

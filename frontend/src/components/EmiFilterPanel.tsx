import { useEffect, useState } from 'react';
import { Calculator, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import {
  DEFAULT_EMI_CONFIG,
  EMI_PRESET_RANGES,
  EMI_SLIDER_MAX,
  EMI_SLIDER_MIN,
  EMI_SLIDER_STEP,
  clampNumber,
} from '../utils/emi';
import { formatINR, formatINRCompact } from '../utils/format';

interface EmiFilterValue {
  minEmi: string;
  maxEmi: string;
  downPaymentPercent: number;
  annualInterestRate: number;
  tenureMonths: number;
}

interface EmiFilterPanelProps {
  appliedMinEmi: string;
  appliedMaxEmi: string;
  appliedDownPaymentPercent: number;
  appliedInterestRate: number;
  appliedTenureMonths: number;
  onApply: (next: EmiFilterValue) => void;
  onClear: () => void;
}

export function EmiFilterPanel({
  appliedMinEmi,
  appliedMaxEmi,
  appliedDownPaymentPercent,
  appliedInterestRate,
  appliedTenureMonths,
  onApply,
  onClear,
}: EmiFilterPanelProps) {
  const [draftMin, setDraftMin] = useState<string>(appliedMinEmi);
  const [draftMax, setDraftMax] = useState<string>(appliedMaxEmi);
  const [draftDp, setDraftDp] = useState<number>(appliedDownPaymentPercent);
  const [draftRate, setDraftRate] = useState<number>(appliedInterestRate);
  const [draftTenure, setDraftTenure] = useState<number>(appliedTenureMonths);
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

  useEffect(() => {
    setDraftMin(appliedMinEmi);
    setDraftMax(appliedMaxEmi);
    setDraftDp(appliedDownPaymentPercent);
    setDraftRate(appliedInterestRate);
    setDraftTenure(appliedTenureMonths);
  }, [
    appliedMinEmi,
    appliedMaxEmi,
    appliedDownPaymentPercent,
    appliedInterestRate,
    appliedTenureMonths,
  ]);

  const numericMin = draftMin ? clampNumber(Number(draftMin), EMI_SLIDER_MIN, EMI_SLIDER_MAX) : EMI_SLIDER_MIN;
  const numericMax = draftMax ? clampNumber(Number(draftMax), EMI_SLIDER_MIN, EMI_SLIDER_MAX) : EMI_SLIDER_MAX;

  const isEmiActive = Boolean(appliedMinEmi || appliedMaxEmi);
  const hasDraftChanges =
    draftMin !== appliedMinEmi ||
    draftMax !== appliedMaxEmi ||
    draftDp !== appliedDownPaymentPercent ||
    draftRate !== appliedInterestRate ||
    draftTenure !== appliedTenureMonths;

  const minPercent = ((Math.min(numericMin, numericMax) - EMI_SLIDER_MIN) / (EMI_SLIDER_MAX - EMI_SLIDER_MIN)) * 100;
  const maxPercent = ((Math.max(numericMin, numericMax) - EMI_SLIDER_MIN) / (EMI_SLIDER_MAX - EMI_SLIDER_MIN)) * 100;

  function handlePresetSelect(presetMin: number | null, presetMax: number | null) {
    const nextMin = presetMin !== null ? String(presetMin) : '';
    const nextMax = presetMax !== null ? String(presetMax) : '';
    setDraftMin(nextMin);
    setDraftMax(nextMax);
    onApply({
      minEmi: nextMin,
      maxEmi: nextMax,
      downPaymentPercent: draftDp,
      annualInterestRate: draftRate,
      tenureMonths: draftTenure,
    });
  }

  function handleApplyClick() {
    const cleanMin = draftMin && Number(draftMin) > 0 ? String(Math.round(Number(draftMin))) : '';
    const cleanMax = draftMax && Number(draftMax) > 0 ? String(Math.round(Number(draftMax))) : '';

    if (cleanMin && cleanMax && Number(cleanMin) > Number(cleanMax)) {
      onApply({
        minEmi: cleanMax,
        maxEmi: cleanMin,
        downPaymentPercent: draftDp,
        annualInterestRate: draftRate,
        tenureMonths: draftTenure,
      });
      return;
    }

    onApply({
      minEmi: cleanMin,
      maxEmi: cleanMax,
      downPaymentPercent: draftDp,
      annualInterestRate: draftRate,
      tenureMonths: draftTenure,
    });
  }

  function handleClearClick() {
    setDraftMin('');
    setDraftMax('');
    setDraftDp(DEFAULT_EMI_CONFIG.downPaymentPercent);
    setDraftRate(DEFAULT_EMI_CONFIG.annualInterestRate);
    setDraftTenure(DEFAULT_EMI_CONFIG.tenureMonths);
    onClear();
  }

  return (
    <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-zinc-200">
            Monthly EMI
          </span>
        </div>

        {(isEmiActive || hasDraftChanges) && (
          <button
            type="button"
            onClick={handleClearClick}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Live Selected Range Summary */}
      <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-800 dark:text-zinc-300 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] rounded-lg px-3 py-2">
        <span>{draftMin ? formatINRCompact(Number(draftMin)) : '₹0'}</span>
        <span className="text-slate-400 dark:text-zinc-500 font-sans text-[11px]">to</span>
        <span>{draftMax ? formatINRCompact(Number(draftMax)) : '₹7L+ /mo'}</span>
      </div>

      {/* Dual-Thumb Interactive Range Slider */}
      <div className="relative h-6 flex items-center select-none">
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.1] relative">
          <div
            className="absolute top-0 bottom-0 rounded-full bg-blue-700 dark:bg-blue-500"
            style={{
              left: `${minPercent}%`,
              right: `${100 - maxPercent}%`,
            }}
          />
        </div>
        <input
          type="range"
          aria-label="Minimum monthly EMI slider"
          min={EMI_SLIDER_MIN}
          max={EMI_SLIDER_MAX}
          step={EMI_SLIDER_STEP}
          value={numericMin}
          onChange={(e) => {
            const val = Math.min(Number(e.target.value), numericMax);
            setDraftMin(val > 0 ? String(val) : '');
          }}
          className="emi-dual-range absolute inset-0 w-full z-10"
        />
        <input
          type="range"
          aria-label="Maximum monthly EMI slider"
          min={EMI_SLIDER_MIN}
          max={EMI_SLIDER_MAX}
          step={EMI_SLIDER_STEP}
          value={numericMax}
          onChange={(e) => {
            const val = Math.max(Number(e.target.value), numericMin);
            setDraftMax(val < EMI_SLIDER_MAX ? String(val) : '');
          }}
          className="emi-dual-range absolute inset-0 w-full z-20"
        />
      </div>

      {/* Direct Min / Max EMI Numeric Inputs */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="f-min-emi" className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
            Min EMI (₹/mo)
          </label>
          <input
            id="f-min-emi"
            type="number"
            min={0}
            step={5000}
            value={draftMin}
            onChange={(e) => setDraftMin(e.target.value)}
            placeholder="e.g. 50000"
            className="w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white font-mono tabular-nums placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="f-max-emi" className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
            Max EMI (₹/mo)
          </label>
          <input
            id="f-max-emi"
            type="number"
            min={0}
            step={5000}
            value={draftMax}
            onChange={(e) => setDraftMax(e.target.value)}
            placeholder="e.g. 300000"
            className="w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white font-mono tabular-nums placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
          />
        </div>
      </div>

      {/* Predefined EMI Ranges */}
      <div className="space-y-1.5">
        <span className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400">Quick EMI Ranges</span>
        <div className="grid grid-cols-2 gap-1.5">
          {EMI_PRESET_RANGES.map((preset) => {
            const pMin = preset.minEmi !== null ? String(preset.minEmi) : '';
            const pMax = preset.maxEmi !== null ? String(preset.maxEmi) : '';
            const active = appliedMinEmi === pMin && appliedMaxEmi === pMax && isEmiActive;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.minEmi, preset.maxEmi)}
                className={`px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors text-left truncate cursor-pointer ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-white'
                    : 'bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-white/[0.2] hover:text-blue-700 dark:hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Configurable Loan Assumptions Drawer */}
      <div className="rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAssumptions((prev) => !prev)}
          className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <span>
            Terms: {draftDp}% DP · {draftRate}% · {draftTenure}m
          </span>
          {showAssumptions ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          )}
        </button>

        {showAssumptions && (
          <div className="px-3 pb-3 pt-1.5 border-t border-slate-200 dark:border-white/[0.06] space-y-3 text-[11px]">
            <div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400 mb-1">
                <span>Down Payment</span>
                <span className="font-mono text-slate-900 dark:text-white tabular-nums">{draftDp}%</span>
              </div>
              <input
                type="range"
                aria-label="Filter down payment percentage"
                min={10}
                max={70}
                step={5}
                value={draftDp}
                onChange={(e) => setDraftDp(Number(e.target.value))}
                className="w-full accent-blue-700 dark:accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400 mb-1">
                <span>Interest Rate (p.a.)</span>
                <span className="font-mono text-slate-900 dark:text-white tabular-nums">{draftRate}%</span>
              </div>
              <input
                type="range"
                aria-label="Filter annual interest rate"
                min={7}
                max={16}
                step={0.25}
                value={draftRate}
                onChange={(e) => setDraftRate(Number(e.target.value))}
                className="w-full accent-blue-700 dark:accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <span className="block text-slate-600 dark:text-zinc-400 mb-1.5">Loan Tenure</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                {[24, 36, 48, 60, 72, 84].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDraftTenure(m)}
                    className={`py-1 rounded text-[11px] font-mono tabular-nums transition-colors cursor-pointer ${
                      draftTenure === m
                        ? 'bg-blue-700 dark:bg-blue-600 text-white font-semibold'
                        : 'bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-transparent text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Explicit Apply & Clear Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleApplyClick}
          className="h-9 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          Apply EMI
        </button>
        <button
          type="button"
          onClick={handleClearClick}
          disabled={!isEmiActive && !hasDraftChanges}
          className="h-9 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] disabled:opacity-40 disabled:pointer-events-none border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          Clear EMI
        </button>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed">
        Indicative EMI ({draftDp}% DP, {draftRate}% p.a., {draftTenure} mo). Actual EMI depends on lender approval, interest rate, fees, and loan conditions.
      </p>

      {isEmiActive && (
        <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-mono tabular-nums">
          Active: {appliedMinEmi ? formatINR(Number(appliedMinEmi)) : '₹0'} –{' '}
          {appliedMaxEmi ? formatINR(Number(appliedMaxEmi)) : 'Any'}
        </p>
      )}
    </div>
  );
}

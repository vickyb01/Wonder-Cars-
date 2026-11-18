import { AlertTriangle, CalendarCheck2, FileCheck2, History, ShieldAlert } from 'lucide-react';
import type { Car, DocumentStatus } from '../../types/car';
import {
  calculateAvgAnnualKm,
  calculateVehicleAge,
  formatKm,
  formatReadableDate,
} from '../../utils/format';

interface HistoryAndLegalSectionProps {
  car: Car;
}

function documentTone(status: DocumentStatus): string {
  switch (status) {
    case 'Verified':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'Seller Provided':
      return 'text-sky-700 dark:text-sky-400';
    case 'Expired':
      return 'text-rose-700 dark:text-rose-400';
    case 'Not Verified':
      return 'text-amber-700 dark:text-amber-300';
    case 'Not Available':
    default:
      return 'text-slate-500 dark:text-zinc-500';
  }
}

export function HistoryAndLegalSection({ car }: HistoryAndLegalSectionProps) {
  const age = calculateVehicleAge(car.registrationDate, car.registrationYear || car.year);
  const avgAnnualKm = calculateAvgAnnualKm(car.kilometres, car.registrationDate);

  return (
    <div className="space-y-8">
      {/* 4. Vehicle Age & Usage History */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
              Provenance &amp; Mileage
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
              Vehicle Usage &amp; Ownership
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
            Source: <strong className="text-slate-900 dark:text-white">{car.usageHistory.recordVerification}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07]">
            <p className="text-xs text-slate-500 dark:text-zinc-500">Vehicle Age</p>
            <p className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white mt-1">{age.label}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07]">
            <p className="text-xs text-slate-500 dark:text-zinc-500">Distance Driven</p>
            <p className="font-mono text-base sm:text-lg font-semibold text-slate-900 dark:text-white mt-1 tabular-nums">
              {formatKm(car.kilometres)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07]">
            <p className="text-xs text-slate-500 dark:text-zinc-500">Ownership</p>
            <p className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white mt-1">{car.ownership}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07]">
            <p className="text-xs text-slate-500 dark:text-zinc-500">Usage Type</p>
            <p className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white mt-1">
              {car.usageHistory.usageType}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex justify-between gap-4 py-2 border-b border-slate-200/80 dark:border-white/[0.06]">
            <dt className="text-slate-600 dark:text-zinc-400">First Registration Date</dt>
            <dd className="text-slate-900 dark:text-white font-mono tabular-nums">{formatReadableDate(car.registrationDate)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2 border-b border-slate-200/80 dark:border-white/[0.06]">
            <dt className="text-slate-600 dark:text-zinc-400">Avg. Annual Kilometres</dt>
            <dd className="text-slate-900 dark:text-white font-mono tabular-nums text-right">{avgAnnualKm}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2 border-b border-slate-200/80 dark:border-white/[0.06]">
            <dt className="text-slate-600 dark:text-zinc-400">Previous Owners</dt>
            <dd className="text-slate-900 dark:text-white font-mono tabular-nums">
              {car.usageHistory.previousOwnersCount !== undefined
                ? car.usageHistory.previousOwnersCount
                : 'Not Provided'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2 border-b border-slate-200/80 dark:border-white/[0.06]">
            <dt className="text-slate-600 dark:text-zinc-400">Disclosed Driving Pattern</dt>
            <dd className="text-slate-900 dark:text-white">{car.usageHistory.drivingPattern || 'Not Disclosed'}</dd>
          </div>
          <div className="sm:col-span-2 py-2 border-b border-slate-200/80 dark:border-white/[0.06] space-y-1">
            <dt className="text-slate-500 dark:text-zinc-400 text-xs">Reason for Selling (Seller Disclosed)</dt>
            <dd className="text-slate-800 dark:text-zinc-200">{car.usageHistory.reasonForSelling || 'Not Provided'}</dd>
          </div>
          <div className="sm:col-span-2 py-2 space-y-1">
            <dt className="text-slate-500 dark:text-zinc-400 text-xs">Registration History Summary</dt>
            <dd className="text-slate-800 dark:text-zinc-200">{car.usageHistory.registrationHistoryNote || 'Not Provided'}</dd>
          </div>
        </dl>
      </section>

      {/* 9. Accident, Damage & Repair History */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-1" />
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                Accident, Damage &amp; Repair Disclosure
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                Status:{' '}
                <strong className="text-slate-900 dark:text-white">{car.accidentHistory.overallStatus}</strong>
              </p>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Major Accident Disclosure', value: car.accidentHistory.majorAccidents },
            { label: 'Minor Accident Disclosure', value: car.accidentHistory.minorAccidents },
            { label: 'Repainted Panels', value: car.accidentHistory.repaintedPanels },
            { label: 'Replaced Parts', value: car.accidentHistory.replacedParts },
            { label: 'Flood Damage Disclosure', value: car.accidentHistory.floodDamage },
            { label: 'Structural Damage Disclosure', value: car.accidentHistory.structuralDamage },
            { label: 'Insurance Claim History', value: car.accidentHistory.insuranceClaims },
            { label: 'Major Mechanical Repairs', value: car.accidentHistory.majorMechanicalRepairs },
          ].map((row) => (
            <div key={row.label} className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] space-y-1">
              <dt className="text-xs text-slate-500 dark:text-zinc-500">{row.label}</dt>
              <dd className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">{row.value || 'Not Disclosed'}</dd>
            </div>
          ))}
        </dl>

        {(car.accidentHistory.otherRepairNotes || car.accidentHistory.evidenceNote) && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] text-xs text-slate-700 dark:text-zinc-300 space-y-1.5">
            {car.accidentHistory.otherRepairNotes && <p>Repair Notes: {car.accidentHistory.otherRepairNotes}</p>}
            {car.accidentHistory.evidenceNote && (
              <p className="text-emerald-700 dark:text-emerald-300">Supporting Evidence: {car.accidentHistory.evidenceNote}</p>
            )}
          </div>
        )}
      </section>

      {/* 10. Chronological Service & Maintenance Timeline */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <History className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-1" />
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                Service &amp; Maintenance Timeline
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 tabular-nums">
                Last Service: {formatReadableDate(car.serviceHistory.lastServiceDate)} · Odometer:{' '}
                {car.serviceHistory.lastServiceOdometerKm
                  ? formatKm(car.serviceHistory.lastServiceOdometerKm)
                  : 'Not Provided'}
              </p>
            </div>
          </div>
        </div>

        {car.serviceHistory.records.length === 0 ? (
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] text-sm text-slate-600 dark:text-zinc-400">
            Service log entries have not been uploaded yet (Verification Pending).
          </div>
        ) : (
          <ol className="space-y-4">
            {car.serviceHistory.records.map((rec) => (
              <li
                key={rec.id}
                className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono text-blue-700 dark:text-blue-400 font-semibold tabular-nums">
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                    <span>{formatReadableDate(rec.date)}</span>
                  </span>
                  <span className="font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
                    {rec.odometerKm ? formatKm(rec.odometerKm) : 'Odometer Not Recorded'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {rec.serviceCenter || 'Service Centre Not Disclosed'}
                </p>
                <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{rec.summary}</p>
                {rec.receiptNote && (
                  <p className="text-xs text-slate-500 dark:text-zinc-500">Documentation: {rec.receiptNote}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 11. Document & Legal Information */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
        <div className="flex items-start gap-3">
          <FileCheck2 className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-1" />
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
              Document &amp; Legal Verification
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
              Original documents are inspected privately at purchase. Sensitive registration and owner IDs are redacted online.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {car.documents.map((doc) => (
            <div
              key={doc.key}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{doc.label}</span>
                <span className={`text-xs font-semibold shrink-0 ${documentTone(doc.status)}`}>
                  {doc.status}
                </span>
              </div>
              {doc.note && <p className="text-xs text-slate-600 dark:text-zinc-400">{doc.note}</p>}
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-zinc-400 pt-1">
          <AlertTriangle className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
          <span>
            Buyers may inspect original RC, insurance policy, and service invoices in person prior to token payment.
          </span>
        </div>
      </section>
    </div>
  );
}

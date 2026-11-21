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

function isMeaningful(val: unknown): boolean {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  return (
    lower !== 'not provided' &&
    lower !== 'not disclosed' &&
    lower !== 'not available' &&
    lower !== 'not inspected' &&
    lower !== 'verification pending' &&
    lower !== 'none'
  );
}

export function HistoryAndLegalSection({ car }: HistoryAndLegalSectionProps) {
  const age = calculateVehicleAge(car.registrationDate, car.registrationYear || car.year);
  const avgAnnualKm = calculateAvgAnnualKm(car.kilometres, car.registrationDate);

  // 1. Usage stats & DL items
  const usageStats: { label: string; value: string; isMono?: boolean }[] = [];
  if (age?.label) usageStats.push({ label: 'Vehicle Age', value: age.label });
  if (car.kilometres > 0) usageStats.push({ label: 'Distance Driven', value: formatKm(car.kilometres), isMono: true });
  if (isMeaningful(car.ownership)) usageStats.push({ label: 'Ownership', value: car.ownership });
  if (isMeaningful(car.usageHistory?.usageType)) usageStats.push({ label: 'Usage Type', value: car.usageHistory.usageType });

  const usageDl: { label: string; value: string; isMono?: boolean; fullWidth?: boolean }[] = [];
  if (car.registrationDate && isMeaningful(formatReadableDate(car.registrationDate))) {
    usageDl.push({ label: 'First Registration Date', value: formatReadableDate(car.registrationDate), isMono: true });
  }
  if (car.kilometres > 0 && isMeaningful(avgAnnualKm)) {
    usageDl.push({ label: 'Avg. Annual Kilometres', value: avgAnnualKm, isMono: true });
  }
  if (
    car.usageHistory?.previousOwnersCount !== undefined &&
    car.usageHistory?.previousOwnersCount !== null &&
    Number(car.usageHistory.previousOwnersCount) > 0
  ) {
    usageDl.push({ label: 'Previous Owners', value: String(car.usageHistory.previousOwnersCount), isMono: true });
  }
  if (isMeaningful(car.usageHistory?.drivingPattern)) {
    usageDl.push({ label: 'Disclosed Driving Pattern', value: car.usageHistory.drivingPattern });
  }
  if (isMeaningful(car.usageHistory?.reasonForSelling)) {
    usageDl.push({ label: 'Reason for Selling (Seller Disclosed)', value: car.usageHistory.reasonForSelling, fullWidth: true });
  }
  if (isMeaningful(car.usageHistory?.registrationHistoryNote)) {
    usageDl.push({ label: 'Registration History Summary', value: car.usageHistory.registrationHistoryNote, fullWidth: true });
  }

  const hasUsageContent = usageStats.length > 0 || usageDl.length > 0;

  // 2. Accident History
  const accidentRows = [
    { label: 'Major Accident Disclosure', value: car.accidentHistory?.majorAccidents },
    { label: 'Minor Accident Disclosure', value: car.accidentHistory?.minorAccidents },
    { label: 'Repainted Panels', value: car.accidentHistory?.repaintedPanels },
    { label: 'Replaced Parts', value: car.accidentHistory?.replacedParts },
    { label: 'Flood Damage Disclosure', value: car.accidentHistory?.floodDamage },
    { label: 'Structural Damage Disclosure', value: car.accidentHistory?.structuralDamage },
    { label: 'Insurance Claim History', value: car.accidentHistory?.insuranceClaims },
    { label: 'Major Mechanical Repairs', value: car.accidentHistory?.majorMechanicalRepairs },
  ].filter((row) => isMeaningful(row.value));

  const hasAccidentContent =
    accidentRows.length > 0 ||
    isMeaningful(car.accidentHistory?.otherRepairNotes) ||
    isMeaningful(car.accidentHistory?.evidenceNote);

  // 3. Service Timeline
  const serviceRecords = car.serviceHistory?.records || [];
  const hasServiceContent =
    serviceRecords.length > 0 || isMeaningful(car.serviceHistory?.lastServiceDate);

  // 4. Documents
  const validDocs = (car.documents || []).filter((doc) => {
    if (doc.status === 'Verified' || doc.status === 'Seller Provided') return true;
    if (doc.note && isMeaningful(doc.note)) return true;
    return false;
  });

  // If nothing in this entire section was filled by admin, return null
  if (!hasUsageContent && !hasAccidentContent && !hasServiceContent && validDocs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* 4. Vehicle Age & Usage History */}
      {hasUsageContent && (
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
            {isMeaningful(car.usageHistory?.recordVerification) && (
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                Source: <strong className="text-slate-900 dark:text-white">{car.usageHistory.recordVerification}</strong>
              </span>
            )}
          </div>

          {usageStats.length > 0 && (
            <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(usageStats.length, 4)} gap-4`}>
              {usageStats.map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07]">
                  <p className="text-xs text-slate-500 dark:text-zinc-500">{stat.label}</p>
                  <p className={`${stat.isMono ? 'font-mono' : 'font-display'} text-base sm:text-lg font-semibold text-slate-900 dark:text-white mt-1 tabular-nums`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {usageDl.length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {usageDl.map((row) => (
                <div
                  key={row.label}
                  className={`${row.fullWidth ? 'sm:col-span-2' : ''} flex justify-between gap-4 py-2 border-b border-slate-200/80 dark:border-white/[0.06]`}
                >
                  <dt className="text-slate-600 dark:text-zinc-400">{row.label}</dt>
                  <dd className={`text-slate-900 dark:text-white ${row.isMono ? 'font-mono tabular-nums text-right' : ''}`}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      )}

      {/* 9. Accident, Damage & Repair History */}
      {hasAccidentContent && (
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-1" />
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  Accident, Damage &amp; Repair Disclosure
                </h2>
                {isMeaningful(car.accidentHistory?.overallStatus) && (
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                    Status:{' '}
                    <strong className="text-slate-900 dark:text-white">{car.accidentHistory.overallStatus}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {accidentRows.length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {accidentRows.map((row) => (
                <div key={row.label} className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] space-y-1">
                  <dt className="text-xs text-slate-500 dark:text-zinc-500">{row.label}</dt>
                  <dd className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {(isMeaningful(car.accidentHistory?.otherRepairNotes) || isMeaningful(car.accidentHistory?.evidenceNote)) && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] text-xs text-slate-700 dark:text-zinc-300 space-y-1.5">
              {isMeaningful(car.accidentHistory?.otherRepairNotes) && (
                <p>Repair Notes: {car.accidentHistory.otherRepairNotes}</p>
              )}
              {isMeaningful(car.accidentHistory?.evidenceNote) && (
                <p className="text-emerald-700 dark:text-emerald-300">Supporting Evidence: {car.accidentHistory.evidenceNote}</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* 10. Chronological Service & Maintenance Timeline */}
      {hasServiceContent && (
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-start gap-3">
              <History className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-1" />
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  Service &amp; Maintenance Timeline
                </h2>
                {isMeaningful(formatReadableDate(car.serviceHistory.lastServiceDate)) && (
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 tabular-nums">
                    Last Service: {formatReadableDate(car.serviceHistory.lastServiceDate)}
                    {car.serviceHistory.lastServiceOdometerKm ? ` · Odometer: ${formatKm(car.serviceHistory.lastServiceOdometerKm)}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {serviceRecords.length > 0 && (
            <ol className="space-y-4">
              {serviceRecords.map((rec) => (
                <li
                  key={rec.id}
                  className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {rec.date && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-blue-700 dark:text-blue-400 font-semibold tabular-nums">
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        <span>{formatReadableDate(rec.date)}</span>
                      </span>
                    )}
                    {rec.odometerKm ? (
                      <span className="font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
                        {formatKm(rec.odometerKm)}
                      </span>
                    ) : null}
                  </div>
                  {isMeaningful(rec.serviceCenter) && (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {rec.serviceCenter}
                    </p>
                  )}
                  {rec.summary && (
                    <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{rec.summary}</p>
                  )}
                  {rec.receiptNote && (
                    <p className="text-xs text-slate-500 dark:text-zinc-500">Documentation: {rec.receiptNote}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* 11. Document & Legal Information */}
      {validDocs.length > 0 && (
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
          <div className="flex items-start gap-3">
            <FileCheck2 className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-1" />
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                Document &amp; Legal Verification
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                Verified documents available for inspection.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {validDocs.map((doc) => (
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
                {doc.note && isMeaningful(doc.note) && <p className="text-xs text-slate-600 dark:text-zinc-400">{doc.note}</p>}
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
      )}
    </div>
  );
}

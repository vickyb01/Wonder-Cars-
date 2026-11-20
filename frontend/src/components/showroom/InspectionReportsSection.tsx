import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, HelpCircle, Wrench } from 'lucide-react';
import type { BatteryDetails, InspectionCondition, InspectionItem, TyreDetail } from '../../types/car';
import { VehicleImage } from '../VehicleImage';

interface InspectionReportsSectionProps {
  exteriorReport: InspectionItem[];
  interiorReport: InspectionItem[];
  mechanicalReport: InspectionItem[];
  tyreDetails: TyreDetail[];
  batteryDetails: BatteryDetails;
}

type InspectionTab = 'exterior' | 'interior' | 'mechanical' | 'tyres';

function statusTextColor(status: InspectionCondition): string {
  switch (status) {
    case 'Excellent':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'Good':
      return 'text-sky-700 dark:text-sky-400';
    case 'Average':
      return 'text-amber-700 dark:text-amber-300';
    case 'Needs Attention':
      return 'text-rose-700 dark:text-rose-400';
    case 'Not Inspected':
    default:
      return 'text-slate-500 dark:text-zinc-500';
  }
}

function StatusIcon({ status }: { status: InspectionCondition }) {
  if (status === 'Excellent' || status === 'Good') {
    return <CheckCircle2 className={`w-4 h-4 shrink-0 ${statusTextColor(status)}`} />;
  }
  if (status === 'Average' || status === 'Needs Attention') {
    return <AlertCircle className={`w-4 h-4 shrink-0 ${statusTextColor(status)}`} />;
  }
  return <HelpCircle className="w-4 h-4 shrink-0 text-slate-400 dark:text-zinc-500" />;
}

export function InspectionReportsSection({
  exteriorReport,
  interiorReport,
  mechanicalReport,
  tyreDetails,
  batteryDetails,
}: InspectionReportsSectionProps) {
  const [activeTab, setActiveTab] = useState<InspectionTab>('exterior');
  const [expanded, setExpanded] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<InspectionItem | null>(null);

  const activeList =
    activeTab === 'exterior'
      ? exteriorReport
      : activeTab === 'interior'
      ? interiorReport
      : mechanicalReport;

  const inspectedCount = activeList.filter((i) => i.status !== 'Not Inspected').length;
  const attentionCount = activeList.filter((i) => i.status === 'Needs Attention').length;

  return (
    <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
            Physical Inspection Dossier
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
            Condition, Mechanical &amp; Tyre Audit
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            Items not yet physically verified are transparently marked Not Inspected.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-transparent text-xs font-medium text-slate-800 dark:text-zinc-200 cursor-pointer"
        >
          <span>{expanded ? 'Collapse Report' : 'Expand Report'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Category Switcher */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08]">
        {[
          { id: 'exterior', label: `Exterior (${exteriorReport.length})` },
          { id: 'interior', label: `Interior (${interiorReport.length})` },
          { id: 'mechanical', label: `Engine & Mechanical (${mechanicalReport.length})` },
          { id: 'tyres', label: 'Tyres & Battery' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as InspectionTab);
              setExpanded(true);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-700 dark:bg-blue-600 text-white'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {expanded && (
        <>
          {activeTab === 'tyres' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  Tyre Tread &amp; Fitment Check
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tyreDetails.map((tyre) => (
                    <div
                      key={tyre.position}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{tyre.position}</span>
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                          {tyre.treadCondition || 'Not Inspected'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-400">
                        Brand: <span className="text-slate-800 dark:text-zinc-200">{tyre.brand || 'Not Provided'}</span>
                      </p>
                      {tyre.replacementNote && (
                        <p className="text-xs text-slate-500 dark:text-zinc-500">{tyre.replacementNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] space-y-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Battery &amp; Power Unit Health
                  </h3>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <dt className="text-slate-500 dark:text-zinc-500">Battery Brand / Spec</dt>
                    <dd className="text-slate-900 dark:text-zinc-200 font-medium mt-0.5">
                      {batteryDetails.brand || 'Not Provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-zinc-500">Estimated Age</dt>
                    <dd className="text-slate-900 dark:text-zinc-200 font-medium mt-0.5">
                      {batteryDetails.age || 'Not Provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-zinc-500">Condition Rating</dt>
                    <dd className="text-slate-900 dark:text-zinc-200 font-medium mt-0.5">
                      {batteryDetails.condition || 'Not Inspected'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-zinc-500">Replacement History</dt>
                    <dd className="text-slate-900 dark:text-zinc-200 font-medium mt-0.5">
                      {batteryDetails.replacementHistory || 'Not Provided'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-zinc-400 pb-2 border-b border-slate-200 dark:border-white/[0.06] tabular-nums">
                <span>
                  Inspected Components: <strong className="text-slate-900 dark:text-white">{inspectedCount}</strong> / {activeList.length}
                </span>
                {attentionCount > 0 && (
                  <span className="text-rose-700 dark:text-rose-400 font-medium">
                    {attentionCount} item{attentionCount > 1 ? 's' : ''} flagged Needs Attention
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeList.map((item) => (
                  <div
                    key={item.component}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{item.component}</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 ${statusTextColor(item.status)}`}>
                        <StatusIcon status={item.status} />
                        <span>{item.status}</span>
                      </span>
                    </div>

                    {item.notes && <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{item.notes}</p>}

                    {item.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(item)}
                        className="self-start text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        View Inspection Photo
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {photoPreview?.photoUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPhotoPreview(null)}
        >
          <div
            className="max-w-2xl w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-sm text-slate-900 dark:text-white font-semibold">
              <span>{photoPreview.component} — {photoPreview.status}</span>
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
            <VehicleImage src={photoPreview.photoUrl} alt={photoPreview.component} className="w-full max-h-[65vh] object-contain rounded-lg" />
            {photoPreview.notes && <p className="text-xs text-slate-600 dark:text-zinc-400">{photoPreview.notes}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

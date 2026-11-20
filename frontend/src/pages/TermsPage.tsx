import { SeoHead } from '../components/SeoHead';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] pt-28 pb-20 transition-colors duration-200">
      <SeoHead
        title="Terms & Conditions"
        description="Terms and Conditions governing vehicle listings and transactions at Strada Motors."
      />

      <article className="max-w-3xl mx-auto px-5 sm:px-8 space-y-8 text-slate-700 dark:text-zinc-300">
        <header className="space-y-2 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Legal</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-slate-500">Last updated: November 2026</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            1. Vehicle Listings &amp; Pricing
          </h2>
          <p>
            All prices displayed in Indian Rupees (INR) represent ex-gallery vehicle prices unless stated otherwise. Road tax, inter-state RTO transfer fees, and comprehensive insurance renewals are itemized transparently in the final buyer order sheet.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            2. Reservations &amp; Test Drives
          </h2>
          <p>
            Vehicles remain open to purchase until a formal booking deposit is acknowledged in writing by Strada Motors. Test drives require a valid Indian driving licence and prior appointment confirmation.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            3. Inspection &amp; Warranty Disclosures
          </h2>
          <p>
            Every automobile undergoes our 210-point mechanical and paint-depth audit prior to handover. Manufacturer warranties, where active, transfer in accordance with OEM terms and conditions.
          </p>
        </section>
      </article>
    </div>
  );
}

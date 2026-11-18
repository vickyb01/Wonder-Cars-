import { SeoHead } from '../components/SeoHead';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] pt-28 pb-20 transition-colors duration-200">
      <SeoHead title="Privacy Policy" description="Privacy Policy for Strada Motors Private Limited." />

      <article className="max-w-3xl mx-auto px-5 sm:px-8 space-y-8 text-slate-700 dark:text-zinc-300">
        <header className="space-y-2 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Legal</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-500">Last updated: November 2026</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            1. Information We Collect
          </h2>
          <p>
            When you schedule a test drive, request a vehicle valuation, or contact our gallery concierge, Strada Motors collects your name, telephone number, email address, preferred city, and vehicle details necessary to fulfill your request.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            2. Use of Personal Information
          </h2>
          <p>
            Your contact details are used solely to coordinate vehicle viewings, share certified inspection records, process RTO ownership transfers, and provide financing assistance upon request. We never sell or lease client records to third-party marketing brokers.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            3. Data Security &amp; Retention
          </h2>
          <p>
            All enquiry records and vehicle ownership documentation are stored securely with restricted administrative access. You may request deletion or correction of your contact records at any time by writing to concierge@stradamotors.in.
          </p>
        </section>
      </article>
    </div>
  );
}

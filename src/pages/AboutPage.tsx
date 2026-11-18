import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { VehicleImage } from '../components/VehicleImage';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-white pt-24 pb-20 transition-colors duration-200">
      <SeoHead
        title="About Us"
        description="Learn how Strada Motors curates, inspects, and delivers India's finest pre-owned luxury and performance automobiles."
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-20">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
        >
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Our Heritage
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
              Raising the Standard for Pre-Owned Automotive Ownership
            </h1>
            <p className="text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
              Founded by automotive engineers and private collectors, Strada Motors bridges the gap between factory-new flagship dealerships and the pre-owned market. We acquire fewer than 8% of the vehicles offered to us—selecting only clean-title, service-documented automobiles.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/cars"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/cars"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-sm font-semibold transition-colors"
              >
                <span>Visit a Gallery</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] aspect-[16/10] shadow-sm dark:shadow-none">
            <VehicleImage
              src="/src/assets/images/car_audi_rs_etron_1794898131413.jpg"
              alt="Strada Motors architectural gallery"
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.section>

        {/* Key Benchmarks */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-10 border-y border-slate-200 dark:border-white/[0.08]">
          {[
            { metric: '210-Point', label: 'Forensic Mechanical & Paint Audit' },
            { metric: '3 Cities', label: 'Mumbai · New Delhi · Bengaluru Galleries' },
            { metric: '100%', label: 'Authorized Service History Verification' },
            { metric: '24 Hours', label: 'Direct Seller Valuation Turnaround' },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5">
              <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                {item.metric}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">{item.label}</p>
            </div>
          ))}
        </section>

        {/* Inspection Protocol */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              title: 'Ultrasonic Paint & Chassis Audit',
              body: 'Every body panel is measured with digital coating gauges to confirm original factory paint depth and zero structural repairs.',
            },
            {
              num: '02',
              title: 'OEM Diagnostic Telemetry',
              body: 'Full ECU readout checks for over-revs, battery state-of-health on EVs, suspension air-strut pressures, and authentic mileage verification.',
            },
            {
              num: '03',
              title: 'RTO, Hypothecation & Title Clearance',
              body: 'Our legal desk verifies NCRP clearance, insurance claim history, and manages inter-state NOC and RC transfer end-to-end.',
            },
          ].map((card) => (
            <div
              key={card.num}
              className="p-7 rounded-2xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] space-y-3"
            >
              <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                {card.num}.
              </span>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{card.title}</h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { submitSellRequest } from '../utils/api';
import { SeoHead } from '../components/SeoHead';
import { VehicleImage } from '../components/VehicleImage';

const inputCls =
  'w-full h-11 px-3.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#09090B]';

export function SellCarPage() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2022');
  const [kilometres, setKilometres] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [transmission, setTransmission] = useState('Automatic');
  const [ownership, setOwnership] = useState('1st Owner');
  const [city, setCity] = useState('Mumbai');
  const [expectedPriceInr, setExpectedPriceInr] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedId, setSubmittedId] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!brand.trim() || !model.trim()) {
      setError('Please enter your vehicle brand and model.');
      return;
    }
    if (ownerPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await submitSellRequest({
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year),
        kilometres: Number(kilometres) || 0,
        fuelType,
        transmission,
        ownership,
        city,
        expectedPriceInr: Number(expectedPriceInr) || 0,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerEmail: ownerEmail.trim(),
        notes: notes.trim(),
      });
      setSubmittedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit valuation request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-white pt-24 pb-20 transition-colors duration-200">
      <SeoHead
        title="Sell Your Car"
        description="Receive a direct buyout offer or private consignment valuation for your luxury car within 24 hours."
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Narrative */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Direct Buyout &amp; Consignment
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
              Sell Your Automobile with Zero Friction
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              Skip unqualified classified callers. Strada Motors offers same-day bank-verified buyouts or discreet consignment inside our Mumbai, New Delhi, and Bengaluru flagship galleries.
            </p>

            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] aspect-[4/3] shadow-sm dark:shadow-none">
              <VehicleImage
                src="/src/assets/images/car_interior_cockpit_1794898131578.jpg"
                alt="Luxury vehicle inspection cockpit"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 pt-2">
              {[
                { title: '01. 24-Hour Firm Valuation', desc: 'Data-backed INR pricing benchmarked against real collector transactions.' },
                { title: '02. Doorstep Inspection', desc: 'Our master technician inspects your vehicle at your residence or office.' },
                { title: '03. Instant Settlement & RC Transfer', desc: 'Full RTGS payout prior to handover and complete RTO documentation handling.' },
              ].map((step) => (
                <div
                  key={step.title}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08]"
                >
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Valuation Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 sm:p-8 lg:p-10 shadow-sm dark:shadow-none">
            {submittedId ? (
              <div className="py-10 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Valuation Request Received
                </h2>
                <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                  Reference <span className="font-mono font-semibold text-slate-900 dark:text-white">{submittedId}</span> has been assigned to our Acquisition Desk. Expect a call from our senior buyer within 4 business hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedId('');
                    setBrand('');
                    setModel('');
                    setKilometres('');
                    setExpectedPriceInr('');
                    setNotes('');
                  }}
                  className="mt-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold cursor-pointer"
                >
                  Submit Another Vehicle
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
                  <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                    Vehicle &amp; Owner Details
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <span>Confidential Review</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sell-brand" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Brand / Marque *
                    </label>
                    <input
                      id="sell-brand"
                      type="text"
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Porsche, BMW, Mercedes-AMG"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="sell-model" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Model &amp; Variant *
                    </label>
                    <input
                      id="sell-model"
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. 911 Carrera S, M4 Competition"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="sell-year" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Manufacturing Year *
                    </label>
                    <input
                      id="sell-year"
                      type="number"
                      min={2005}
                      max={2027}
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={`${inputCls} font-mono tabular-nums`}
                    />
                  </div>
                  <div>
                    <label htmlFor="sell-km" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Kilometres Driven *
                    </label>
                    <input
                      id="sell-km"
                      type="number"
                      min={0}
                      required
                      value={kilometres}
                      onChange={(e) => setKilometres(e.target.value)}
                      placeholder="e.g. 12500"
                      className={`${inputCls} font-mono tabular-nums`}
                    />
                  </div>
                  <div>
                    <label htmlFor="sell-price" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Expected Price (INR)
                    </label>
                    <input
                      id="sell-price"
                      type="number"
                      min={0}
                      value={expectedPriceInr}
                      onChange={(e) => setExpectedPriceInr(e.target.value)}
                      placeholder="e.g. 14500000"
                      className={`${inputCls} font-mono tabular-nums`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="sell-fuel" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Fuel Type
                    </label>
                    <select
                      id="sell-fuel"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className={inputCls}
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sell-trans" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Transmission
                    </label>
                    <select
                      id="sell-trans"
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className={inputCls}
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="PDK">PDK</option>
                      <option value="DCT">DCT</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sell-owner" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Ownership
                    </label>
                    <select
                      id="sell-owner"
                      value={ownership}
                      onChange={(e) => setOwnership(e.target.value)}
                      className={inputCls}
                    >
                      <option value="1st Owner">1st Owner</option>
                      <option value="2nd Owner">2nd Owner</option>
                      <option value="3rd Owner">3rd Owner</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sell-city" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      City
                    </label>
                    <input
                      id="sell-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="sell-name" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Owner Full Name *
                    </label>
                    <input
                      id="sell-name"
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Full name"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="sell-phone" className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
                        Mobile Number *
                      </label>
                      {ownerPhone.length > 0 && ownerPhone.length < 10 && (
                        <span className="text-[10px] text-amber-500 font-mono">
                          {10 - ownerPhone.length} more needed
                        </span>
                      )}
                      {ownerPhone.length === 10 && (
                        <span className="text-[10px] text-emerald-500 font-medium">
                          ✓ 10 digits
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-semibold text-slate-500 dark:text-zinc-400 select-none pointer-events-none">
                        +91
                      </span>
                      <input
                        id="sell-phone"
                        type="tel"
                        inputMode="numeric"
                        required
                        maxLength={10}
                        value={ownerPhone}
                        onChange={(e) => {
                          let digits = e.target.value.replace(/\D/g, '');
                          if (digits.length > 10 && digits.startsWith('91')) {
                            digits = digits.slice(2);
                          }
                          setOwnerPhone(digits.slice(0, 10));
                        }}
                        placeholder="98XXXXXXXX"
                        className={`${inputCls} pl-11`}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="sell-email" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      id="sell-email"
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sell-notes" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                    Service History &amp; Optional Equipment Notes
                  </label>
                  <textarea
                    id="sell-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mention PPF, extended warranty, service center records, or registration state..."
                    className="w-full p-3.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#09090B]"
                  />
                </div>

                {error && <p className="text-xs font-medium text-rose-700 dark:text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {submitting ? 'Submitting Valuation Request...' : 'Request Valuation Offer'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

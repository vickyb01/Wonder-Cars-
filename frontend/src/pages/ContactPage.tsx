import { SeoHead } from '../components/SeoHead';
import { ContactSection } from '../components/ContactSection';

export function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-white pt-24 transition-colors duration-200">
      <SeoHead
        title="Contact Us"
        description="Contact Wonder Cars for vehicle enquiries, inspection reports, or test drive appointments, and view our Preet Vihar, Delhi showroom location on Google Maps."
        canonicalPath="/contact"
      />
      <ContactSection isMainHeading />
    </div>
  );
}

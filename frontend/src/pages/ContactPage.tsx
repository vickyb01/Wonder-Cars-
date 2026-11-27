import { SeoHead } from '../components/SeoHead';
import { ContactSection } from '../components/ContactSection';
import { CONTACT_SEO_DESCRIPTION, CONTACT_SEO_TITLE } from '../utils/seo';

export function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-white pt-24 transition-colors duration-200">
      <SeoHead
        title={CONTACT_SEO_TITLE}
        description={CONTACT_SEO_DESCRIPTION}
        canonicalPath="/contact"
      />
      <ContactSection isMainHeading />
    </div>
  );
}

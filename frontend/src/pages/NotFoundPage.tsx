import { Link } from 'react-router-dom';
import { ArrowLeft, Car, Home, SearchX } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-white pt-28 pb-20 px-5 sm:px-8 flex items-center justify-center transition-colors duration-200">
      <SeoHead
        title="Page Not Found"
        description="The page you requested could not be found on Used Car Nearby. Browse certified pre-owned cars or return to the homepage."
        robots="noindex, nofollow"
        noCanonical
        jsonLd={null}
      />

      <div className="max-w-xl w-full text-center space-y-6 p-8 sm:p-10 rounded-3xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <SearchX className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Error 404
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
            The page you are looking for does not exist, may have been moved, or the URL is incomplete.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/cars"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white text-sm font-semibold shadow-md shadow-amber-600/20 transition-all"
          >
            <Car className="w-4 h-4" aria-hidden="true" />
            <span>Browse Cars</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-zinc-200 text-sm font-semibold transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Back to Homepage</span>
          </Link>
        </div>

        <div className="pt-2">
          <Link
            to="/cars"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Explore available Wonder Cars inventory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

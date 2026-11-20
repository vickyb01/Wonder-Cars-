import { useLocation } from 'react-router-dom';
import { buildWhatsAppUrl } from '../utils/format';

export function FloatingWhatsAppButton() {
  const { pathname } = useLocation();
  const isCarDetail = pathname.startsWith('/cars/') && pathname !== '/cars/';
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin || isCarDetail) return null;

  const href = buildWhatsAppUrl(
    '918384068347',
    'Hello Wonder Cars, I would like assistance regarding a pre-owned vehicle.'
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Wonder Cars on WhatsApp"
      title="Chat on WhatsApp"
      className={`fixed right-4 sm:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-lg shadow-slate-900/20 dark:shadow-black/50 flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        isCarDetail ? 'bottom-20 lg:bottom-6' : 'bottom-5 sm:bottom-6'
      }`}
    >
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 fill-current"
        aria-hidden="true"
      >
        <path d="M16.002 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.256.59 4.46 1.71 6.403L3.1 28.99l6.752-1.77a12.74 12.74 0 0 0 6.15 1.58h.005c7.058 0 12.798-5.74 12.798-12.8 0-3.42-1.332-6.634-3.75-9.052A12.72 12.72 0 0 0 16.002 3.2Zm7.448 18.18c-.314.884-1.838 1.69-2.536 1.794-.646.096-1.464.136-2.362-.148-.544-.173-1.242-.404-2.14-.792-3.766-1.626-6.224-5.414-6.412-5.664-.188-.25-1.53-2.036-1.53-3.884 0-1.848.968-2.756 1.312-3.132.344-.376.75-.47 1-.47.25 0 .5.002.718.013.23.012.538-.088.842.642.314.752 1.064 2.598 1.158 2.786.094.188.156.408.03.658-.124.25-.188.408-.376.626-.188.218-.395.488-.564.656-.188.188-.384.392-.165.768.22.376.976 1.61 2.096 2.608 1.44 1.284 2.654 1.682 3.03 1.87.376.188.596.156.814-.094.22-.25.94-1.096 1.19-1.472.25-.376.5-.314.844-.188.344.126 2.192 1.034 2.568 1.222.376.188.626.282.72.438.094.156.094.908-.22 1.792Z" />
      </svg>
    </a>
  );
}

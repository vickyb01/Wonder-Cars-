import { useEffect, useState } from 'react';
import { CarFront } from 'lucide-react';

interface VehicleImageProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function VehicleImage({ src, alt, className = '', loading = 'lazy' }: VehicleImageProps) {
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);

  function handleError() {
    if (currentSrc && (currentSrc.startsWith('http://') || currentSrc.startsWith('https://'))) {
      try {
        const parsed = new URL(currentSrc);
        if (parsed.pathname.startsWith('/uploads/')) {
          setCurrentSrc(parsed.pathname);
          return;
        }
      } catch {
        // invalid url
      }
    }
    setFailed(true);
  }

  if (!currentSrc || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-[#18181B] dark:via-[#121215] dark:to-[#09090B] text-slate-500 dark:text-zinc-500 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <CarFront className="w-10 h-10 text-slate-400 dark:text-zinc-600 mb-2" strokeWidth={1.5} />
        <span className="text-xs tracking-wide text-slate-500 dark:text-zinc-500 px-4 text-center line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
}

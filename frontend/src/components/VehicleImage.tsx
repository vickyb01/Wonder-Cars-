import { useEffect, useRef, useState } from 'react';
import { CarFront } from 'lucide-react';
import { LIVE_BACKEND_URL, normalizeMediaUrl } from '../utils/api';

interface VehicleImageProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function VehicleImage({ src, alt, className = '', loading = 'lazy' }: VehicleImageProps) {
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const triedFallbackRef = useRef(false);

  useEffect(() => {
    triedFallbackRef.current = false;
    if (!src) {
      setCurrentSrc('');
      setFailed(true);
      return;
    }
    const normalized = normalizeMediaUrl(src);
    setCurrentSrc(normalized);
    setFailed(false);
  }, [src]);

  function handleError() {
    if (triedFallbackRef.current) {
      setFailed(true);
      return;
    }
    triedFallbackRef.current = true;

    if (!currentSrc) {
      setFailed(true);
      return;
    }

    // Fallback attempt 1: If full Render URL failed, attempt root relative /uploads (Vercel proxy rewrite)
    if (currentSrc.includes('/uploads/')) {
      const match = currentSrc.match(/\/uploads\/[^?#]+/);
      if (match) {
        const relativePath = match[0];
        if (currentSrc !== relativePath) {
          setCurrentSrc(relativePath);
          return;
        } else {
          // If relative failed, attempt absolute Render live backend URL
          const absoluteUrl = `${LIVE_BACKEND_URL.replace(/\/$/, '')}${relativePath}`;
          if (currentSrc !== absoluteUrl) {
            setCurrentSrc(absoluteUrl);
            return;
          }
        }
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

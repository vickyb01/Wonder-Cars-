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
  const attemptsRef = useRef<number>(0);
  const retryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    attemptsRef.current = 0;
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (!src) {
      setCurrentSrc('');
      setFailed(true);
      return;
    }
    const normalized = normalizeMediaUrl(src);
    setCurrentSrc(normalized);
    setFailed(false);

    return () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [src]);

  function handleError() {
    if (!currentSrc) {
      setFailed(true);
      return;
    }

    attemptsRef.current += 1;

    // Attempt 1: Fallback between relative /uploads/... and direct Render backend URL
    if (attemptsRef.current === 1 && currentSrc.includes('/uploads/')) {
      const match = currentSrc.match(/\/uploads\/[^?#]+/);
      if (match) {
        const relativePath = match[0];
        const absoluteUrl = `${LIVE_BACKEND_URL.replace(/\/$/, '')}${relativePath}`;
        if (currentSrc !== absoluteUrl) {
          setCurrentSrc(absoluteUrl);
          return;
        }
        if (currentSrc !== relativePath) {
          setCurrentSrc(relativePath);
          return;
        }
      }
    }

    // Attempt 1b: If /src/assets/ had a wrong origin, fallback to relative path
    if (attemptsRef.current === 1 && currentSrc.includes('/src/assets/')) {
      const match = currentSrc.match(/\/src\/assets\/[^?#]+/);
      if (match && currentSrc !== match[0]) {
        setCurrentSrc(match[0]);
        return;
      }
    }

    // Attempt 2: Retry once after 2.5s in case Render free tier is waking from cold start
    if (attemptsRef.current === 2 && currentSrc.includes('/uploads/')) {
      const match = currentSrc.match(/\/uploads\/[^?#]+/);
      if (match) {
        const retryUrl = `${LIVE_BACKEND_URL.replace(/\/$/, '')}${match[0]}?r=${Date.now()}`;
        retryTimerRef.current = window.setTimeout(() => {
          setCurrentSrc(retryUrl);
        }, 2500);
        return;
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

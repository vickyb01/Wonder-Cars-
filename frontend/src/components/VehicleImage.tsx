import { useCallback, useEffect, useRef, useState } from 'react';
import { CarFront } from 'lucide-react';
import {
  BACKEND_READY_EVENT,
  getUploadUrlCandidates,
  isBackendAwake,
  normalizeMediaUrl,
  wakeBackend,
} from '../utils/api';

interface VehicleImageProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  'aria-hidden'?: boolean | 'true' | 'false';
}

const COLD_START_RETRY_DELAYS_MS = [1500, 3000, 5000, 8000, 12000, 18000, 24000, 25000];

export function VehicleImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  'aria-hidden': ariaHidden,
}: VehicleImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const attemptsRef = useRef<number>(0);
  const retryTimerRef = useRef<number | null>(null);
  const waitingForBackendRef = useRef<boolean>(false);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    attemptsRef.current = 0;
    waitingForBackendRef.current = false;
    clearRetryTimer();

    if (!src) {
      setCurrentSrc('');
      setLoaded(false);
      setFailed(true);
      return;
    }

    const candidates = getUploadUrlCandidates(src);
    const initial = candidates[0] || normalizeMediaUrl(src);
    setCurrentSrc(initial);
    setLoaded(false);
    setFailed(false);

    return () => {
      clearRetryTimer();
    };
  }, [src, clearRetryTimer]);

  const retryImmediately = useCallback(() => {
    if (!src || loaded) return;
    const candidates = getUploadUrlCandidates(src);
    const target = candidates.find((u) => u.includes('/uploads/')) || normalizeMediaUrl(src);
    if (!target || !target.includes('/uploads/')) return;
    clearRetryTimer();
    waitingForBackendRef.current = false;
    const cleanBase = target.split('?')[0];
    setFailed(false);
    setCurrentSrc(`${cleanBase}?r=${Date.now()}`);
  }, [src, loaded, clearRetryTimer]);

  useEffect(() => {
    const handleWakeOrOnline = () => {
      if (waitingForBackendRef.current || failed) {
        retryImmediately();
      }
    };
    window.addEventListener(BACKEND_READY_EVENT, handleWakeOrOnline);
    window.addEventListener('online', handleWakeOrOnline);
    return () => {
      window.removeEventListener(BACKEND_READY_EVENT, handleWakeOrOnline);
      window.removeEventListener('online', handleWakeOrOnline);
    };
  }, [failed, retryImmediately]);

  function handleError() {
    if (!currentSrc || !src) {
      setFailed(true);
      return;
    }

    attemptsRef.current += 1;
    const attempt = attemptsRef.current;

    // Step 1: Switch between relative /uploads/... and direct Render backend URL immediately
    if (currentSrc.includes('/uploads/')) {
      const candidates = getUploadUrlCandidates(src);
      if (attempt === 1) {
        const alternate = candidates.find((c) => c !== currentSrc.split('?')[0]);
        if (alternate) {
          setCurrentSrc(alternate);
          return;
        }
      }

      // Trigger shared Render warmup ping so backend wakes while image waits
      void wakeBackend();

      // If backend is already known awake and both origins failed + one quick retry failed, don't hang on true 404s
      const maxRetries = isBackendAwake() ? 3 : COLD_START_RETRY_DELAYS_MS.length + 1;
      if (attempt <= maxRetries) {
        const delayMs = COLD_START_RETRY_DELAYS_MS[Math.min(attempt - 2, COLD_START_RETRY_DELAYS_MS.length - 1)] || 2500;
        const baseCandidate = candidates[(attempt - 1) % candidates.length] || candidates[0];
        const retryUrl = `${baseCandidate.split('?')[0]}?r=${Date.now()}`;
        waitingForBackendRef.current = true;
        clearRetryTimer();
        retryTimerRef.current = window.setTimeout(() => {
          setCurrentSrc(retryUrl);
        }, Math.max(1200, delayMs));
        return;
      }
    }

    // Step 1b: If /src/assets/ had a wrong origin, fallback to relative path
    if (attempt === 1 && currentSrc.includes('/src/assets/')) {
      const match = currentSrc.match(/\/src\/assets\/[^?#]+/);
      if (match && currentSrc !== match[0]) {
        setCurrentSrc(match[0]);
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
        aria-hidden={ariaHidden}
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
      decoding="async"
      referrerPolicy="no-referrer"
      aria-hidden={ariaHidden}
      onLoad={() => {
        setLoaded(true);
        setFailed(false);
        waitingForBackendRef.current = false;
        clearRetryTimer();
      }}
      onError={handleError}
      className={`${className} ${!loaded && currentSrc.includes('/uploads/') ? 'bg-slate-500/15 animate-pulse' : ''}`}
    />
  );
}

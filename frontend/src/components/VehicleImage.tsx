import { useCallback, useEffect, useRef, useState } from 'react';
import { CarFront } from 'lucide-react';
import {
  BACKEND_READY_EVENT,
  getUploadUrlCandidates,
  isBackendAwake,
  markUploadProxyFailed,
  normalizeMediaUrl,
  wakeBackend,
} from '../utils/api';
import { getOptimizedWebpUrl } from '../utils/optimizedImages';

interface VehicleImageProps {
  src?: string;
  desktopSrc?: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'async' | 'sync' | 'auto';
  width?: number;
  height?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
}

const COLD_START_RETRY_DELAYS_MS = [1000, 2000, 3500, 5000, 8000, 12000, 15000, 20000];
const AWAKE_RETRY_DELAYS_MS = [800, 1800, 3500, 6000];

function resolveInitialSrc(src?: string): string {
  if (!src) return '';
  const candidates = getUploadUrlCandidates(src);
  return candidates[0] || normalizeMediaUrl(src);
}

function getRetryUrlForSource(rawSrc: string | undefined, activeUrl: string, attempt: number): string {
  if (!rawSrc || !activeUrl) return activeUrl;
  const cleanActive = activeUrl.split('?')[0];

  if (activeUrl.includes('/uploads/')) {
    const candidates = getUploadUrlCandidates(rawSrc);
    if (attempt === 1) {
      const alternate = candidates.find((c) => c !== cleanActive);
      if (alternate) return alternate;
    }
    const baseCandidate = candidates[attempt % candidates.length] || candidates[0];
    if (!baseCandidate) return activeUrl;
    const cleanBase = baseCandidate.split('?')[0];
    if (attempt <= 1 && cleanBase !== activeUrl) {
      return cleanBase;
    }
    return `${cleanBase}?retry=${attempt}`;
  }

  if (attempt === 1 && activeUrl.includes('/src/assets/')) {
    const match = activeUrl.match(/\/src\/assets\/[^?#]+/);
    if (match && activeUrl !== match[0]) return match[0];
  }

  return attempt <= 2 ? `${cleanActive}?retry=${attempt}` : activeUrl;
}

export function VehicleImage({
  src,
  desktopSrc,
  alt,
  className = '',
  loading = 'lazy',
  fetchPriority,
  decoding = 'async',
  width,
  height,
  'aria-hidden': ariaHidden,
}: VehicleImageProps) {
  const initialSrc = resolveInitialSrc(src);
  const initialDesktopSrc = resolveInitialSrc(desktopSrc);
  const [failed, setFailed] = useState<boolean>(() => !initialSrc);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [webpBypassed, setWebpBypassed] = useState<boolean>(false);
  const [currentSrc, setCurrentSrc] = useState<string>(() => initialSrc);
  const [currentDesktopSrc, setCurrentDesktopSrc] = useState<string>(() => initialDesktopSrc);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const prevInitialSrcRef = useRef<string>(initialSrc);
  const prevInitialDesktopSrcRef = useRef<string>(initialDesktopSrc);
  const attemptsRef = useRef<number>(0);
  const retryTimerRef = useRef<number | null>(null);
  const waitingForBackendRef = useRef<boolean>(false);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const nextInitial = resolveInitialSrc(src);
    const nextInitialDesktop = resolveInitialSrc(desktopSrc);

    if (!nextInitial) {
      clearRetryTimer();
      prevInitialSrcRef.current = '';
      prevInitialDesktopSrcRef.current = '';
      attemptsRef.current = 0;
      waitingForBackendRef.current = false;
      setWebpBypassed(false);
      setCurrentSrc('');
      setCurrentDesktopSrc('');
      setLoaded(false);
      setFailed(true);
      return;
    }

    // Only reset state when resolved URLs actually change so re-renders never trap loaded=false
    if (
      nextInitial !== prevInitialSrcRef.current ||
      nextInitialDesktop !== prevInitialDesktopSrcRef.current
    ) {
      clearRetryTimer();
      prevInitialSrcRef.current = nextInitial;
      prevInitialDesktopSrcRef.current = nextInitialDesktop;
      attemptsRef.current = 0;
      waitingForBackendRef.current = false;
      setWebpBypassed(false);
      setFailed(false);
      setLoaded(false);
      setCurrentSrc(nextInitial);
      setCurrentDesktopSrc(nextInitialDesktop);
    }

    return () => {
      clearRetryTimer();
    };
  }, [src, desktopSrc, clearRetryTimer]);

  // Synchronize cached or synchronously-decoded images immediately
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      setFailed(false);
    }
  }, [currentSrc, currentDesktopSrc]);

  const retryImmediately = useCallback(() => {
    if (!src || loaded) return;
    const target = resolveInitialSrc(src);
    if (!target) return;
    const desktopTarget = resolveInitialSrc(desktopSrc);

    clearRetryTimer();
    waitingForBackendRef.current = false;
    attemptsRef.current = 0;
    setFailed(false);
    setLoaded(false);
    // Use clean URL if switching back from fallback; add cache-breaker only if retrying exact same URL
    const cleanTarget = target.split('?')[0];
    const cleanCurrent = currentSrc.split('?')[0];
    setCurrentSrc(cleanTarget === cleanCurrent ? `${cleanTarget}?retry=${Date.now()}` : target);
    if (desktopTarget) {
      const cleanDesktopTarget = desktopTarget.split('?')[0];
      const cleanDesktopCurrent = currentDesktopSrc.split('?')[0];
      setCurrentDesktopSrc(
        cleanDesktopTarget === cleanDesktopCurrent
          ? `${cleanDesktopTarget}?retry=${Date.now()}`
          : desktopTarget
      );
    } else {
      setCurrentDesktopSrc('');
    }
  }, [src, desktopSrc, loaded, currentSrc, currentDesktopSrc, clearRetryTimer]);

  useEffect(() => {
    const handleWakeOrOnline = () => {
      if (waitingForBackendRef.current || failed) {
        retryImmediately();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && (waitingForBackendRef.current || failed)) {
        retryImmediately();
      }
    };
    window.addEventListener(BACKEND_READY_EVENT, handleWakeOrOnline);
    window.addEventListener('online', handleWakeOrOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener(BACKEND_READY_EVENT, handleWakeOrOnline);
      window.removeEventListener('online', handleWakeOrOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [failed, retryImmediately]);

  function handleError() {
    if (!currentSrc || !src) {
      setFailed(true);
      return;
    }

    const activeMobileWebp = getOptimizedWebpUrl(currentSrc);
    const activeDesktopWebp = getOptimizedWebpUrl(currentDesktopSrc);
    if (!webpBypassed && (activeMobileWebp || activeDesktopWebp)) {
      setWebpBypassed(true);
      return;
    }

    attemptsRef.current += 1;
    const attempt = attemptsRef.current;
    const hasUploadSource =
      currentSrc.includes('/uploads/') || currentDesktopSrc.includes('/uploads/');

    // Step 1: Switch between relative /uploads/... proxy and direct Render backend URL
    if (hasUploadSource) {
      if (
        (currentSrc.includes('/uploads/') && !currentSrc.startsWith('http')) ||
        (currentDesktopSrc.includes('/uploads/') && !currentDesktopSrc.startsWith('http'))
      ) {
        markUploadProxyFailed();
      }

      if (attempt === 1) {
        const nextSrc = getRetryUrlForSource(src, currentSrc, 1);
        const nextDesktop = getRetryUrlForSource(desktopSrc, currentDesktopSrc, 1);
        if (nextSrc !== currentSrc || nextDesktop !== currentDesktopSrc) {
          setCurrentSrc(nextSrc);
          setCurrentDesktopSrc(nextDesktop);
          return;
        }
      }

      void wakeBackend();

      const delays = isBackendAwake() ? AWAKE_RETRY_DELAYS_MS : COLD_START_RETRY_DELAYS_MS;
      const maxRetries = delays.length + 1;
      if (attempt <= maxRetries) {
        const delayMs = delays[Math.min(attempt - 2, delays.length - 1)] || 1500;
        const nextSrc = getRetryUrlForSource(src, currentSrc, attempt);
        const nextDesktop = getRetryUrlForSource(desktopSrc, currentDesktopSrc, attempt);
        waitingForBackendRef.current = true;
        clearRetryTimer();
        retryTimerRef.current = window.setTimeout(() => {
          setCurrentSrc(nextSrc);
          setCurrentDesktopSrc(nextDesktop);
        }, delayMs);
        return;
      }
    }

    // Step 1b: If /src/assets/ had an origin prefix, fallback to relative path
    if (attempt === 1 && (currentSrc.includes('/src/assets/') || currentDesktopSrc.includes('/src/assets/'))) {
      const nextSrc = currentSrc.includes('/src/assets/')
        ? getRetryUrlForSource(src, currentSrc, 1)
        : currentSrc;
      const nextDesktop = currentDesktopSrc.includes('/src/assets/')
        ? getRetryUrlForSource(desktopSrc, currentDesktopSrc, 1)
        : currentDesktopSrc;
      if (nextSrc !== currentSrc || nextDesktop !== currentDesktopSrc) {
        setCurrentSrc(nextSrc);
        setCurrentDesktopSrc(nextDesktop);
        return;
      }
    }

    // Step 2: Bounded retry for transient CDN/network failures on external image URLs (e.g. Cloudinary)
    if (!hasUploadSource && attempt <= 2) {
      const delayMs = attempt === 1 ? 800 : 2000;
      const nextSrc = getRetryUrlForSource(src, currentSrc, attempt);
      const nextDesktop = getRetryUrlForSource(desktopSrc, currentDesktopSrc, attempt);
      clearRetryTimer();
      retryTimerRef.current = window.setTimeout(() => {
        setCurrentSrc(nextSrc);
        setCurrentDesktopSrc(nextDesktop);
      }, delayMs);
      return;
    }

    waitingForBackendRef.current = false;
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

  const isUploadPending =
    !loaded && (currentSrc.includes('/uploads/') || currentDesktopSrc.includes('/uploads/'));

  const imgElement = (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      width={width}
      height={height}
      referrerPolicy="no-referrer"
      aria-hidden={ariaHidden}
      onLoad={() => {
        setLoaded(true);
        setFailed(false);
        waitingForBackendRef.current = false;
        clearRetryTimer();
      }}
      onError={handleError}
      className={`${className} ${isUploadPending ? 'bg-slate-500/15 animate-pulse' : ''}`}
    />
  );

  const mobileWebp = webpBypassed ? '' : getOptimizedWebpUrl(currentSrc);
  const desktopWebp = webpBypassed ? '' : getOptimizedWebpUrl(currentDesktopSrc);

  if (currentDesktopSrc && currentDesktopSrc !== currentSrc) {
    return (
      <picture className="contents">
        {desktopWebp && (
          <source media="(min-width: 768px)" srcSet={desktopWebp} type="image/webp" />
        )}
        <source media="(min-width: 768px)" srcSet={currentDesktopSrc} />
        {mobileWebp && mobileWebp !== currentSrc && (
          <source srcSet={mobileWebp} type="image/webp" />
        )}
        {imgElement}
      </picture>
    );
  }

  if (mobileWebp && mobileWebp !== currentSrc) {
    return (
      <picture className="contents">
        <source srcSet={mobileWebp} type="image/webp" />
        {imgElement}
      </picture>
    );
  }

  return imgElement;
}

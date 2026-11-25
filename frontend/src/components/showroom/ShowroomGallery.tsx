import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Expand,
  PlayCircle,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { CarPhoto, PhotoCategory } from '../../types/car';
import { VehicleImage } from '../VehicleImage';

interface ShowroomGalleryProps {
  carTitle: string;
  gallery: CarPhoto[];
  images?: string[];
  videoWalkthroughUrl?: string;
  fullScreenHero?: boolean;
}

const CATEGORIES: ('All' | PhotoCategory)[] = [
  'All',
  'Exterior',
  'Interior',
  'Engine & Mechanical',
  'Underbody & Storage',
];

export function ShowroomGallery({
  carTitle,
  gallery,
  images = [],
  videoWalkthroughUrl,
  fullScreenHero = false,
}: ShowroomGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | PhotoCategory>('All');
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const mergedGallery = useMemo(() => {
    const base = Array.isArray(gallery) ? gallery.filter((p) => Boolean(p?.url)) : [];
    const seenUrls = new Set(base.map((p) => p.url));
    const extras: CarPhoto[] = [];
    (images || []).forEach((url, idx) => {
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        extras.push({
          id: `extra-img-${idx}-${base.length + extras.length}`,
          url,
          category: 'Exterior',
          angleLabel: `Gallery Photo ${base.length + extras.length + 1}`,
          order: base.length + extras.length,
        });
      }
    });
    return [...base, ...extras];
  }, [gallery, images]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: mergedGallery.length };
    CATEGORIES.slice(1).forEach((cat) => {
      counts[cat] = mergedGallery.filter((p) => p.category === cat).length;
    });
    return counts;
  }, [mergedGallery]);

  const filteredPhotos = useMemo(() => {
    if (selectedCategory === 'All') return mergedGallery;
    return mergedGallery.filter((p) => p.category === selectedCategory);
  }, [mergedGallery, selectedCategory]);

  useEffect(() => {
    setActiveIndex(0);
    setZoomed(false);
  }, [selectedCategory, mergedGallery.length]);

  const safeIndex = filteredPhotos.length > 0 ? Math.min(activeIndex, filteredPhotos.length - 1) : 0;
  const currentPhoto = filteredPhotos[safeIndex] || filteredPhotos[0];

  const handlePrev = () => {
    if (filteredPhotos.length <= 1) return;
    setZoomed(false);
    setActiveIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  const handleNext = () => {
    if (filteredPhotos.length <= 1) return;
    setZoomed(false);
    setActiveIndex((prev) => (prev + 1) % filteredPhotos.length);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (filteredPhotos.length <= 1) return;
        setZoomed(false);
        setActiveIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
      } else if (e.key === 'ArrowRight') {
        if (filteredPhotos.length <= 1) return;
        setZoomed(false);
        setActiveIndex((prev) => (prev + 1) % filteredPhotos.length);
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
        setVideoOpen(false);
        setZoomed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filteredPhotos.length]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPanOrigin({ x, y });
  }

  return (
    <div className="space-y-4">
      {/* Main Full-Screen / Full-Width Viewport */}
      {filteredPhotos.length === 0 ? (
        <div className={fullScreenHero ? 'max-w-7xl mx-auto px-5 sm:px-8' : ''}>
          <div className="aspect-[16/10] rounded-2xl bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] flex flex-col items-center justify-center p-8 text-center space-y-2">
            <Camera className="w-9 h-9 text-slate-400 dark:text-zinc-600" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              No {selectedCategory} Photographs Uploaded Yet
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-md">
              We only publish verified photographs taken of this exact vehicle. Switch to All Photos or contact our gallery for live video inspection.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer"
            >
              View All Uploaded Photos ({mergedGallery.length})
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`relative overflow-hidden bg-slate-900 dark:bg-[#121215] select-none ${
            fullScreenHero
              ? 'w-full h-[32vh] sm:h-[62vh] lg:h-[calc(100vh-72px)] min-h-[220px] sm:min-h-[420px] max-h-[300px] sm:max-h-[860px] border-y border-slate-200 dark:border-white/[0.08]'
              : 'aspect-[16/10] rounded-2xl border border-slate-200 dark:border-white/[0.08]'
          }`}
          onMouseMove={handleMouseMove}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
            const delta = endX - touchStartX.current;
            if (Math.abs(delta) > 40) {
              if (delta > 0) handlePrev();
              else handleNext();
            }
            touchStartX.current = null;
          }}
        >
          <motion.div
            key={`${currentPhoto.id || currentPhoto.url}-${safeIndex}`}
            initial={{ opacity: 0.72 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.16 }}
            className="relative z-10 w-full h-full overflow-hidden flex items-center justify-center bg-black"
            onClick={() => setZoomed((z) => !z)}
          >
            {/* Ambient blurred backdrop so there are no empty gaps */}
            <VehicleImage
              src={currentPhoto.url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
            />

            {/* Main Full Car Image - 100% Uncropped & Centered */}
            <div
              className={`relative z-10 w-full h-full flex items-center justify-center p-2 sm:p-4 pb-12 sm:pb-16 transition-transform duration-200 ${
                zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              style={{
                transform: zoomed ? 'scale(1.8)' : 'scale(1)',
                transformOrigin: `${panOrigin.x}% ${panOrigin.y}%`,
              }}
            >
              <VehicleImage
                src={currentPhoto.url}
                alt={`${carTitle} - ${currentPhoto.angleLabel}`}
                loading="eager"
                className="max-w-full max-h-full w-auto h-auto object-contain object-center drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Bottom Scrim & Metadata (high contrast dark overlay over photos in both themes) */}
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none">
            <div
              className={`${
                fullScreenHero ? 'max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-6' : 'p-3.5 sm:p-5'
              } flex flex-wrap items-end justify-between gap-2.5 sm:gap-3`}
            >
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                  {currentPhoto.category}
                </p>
                <p className="text-sm sm:text-lg font-semibold text-white leading-tight">{currentPhoto.angleLabel}</p>
                {currentPhoto.caption && <p className="text-xs sm:text-sm text-zinc-200 mt-0.5 line-clamp-1">{currentPhoto.caption}</p>}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
                <span className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/[0.14] font-mono text-[11px] sm:text-xs text-white tabular-nums">
                  {String(safeIndex + 1).padStart(2, '0')} / {String(filteredPhotos.length).padStart(2, '0')}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomed((z) => !z);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/[0.14] text-[11px] sm:text-xs font-medium text-white hover:border-blue-400 cursor-pointer"
                  aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
                >
                  {zoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{zoomed ? 'Reset Zoom' : 'Zoom'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/[0.14] text-[11px] sm:text-xs font-medium text-white hover:border-blue-400 cursor-pointer"
                  aria-label="Open fullscreen gallery"
                >
                  <Expand className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </button>
              </div>
            </div>
          </div>

          {filteredPhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/75 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-lg"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/75 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-lg"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Category Filter Strip + Thumbnails */}
      <div className={fullScreenHero ? 'max-w-7xl mx-auto px-5 sm:px-8 space-y-4 pt-1' : 'space-y-3'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08]">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                    active
                      ? 'bg-blue-700 dark:bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {videoWalkthroughUrl && (
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] hover:border-blue-600 dark:hover:border-blue-500 text-xs font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer shadow-xs dark:shadow-none"
            >
              <PlayCircle className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>Video Walkthrough</span>
            </button>
          )}
        </div>

        {filteredPhotos.length > 0 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {filteredPhotos.map((photo, idx) => (
              <button
                key={`${photo.id || photo.url}-${idx}`}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  setZoomed(false);
                }}
                className={`relative shrink-0 w-24 sm:w-28 aspect-[4/3] rounded-lg overflow-hidden border transition-all cursor-pointer ${
                  idx === safeIndex
                    ? 'border-blue-700 dark:border-blue-500 ring-1 ring-blue-700 dark:ring-blue-500'
                    : 'border-slate-200 dark:border-white/[0.08] opacity-70 hover:opacity-100'
                }`}
              >
                <VehicleImage
                  src={photo.url}
                  alt={photo.angleLabel}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 px-1.5 py-0.5 bg-black/75 text-[10px] text-zinc-100 truncate text-left">
                  {photo.angleLabel}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {lightboxOpen && currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6"
            onClick={() => setLightboxOpen(false)}
          >
            <div className="flex items-center justify-between text-white" onClick={(e) => e.stopPropagation()}>
              <div>
                <p className="text-xs text-blue-400 font-medium uppercase">{currentPhoto.category}</p>
                <p className="text-sm sm:text-base font-semibold">
                  {carTitle} — {currentPhoto.angleLabel}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-400 tabular-nums">
                  {safeIndex + 1} / {filteredPhotos.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                  aria-label="Close lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <VehicleImage
                key={`lightbox-${currentPhoto.id || currentPhoto.url}-${safeIndex}`}
                src={currentPhoto.url}
                alt={currentPhoto.angleLabel}
                className="max-h-[78vh] w-auto max-w-full object-contain rounded-lg"
              />
              {filteredPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="absolute left-2 sm:left-4 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-blue-700 border border-white/25 flex items-center justify-center text-white cursor-pointer"
                    aria-label="Previous fullscreen image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="absolute right-2 sm:right-4 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-blue-700 border border-white/25 flex items-center justify-center text-white cursor-pointer"
                    aria-label="Next fullscreen image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            <div className="text-center text-xs text-zinc-400">
              Use Left / Right arrow keys to browse · Esc to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Walkthrough Modal */}
      <AnimatePresence>
        {videoOpen && videoWalkthroughUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setVideoOpen(false)}
          >
            <div
              className="w-full max-w-4xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-white/[0.08]">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {carTitle} — Video Walkthrough
                </span>
                <button
                  type="button"
                  onClick={() => setVideoOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video bg-black">
                {videoWalkthroughUrl.includes('youtube.com') || videoWalkthroughUrl.includes('youtu.be') || videoWalkthroughUrl.includes('vimeo.com') ? (
                  <iframe
                    src={videoWalkthroughUrl.replace('watch?v=', 'embed/')}
                    title={`${carTitle} walkthrough`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video src={videoWalkthroughUrl} controls className="w-full h-full" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

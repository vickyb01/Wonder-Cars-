import { useEffect, useState } from 'react';
import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import type { BusinessLocationSettings } from '../types/car';
import { useTheme } from '../context/ThemeContext';
import {
  SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL,
  buildDirectionsUrl,
  buildMapsEmbedUrl,
  buildOpenMapsUrl,
  formatFullAddress,
  parseCoordinates,
} from '../utils/location';

interface ShowroomGoogleMapProps {
  apiKey: string;
  location: BusinessLocationSettings;
  heightClass?: string;
  roundedClassName?: string;
  zoom?: number;
  title?: string;
}

function ShowroomIframeMap({
  coords,
  location,
  heightClass,
  roundedClassName,
  zoom,
  title,
}: {
  coords: { lat: number; lng: number };
  location: BusinessLocationSettings;
  heightClass: string;
  roundedClassName: string;
  zoom: number;
  title: string;
}) {
  const displayName = location.businessName || 'Wonder Cars';
  const fullAddress = formatFullAddress(location);
  const directionsUrl =
    buildDirectionsUrl(location) ||
    SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL;
  const openMapsUrl =
    buildOpenMapsUrl(location) ||
    `https://www.google.com/maps/place/Wonder+cars/@${coords.lat},${coords.lng},17z`;

  const embedUrl = buildMapsEmbedUrl(location, zoom || 17);

  return (
    <div
      className={`relative ${heightClass} w-full ${roundedClassName} overflow-hidden bg-slate-100 dark:bg-[#121215] border-y border-slate-200 dark:border-white/[0.08] shadow-sm group`}
      aria-label={title}
    >
      <iframe
        title={title || 'Wonder Cars Showroom Location'}
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full grayscale-[0.08] contrast-[1.05] dark:invert-[0.9] dark:hue-rotate-180 dark:contrast-[1.1]"
      />

      {/* Floating Info & Navigation Pill Overlay */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 max-w-[calc(100%-24px)] sm:max-w-md p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border border-slate-200/90 dark:border-white/[0.12] shadow-xl pointer-events-auto transition-transform">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
            {fullAddress && (
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {fullAddress}
              </p>
            )}
            <div className="flex items-center gap-2 pt-2">
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <Navigation className="w-3.5 h-3.5 fill-current" />
                  <span>Start Navigation</span>
                </a>
              )}
              {openMapsUrl && (
                <a
                  href={openMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-white/[0.08] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Maps</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractiveMapInner({
  coords,
  location,
  zoom,
  resolvedTheme,
}: {
  coords: { lat: number; lng: number };
  location: BusinessLocationSettings;
  zoom: number;
  resolvedTheme: 'light' | 'dark';
}) {
  const loadingStatus = useApiLoadingStatus();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(false);

  const fullAddress = formatFullAddress(location);
  const directionsUrl = buildDirectionsUrl(location);
  const displayName = location.businessName || 'Showroom Location';

  useEffect(() => {
    if (loadingStatus === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [loadingStatus]);

  if (loadingStatus === APILoadingStatus.FAILED || loadingStatus === APILoadingStatus.AUTH_FAILURE) {
    return (
      <ShowroomIframeMap
        coords={coords}
        location={location}
        heightClass="w-full h-full"
        roundedClassName=""
        zoom={zoom}
        title={displayName}
      />
    );
  }

  const colorSchemeProps = {
    colorScheme: resolvedTheme === 'dark' ? 'DARK' : 'LIGHT',
  } as Record<string, unknown>;

  return (
    <GoogleMap
      key={resolvedTheme}
      mapId="DEMO_MAP_ID"
      defaultCenter={coords}
      center={coords}
      defaultZoom={zoom}
      gestureHandling="greedy"
      zoomControl
      mapTypeControl={false}
      streetViewControl
      fullscreenControl
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      style={{ width: '100%', height: '100%' }}
      {...colorSchemeProps}
    >
      <AdvancedMarker
        ref={markerRef}
        position={coords}
        title={displayName}
        clickable
        onClick={() => setInfoOpen((prev) => !prev)}
      >
        <Pin background="#1D4ED8" borderColor="#1E3A8A" glyphColor="#FFFFFF" scale={1} />
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={270}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="p-1 text-slate-900 space-y-1.5">
            <p className="font-semibold text-sm text-slate-900 leading-snug">{displayName}</p>
            {fullAddress && <p className="text-xs text-slate-600 leading-relaxed">{fullAddress}</p>}
            {location.openingHours && (
              <p className="text-[11px] text-slate-500">{location.openingHours}</p>
            )}
            {directionsUrl && (
              <div className="pt-1">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Get Directions</span>
                </a>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export function ShowroomGoogleMap({
  apiKey,
  location,
  heightClass = 'h-[320px] sm:h-[400px]',
  roundedClassName = 'rounded-xl',
  zoom = 16,
  title = 'Showroom Map',
}: ShowroomGoogleMapProps) {
  const { resolvedTheme } = useTheme();
  const parsed = parseCoordinates(location);
  // Default to Wonder Cars exact showroom coordinates if not yet parsed
  const coords = parsed || { lat: 28.6396915, lng: 77.2936307 };
  const effectiveKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // If no Google Maps JavaScript API key is configured, seamlessly render the live interactive Google Map iframe
  if (!effectiveKey) {
    return (
      <ShowroomIframeMap
        coords={coords}
        location={location}
        heightClass={heightClass}
        roundedClassName={roundedClassName}
        zoom={zoom}
        title={title}
      />
    );
  }

  return (
    <div
      className={`${heightClass} w-full ${roundedClassName} overflow-hidden bg-slate-50 dark:bg-[#121215] border-y border-slate-200 dark:border-white/[0.08]`}
      aria-label={title}
    >
      <APIProvider apiKey={effectiveKey} libraries={['marker']} language="en">
        <InteractiveMapInner
          coords={coords}
          location={location}
          zoom={zoom}
          resolvedTheme={resolvedTheme}
        />
      </APIProvider>
    </div>
  );
}

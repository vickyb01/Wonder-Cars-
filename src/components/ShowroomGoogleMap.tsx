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
  buildDirectionsUrl,
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
  const openMapsUrl = buildOpenMapsUrl(location);
  const displayName = location.businessName || 'Showroom Location';

  useEffect(() => {
    if (loadingStatus === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [loadingStatus]);

  if (loadingStatus === APILoadingStatus.FAILED || loadingStatus === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#121215] p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-600/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-md">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
          {fullAddress && <p className="text-xs text-slate-600 dark:text-zinc-400">{fullAddress}</p>}
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            Interactive map tiles could not be loaded right now. Use direct navigation links below.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </a>
          )}
          {openMapsUrl && (
            <a
              href={openMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.12] hover:border-blue-600 dark:hover:border-blue-500 text-slate-800 dark:text-zinc-200 hover:text-blue-700 dark:hover:text-white text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </a>
          )}
        </div>
      </div>
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
  heightClass = 'h-[300px]',
  roundedClassName = 'rounded-xl',
  zoom = 13,
  title = 'Showroom Map',
}: ShowroomGoogleMapProps) {
  const { resolvedTheme } = useTheme();
  const coords = parseCoordinates(location);
  const fullAddress = formatFullAddress(location);
  const directionsUrl = buildDirectionsUrl(location);
  const openMapsUrl = buildOpenMapsUrl(location);
  const effectiveKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!coords) {
    return (
      <div
        className={`${heightClass} w-full ${roundedClassName} bg-slate-50 dark:bg-[#121215] border-y border-slate-200 dark:border-white/[0.08] flex flex-col items-center justify-center p-6 text-center space-y-3`}
        aria-label={title}
      >
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-600/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-md">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {location.businessName || 'Showroom Map Pin Pending'}
          </p>
          {fullAddress ? (
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{fullAddress}</p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed">
              Showroom address and map coordinates have not been configured yet. Add them in the Admin Dashboard under Location Settings.
            </p>
          )}
          {fullAddress && (
            <p className="text-[11px] text-slate-500 dark:text-zinc-500">
              Add Latitude &amp; Longitude in Admin Location Settings to display the interactive pin here.
            </p>
          )}
        </div>
        {(directionsUrl || openMapsUrl) && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>
            )}
            {openMapsUrl && (
              <a
                href={openMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.12] hover:border-blue-600 dark:hover:border-blue-500 text-slate-800 dark:text-zinc-200 hover:text-blue-700 dark:hover:text-white text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!effectiveKey) {
    return (
      <div
        className={`${heightClass} w-full ${roundedClassName} bg-slate-50 dark:bg-[#121215] border-y border-slate-200 dark:border-white/[0.08] flex flex-col items-center justify-center p-6 text-center space-y-3`}
        aria-label={title}
      >
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-600/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-md">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {location.businessName || 'Showroom Location'}
          </p>
          {fullAddress && <p className="text-xs text-slate-600 dark:text-zinc-400">{fullAddress}</p>}
          <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-500">
            Interactive map preview awaits API key activation. Direct navigation links remain active below.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </a>
          )}
          {openMapsUrl && (
            <a
              href={openMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.12] hover:border-blue-600 dark:hover:border-blue-500 text-slate-800 dark:text-zinc-200 hover:text-blue-700 dark:hover:text-white text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </a>
          )}
        </div>
      </div>
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

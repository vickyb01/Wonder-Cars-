import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Globe,
  Home,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type {
  AboutSettings,
  BusinessLocationSettings,
  HomepageSettings,
  WebsiteSettings,
} from '../../types/car';
import {
  fetchAboutSettings,
  fetchBusinessLocation,
  geocodeLocationServer,
  updateAboutSettings,
  updateBusinessLocation,
  updateHomepageSettings,
  updateWebsiteSettings,
} from '../../utils/api';
import { GA_MEASUREMENT_ID, resolveActiveGaId } from '../../utils/analytics';
import { buildDirectionsUrl, buildOpenMapsUrl, normalizeShowroomMapsEmbedUrl } from '../../utils/location';
import {
  OFFICIAL_SOCIAL_PROFILES,
  VERIFIED_SHOWROOM_DEFAULTS,
  buildEmbedUrlFromCoords,
  hasSocialTrackingParams,
  stripSocialTrackingParams,
  validateCoordinatesPair,
  validateEmailAddress,
  validateGa4IdInput,
  validateHttpUrl,
} from '../../utils/settingsHelpers.mjs';

export type SettingsSubTab =
  | 'website'
  | 'seo'
  | 'social'
  | 'showroom'
  | 'about'
  | 'homepage'
  | 'analytics';

interface WebsiteSeoSettingsPanelProps {
  websiteSettings: WebsiteSettings | null;
  onWebsiteSettingsUpdated: (next: WebsiteSettings) => void;
  locationSettings: BusinessLocationSettings;
  onLocationSettingsUpdated: (next: BusinessLocationSettings) => void;
  aboutSettings: AboutSettings | null;
  onAboutSettingsUpdated: (next: AboutSettings) => void;
  homepageSettings: HomepageSettings | null;
  onHomepageSettingsUpdated: (next: HomepageSettings) => void;
  onNavigateTab: (tab: 'homepage' | 'about' | 'reports') => void;
  onSaveFeedback: (feedback: { type: 'success' | 'error'; text: string } | null) => void;
}

const DEFAULT_FALLBACK_WEBSITE: WebsiteSettings = {
  websiteName: 'Used Car Nearby',
  tagline: 'Used Car Nearby — Certified Pre-Owned Cars by Wonder Cars',
  logoLight: '/assets/wonder-cars-logo.png',
  logoDark: '/assets/wonder-cars-logo-dark.png',
  faviconUrl: '/favicon.png',
  primaryPhone: '+91 83840 68347',
  whatsappNumber: '918384068347',
  supportEmail: 'amanjain.nj784@gmail.com',
  showroomAddress: VERIFIED_SHOWROOM_DEFAULTS.address,
  openingHours: 'Monday – Sunday: 10:00 AM – 8:00 PM',
  googleMapsUrl: VERIFIED_SHOWROOM_DEFAULTS.googleMapsUrl,
  googleMapsPlaceId: VERIFIED_SHOWROOM_DEFAULTS.googleMapsPlaceId,
  googleMapsEmbedUrl: VERIFIED_SHOWROOM_DEFAULTS.googleMapsEmbedUrl,
  googleMapsDirectionsUrl: VERIFIED_SHOWROOM_DEFAULTS.googleMapsDirectionsUrl,
  instagramUrl: OFFICIAL_SOCIAL_PROFILES.instagram,
  facebookUrl: OFFICIAL_SOCIAL_PROFILES.facebook,
  youtubeUrl: OFFICIAL_SOCIAL_PROFILES.youtube,
  seoTitle: 'Used Car Nearby — Certified Pre-Owned Cars in Preet Vihar, Delhi | Wonder Cars',
  seoDescription:
    'Browse certified pre-owned luxury and performance cars at Used Car Nearby (UsedCarNearby.com), powered by Wonder Cars in Preet Vihar, Delhi.',
  seoKeywords:
    'Used Car Nearby, UsedCarNearby, usedcarnearby.com, used cars Preet Vihar Delhi, Wonder Cars Preet Vihar',
  googleAnalyticsId: '',
  whatsappFloatingEnabled: true,
  footerAboutText:
    'Online pre-owned car showcase by Wonder Cars, Preet Vihar, Delhi — 210-point inspected luxury and performance vehicles.',
  copyrightText: '© 2026 Used Car Nearby · Showroom by Wonder Cars. All rights reserved.',
};

const cardCls = 'bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5';
const inputCls =
  'w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors';
const textareaCls =
  'w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors leading-relaxed';
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] font-medium text-red-600">{message}</p>;
}

export function WebsiteSeoSettingsPanel({
  websiteSettings,
  onWebsiteSettingsUpdated,
  locationSettings,
  onLocationSettingsUpdated,
  aboutSettings,
  onAboutSettingsUpdated,
  homepageSettings,
  onHomepageSettingsUpdated,
  onNavigateTab,
  onSaveFeedback,
}: WebsiteSeoSettingsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('website');

  const [webDraft, setWebDraft] = useState<WebsiteSettings>(() => websiteSettings || DEFAULT_FALLBACK_WEBSITE);
  const [locDraft, setLocDraft] = useState<BusinessLocationSettings>(locationSettings);
  const [aboutDraft, setAboutDraft] = useState<AboutSettings | null>(aboutSettings);
  const [homeDraft, setHomeDraft] = useState<HomepageSettings | null>(homepageSettings);

  const [syncSocialToLocation, setSyncSocialToLocation] = useState(true);
  const [savingSection, setSavingSection] = useState<SettingsSubTab | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmResetTab, setConfirmResetTab] = useState<SettingsSubTab | null>(null);

  // Sync saved snapshots when props hydrate or after save, preserving local drafts unless clean
  useEffect(() => {
    if (websiteSettings) {
      setWebDraft(websiteSettings);
    }
  }, [websiteSettings]);

  useEffect(() => {
    setLocDraft(locationSettings);
  }, [locationSettings]);

  useEffect(() => {
    if (aboutSettings) {
      setAboutDraft(aboutSettings);
    }
  }, [aboutSettings]);

  useEffect(() => {
    if (homepageSettings) {
      setHomeDraft(homepageSettings);
    }
  }, [homepageSettings]);

  const dirtyMap = useMemo(() => {
    const savedWeb = websiteSettings || DEFAULT_FALLBACK_WEBSITE;
    const isWebsiteDirty =
      webDraft.websiteName !== savedWeb.websiteName ||
      webDraft.tagline !== savedWeb.tagline ||
      webDraft.logoLight !== savedWeb.logoLight ||
      webDraft.logoDark !== savedWeb.logoDark ||
      webDraft.faviconUrl !== savedWeb.faviconUrl ||
      webDraft.primaryPhone !== savedWeb.primaryPhone ||
      webDraft.whatsappNumber !== savedWeb.whatsappNumber ||
      webDraft.supportEmail !== savedWeb.supportEmail ||
      webDraft.whatsappFloatingEnabled !== savedWeb.whatsappFloatingEnabled ||
      webDraft.footerAboutText !== savedWeb.footerAboutText ||
      webDraft.copyrightText !== savedWeb.copyrightText;

    const isSeoDirty =
      webDraft.seoTitle !== savedWeb.seoTitle ||
      webDraft.seoDescription !== savedWeb.seoDescription ||
      webDraft.seoKeywords !== savedWeb.seoKeywords;

    const isSocialDirty =
      webDraft.instagramUrl !== savedWeb.instagramUrl ||
      webDraft.facebookUrl !== savedWeb.facebookUrl ||
      webDraft.youtubeUrl !== savedWeb.youtubeUrl;

    const isShowroomDirty =
      locDraft.businessName !== locationSettings.businessName ||
      locDraft.address !== locationSettings.address ||
      locDraft.city !== locationSettings.city ||
      locDraft.state !== locationSettings.state ||
      locDraft.postalCode !== locationSettings.postalCode ||
      locDraft.openingHours !== locationSettings.openingHours ||
      locDraft.nearbyLandmarks !== locationSettings.nearbyLandmarks ||
      locDraft.latitude !== locationSettings.latitude ||
      locDraft.longitude !== locationSettings.longitude ||
      (locDraft.googleMapsPlaceId || '') !== (locationSettings.googleMapsPlaceId || '') ||
      locDraft.googleMapsUrl !== locationSettings.googleMapsUrl ||
      (locDraft.googleMapsEmbedUrl || '') !== (locationSettings.googleMapsEmbedUrl || '') ||
      (locDraft.googleMapsDirectionsUrl || '') !== (locationSettings.googleMapsDirectionsUrl || '');

    const isAboutDirty = Boolean(
      aboutDraft &&
        aboutSettings &&
        ((aboutDraft.showroomName || '') !== (aboutSettings.showroomName || '') ||
          (aboutDraft.showroomAddress || '') !== (aboutSettings.showroomAddress || '') ||
          (aboutDraft.showroomOpeningHours || '') !== (aboutSettings.showroomOpeningHours || '') ||
          (aboutDraft.showroomPhone || '') !== (aboutSettings.showroomPhone || '') ||
          (aboutDraft.showroomEmail || '') !== (aboutSettings.showroomEmail || '') ||
          (aboutDraft.googleMapsEmbedUrl || '') !== (aboutSettings.googleMapsEmbedUrl || '') ||
          (aboutDraft.googleMapsDirectionsUrl || '') !== (aboutSettings.googleMapsDirectionsUrl || '') ||
          (aboutDraft.instagramUrl || '') !== (aboutSettings.instagramUrl || '') ||
          (aboutDraft.facebookUrl || '') !== (aboutSettings.facebookUrl || '') ||
          (aboutDraft.youtubeUrl || '') !== (aboutSettings.youtubeUrl || '') ||
          aboutDraft.heroBadge !== aboutSettings.heroBadge ||
          aboutDraft.headline !== aboutSettings.headline ||
          aboutDraft.subheadline !== aboutSettings.subheadline)
    );

    const isHomepageDirty = Boolean(
      homeDraft &&
        homepageSettings &&
        (homeDraft.heroHeading !== homepageSettings.heroHeading ||
          homeDraft.heroBadge !== homepageSettings.heroBadge ||
          homeDraft.heroSubheadline !== homepageSettings.heroSubheadline ||
          homeDraft.heroTagline !== homepageSettings.heroTagline ||
          homeDraft.ctaExploreText !== homepageSettings.ctaExploreText ||
          (homeDraft.ctaExploreLink || '') !== (homepageSettings.ctaExploreLink || '') ||
          homeDraft.promotionalBannerActive !== homepageSettings.promotionalBannerActive ||
          homeDraft.promotionalBannerText !== homepageSettings.promotionalBannerText)
    );

    const isAnalyticsDirty = (webDraft.googleAnalyticsId || '') !== (savedWeb.googleAnalyticsId || '');

    return {
      website: isWebsiteDirty,
      seo: isSeoDirty,
      social: isSocialDirty,
      showroom: isShowroomDirty,
      about: isAboutDirty,
      homepage: isHomepageDirty,
      analytics: isAnalyticsDirty,
    };
  }, [webDraft, websiteSettings, locDraft, locationSettings, aboutDraft, aboutSettings, homeDraft, homepageSettings]);

  function notify(type: 'success' | 'error', text: string) {
    setStatusNotice({ type, text });
    onSaveFeedback({ type, text });
  }

  function handleConfirmDiscard(tab: SettingsSubTab) {
    setFieldErrors({});
    setStatusNotice(null);
    if (tab === 'website' || tab === 'seo' || tab === 'social' || tab === 'analytics') {
      const saved = websiteSettings || DEFAULT_FALLBACK_WEBSITE;
      setWebDraft((prev) => {
        if (tab === 'website') {
          return {
            ...prev,
            websiteName: saved.websiteName,
            tagline: saved.tagline,
            logoLight: saved.logoLight,
            logoDark: saved.logoDark,
            faviconUrl: saved.faviconUrl,
            primaryPhone: saved.primaryPhone,
            whatsappNumber: saved.whatsappNumber,
            supportEmail: saved.supportEmail,
            whatsappFloatingEnabled: saved.whatsappFloatingEnabled,
            footerAboutText: saved.footerAboutText,
            copyrightText: saved.copyrightText,
          };
        }
        if (tab === 'seo') {
          return {
            ...prev,
            seoTitle: saved.seoTitle,
            seoDescription: saved.seoDescription,
            seoKeywords: saved.seoKeywords,
          };
        }
        if (tab === 'social') {
          return {
            ...prev,
            instagramUrl: saved.instagramUrl,
            facebookUrl: saved.facebookUrl,
            youtubeUrl: saved.youtubeUrl,
          };
        }
        return {
          ...prev,
          googleAnalyticsId: saved.googleAnalyticsId,
        };
      });
    } else if (tab === 'showroom') {
      setLocDraft(locationSettings);
    } else if (tab === 'about' && aboutSettings) {
      setAboutDraft(aboutSettings);
    } else if (tab === 'homepage' && homepageSettings) {
      setHomeDraft(homepageSettings);
    }
    setConfirmResetTab(null);
  }

  async function saveGeneralWebsite(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!webDraft.websiteName.trim()) errs.websiteName = 'Website Name is required.';
    const emailErr = validateEmailAddress(webDraft.supportEmail, 'Support Email');
    if (emailErr) errs.supportEmail = emailErr;
    const logoLightErr = validateHttpUrl(webDraft.logoLight, 'Light Logo URL', { allowRelative: true });
    if (logoLightErr) errs.logoLight = logoLightErr;
    const logoDarkErr = validateHttpUrl(webDraft.logoDark, 'Dark Logo URL', { allowRelative: true });
    if (logoDarkErr) errs.logoDark = logoDarkErr;
    const faviconErr = validateHttpUrl(webDraft.faviconUrl, 'Favicon URL', { allowRelative: true });
    if (faviconErr) errs.faviconUrl = faviconErr;

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      notify('error', Object.values(errs)[0]);
      return;
    }

    setFieldErrors({});
    setSavingSection('website');
    try {
      const updated = await updateWebsiteSettings({
        websiteName: webDraft.websiteName.trim(),
        tagline: webDraft.tagline.trim(),
        logoLight: webDraft.logoLight.trim(),
        logoDark: webDraft.logoDark.trim(),
        faviconUrl: webDraft.faviconUrl.trim(),
        primaryPhone: webDraft.primaryPhone.trim(),
        whatsappNumber: webDraft.whatsappNumber.trim(),
        supportEmail: webDraft.supportEmail.trim(),
        whatsappFloatingEnabled: webDraft.whatsappFloatingEnabled,
        footerAboutText: webDraft.footerAboutText.trim(),
        copyrightText: webDraft.copyrightText.trim(),
      });
      onWebsiteSettingsUpdated(updated);
      notify('success', 'General website settings saved.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Failed to save general website settings.');
    } finally {
      setSavingSection(null);
    }
  }

  async function saveSeoSettings(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!webDraft.seoTitle.trim()) errs.seoTitle = 'SEO Title is required.';
    if (!webDraft.seoDescription.trim()) errs.seoDescription = 'SEO Description is required.';
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      notify('error', Object.values(errs)[0]);
      return;
    }

    setFieldErrors({});
    setSavingSection('seo');
    try {
      const updated = await updateWebsiteSettings({
        seoTitle: webDraft.seoTitle.trim(),
        seoDescription: webDraft.seoDescription.trim(),
        seoKeywords: webDraft.seoKeywords.trim(),
      });
      onWebsiteSettingsUpdated(updated);
      notify('success', 'SEO title, description, and keywords saved.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Failed to save SEO settings.');
    } finally {
      setSavingSection(null);
    }
  }

  async function saveSocialSettings(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const igErr = validateHttpUrl(webDraft.instagramUrl, 'Instagram URL');
    if (igErr) errs.instagramUrl = igErr;
    const fbErr = validateHttpUrl(webDraft.facebookUrl, 'Facebook URL');
    if (fbErr) errs.facebookUrl = fbErr;
    const ytErr = validateHttpUrl(webDraft.youtubeUrl, 'YouTube URL');
    if (ytErr) errs.youtubeUrl = ytErr;

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      notify('error', Object.values(errs)[0]);
      return;
    }

    const cleanIg = webDraft.instagramUrl.trim() ? stripSocialTrackingParams(webDraft.instagramUrl) : '';
    const cleanFb = webDraft.facebookUrl.trim() ? stripSocialTrackingParams(webDraft.facebookUrl) : '';
    const cleanYt = webDraft.youtubeUrl.trim() ? stripSocialTrackingParams(webDraft.youtubeUrl) : '';

    setFieldErrors({});
    setSavingSection('social');
    try {
      const updatedWeb = await updateWebsiteSettings({
        instagramUrl: cleanIg,
        facebookUrl: cleanFb,
        youtubeUrl: cleanYt,
      });
      onWebsiteSettingsUpdated(updatedWeb);

      if (syncSocialToLocation) {
        const updatedLoc = await updateBusinessLocation({
          instagramUrl: cleanIg,
          facebookUrl: cleanFb,
          youtubeUrl: cleanYt,
        });
        onLocationSettingsUpdated(updatedLoc);
      }
      notify('success', 'Social media URLs validated, cleaned of tracking parameters, and saved.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Failed to save social media settings.');
    } finally {
      setSavingSection(null);
    }
  }

  async function handleGeocodeShowroom() {
    if (!locDraft.address.trim()) {
      setFieldErrors({ address: 'Enter a showroom street address before geocoding.' });
      return;
    }
    setGeocoding(true);
    try {
      const query = `${locDraft.address}, ${locDraft.city || ''} ${locDraft.postalCode || ''}`;
      const res = await geocodeLocationServer(query);
      setLocDraft((prev) => ({
        ...prev,
        latitude: res.latitude,
        longitude: res.longitude,
      }));
      notify('success', `Resolved showroom coordinates: ${res.latitude}, ${res.longitude}`);
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Geocoding failed. Enter coordinates manually.');
    } finally {
      setGeocoding(false);
    }
  }

  async function saveShowroomSettings(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {
      ...validateCoordinatesPair(locDraft.latitude, locDraft.longitude),
    };
    if (!locDraft.businessName.trim()) errs.businessName = 'Showroom Business Name is required.';
    const mapsUrlErr = validateHttpUrl(locDraft.googleMapsUrl, 'Google Maps URL');
    if (mapsUrlErr) errs.googleMapsUrl = mapsUrlErr;
    const embedErr = validateHttpUrl(locDraft.googleMapsEmbedUrl, 'Google Maps Embed URL');
    if (embedErr) errs.googleMapsEmbedUrl = embedErr;
    const dirErr = validateHttpUrl(locDraft.googleMapsDirectionsUrl, 'Google Maps Directions URL');
    if (dirErr) errs.googleMapsDirectionsUrl = dirErr;

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      notify('error', Object.values(errs)[0]);
      return;
    }

    setFieldErrors({});
    setSavingSection('showroom');
    try {
      const updatedLoc = await updateBusinessLocation({
        businessName: locDraft.businessName.trim(),
        address: locDraft.address.trim(),
        city: locDraft.city.trim(),
        state: locDraft.state.trim(),
        postalCode: locDraft.postalCode.trim(),
        openingHours: locDraft.openingHours.trim(),
        nearbyLandmarks: locDraft.nearbyLandmarks.trim(),
        latitude: locDraft.latitude.trim(),
        longitude: locDraft.longitude.trim(),
        googleMapsPlaceId: (locDraft.googleMapsPlaceId || '').trim(),
        googleMapsUrl: locDraft.googleMapsUrl.trim(),
        googleMapsEmbedUrl: (locDraft.googleMapsEmbedUrl || '').trim(),
        googleMapsDirectionsUrl: (locDraft.googleMapsDirectionsUrl || '').trim(),
      });
      onLocationSettingsUpdated(updatedLoc);
      fetchAboutSettings()
        .then((syncedAbout) => {
          if (syncedAbout) onAboutSettingsUpdated(syncedAbout);
        })
        .catch(() => {});
      notify('success', 'Showroom location and Google Maps settings saved across Contact, Footer, and About Us.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Failed to save showroom & Maps settings.');
    } finally {
      setSavingSection(null);
    }
  }

  async function saveAboutSection(e: React.FormEvent) {
    e.preventDefault();
    if (!aboutDraft) return;
    const errs: Record<string, string> = {};
    const emailErr = validateEmailAddress(aboutDraft.showroomEmail, 'Showroom Email');
    if (emailErr) errs.showroomEmail = emailErr;
    const embedErr = validateHttpUrl(aboutDraft.googleMapsEmbedUrl, 'About Google Maps Embed URL');
    if (embedErr) errs.aboutGoogleMapsEmbedUrl = embedErr;
    const dirErr = validateHttpUrl(aboutDraft.googleMapsDirectionsUrl, 'About Google Maps Directions URL');
    if (dirErr) errs.aboutGoogleMapsDirectionsUrl = dirErr;
    const igErr = validateHttpUrl(aboutDraft.instagramUrl, 'About Instagram URL');
    if (igErr) errs.aboutInstagramUrl = igErr;
    const fbErr = validateHttpUrl(aboutDraft.facebookUrl, 'About Facebook URL');
    if (fbErr) errs.aboutFacebookUrl = fbErr;
    const ytErr = validateHttpUrl(aboutDraft.youtubeUrl, 'About YouTube URL');
    if (ytErr) errs.aboutYoutubeUrl = ytErr;

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      notify('error', Object.values(errs)[0]);
      return;
    }

    setFieldErrors({});
    setSavingSection('about');
    try {
      const updated = await updateAboutSettings({
        heroBadge: aboutDraft.heroBadge,
        headline: aboutDraft.headline,
        subheadline: aboutDraft.subheadline,
        showroomName: aboutDraft.showroomName,
        showroomAddress: aboutDraft.showroomAddress,
        showroomOpeningHours: aboutDraft.showroomOpeningHours,
        showroomPhone: aboutDraft.showroomPhone,
        showroomEmail: aboutDraft.showroomEmail,
        googleMapsEmbedUrl: aboutDraft.googleMapsEmbedUrl,
        googleMapsDirectionsUrl: aboutDraft.googleMapsDirectionsUrl,
        instagramUrl: aboutDraft.instagramUrl?.trim() ? stripSocialTrackingParams(aboutDraft.instagramUrl) : '',
        facebookUrl: aboutDraft.facebookUrl?.trim() ? stripSocialTrackingParams(aboutDraft.facebookUrl) : '',
        youtubeUrl: aboutDraft.youtubeUrl?.trim() ? stripSocialTrackingParams(aboutDraft.youtubeUrl) : '',
      });
      onAboutSettingsUpdated(updated);
      fetchBusinessLocation()
        .then((locRes) => {
          if (locRes?.location) onLocationSettingsUpdated(locRes.location);
        })
        .catch(() => {});
      notify('success', 'About Us & Showcase settings saved and showroom Maps synced without overwriting gallery/owner sections.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Failed to save About Us settings.');
    } finally {
      setSavingSection(null);
    }
  }

  async function saveHomepageSection(e: React.FormEvent) {
    e.preventDefault();
    if (!homeDraft) return;
    const errs: Record<string, string> = {};
    if (!homeDraft.heroHeading.trim()) errs.heroHeading = 'Hero Heading is required.';
    const ctaErr = validateHttpUrl(homeDraft.ctaExploreLink, 'CTA Explore Link', { allowRelative: true });
    if (ctaErr) errs.ctaExploreLink = ctaErr;

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      notify('error', Object.values(errs)[0]);
      return;
    }

    setFieldErrors({});
    setSavingSection('homepage');
    try {
      const updated = await updateHomepageSettings({
        heroHeading: homeDraft.heroHeading.trim(),
        heroBadge: homeDraft.heroBadge,
        heroSubheadline: homeDraft.heroSubheadline,
        heroTagline: homeDraft.heroTagline,
        ctaExploreText: homeDraft.ctaExploreText,
        ctaExploreLink: homeDraft.ctaExploreLink,
        promotionalBannerActive: homeDraft.promotionalBannerActive,
        promotionalBannerText: homeDraft.promotionalBannerText,
      });
      onHomepageSettingsUpdated(updated);
      notify('success', 'Homepage brand & hero settings saved.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Failed to save Homepage settings.');
    } finally {
      setSavingSection(null);
    }
  }

  async function saveAnalyticsSettings(e: React.FormEvent) {
    e.preventDefault();
    const gaErr = validateGa4IdInput(webDraft.googleAnalyticsId);
    if (gaErr) {
      setFieldErrors({ googleAnalyticsId: gaErr });
      notify('error', gaErr);
      return;
    }

    setFieldErrors({});
    setSavingSection('analytics');
    try {
      const updated = await updateWebsiteSettings({
        googleAnalyticsId: webDraft.googleAnalyticsId.trim().toUpperCase(),
      });
      onWebsiteSettingsUpdated(updated);
      notify('success', 'Analytics configuration saved.');
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Failed to save Analytics settings.');
    } finally {
      setSavingSection(null);
    }
  }

  const navTabs: Array<{ id: SettingsSubTab; label: string; icon: typeof Globe; dirty: boolean }> = [
    { id: 'website', label: 'General Website', icon: Globe, dirty: dirtyMap.website },
    { id: 'seo', label: 'SEO Settings', icon: Search, dirty: dirtyMap.seo },
    { id: 'social', label: 'Social Media', icon: Share2, dirty: dirtyMap.social },
    { id: 'showroom', label: 'Showroom & Maps', icon: MapPin, dirty: dirtyMap.showroom },
    { id: 'about', label: 'About & Showcase', icon: UserCheck, dirty: dirtyMap.about },
    { id: 'homepage', label: 'Homepage Settings', icon: Home, dirty: dirtyMap.homepage },
    { id: 'analytics', label: 'Analytics Config', icon: BarChart3, dirty: dirtyMap.analytics },
  ];

  const previewMapSrc = locDraft.googleMapsEmbedUrl?.trim()
    ? normalizeShowroomMapsEmbedUrl(locDraft.googleMapsEmbedUrl)
    : buildEmbedUrlFromCoords(locDraft.latitude, locDraft.longitude, locDraft.businessName || 'Wonder Cars');

  const activeBuildGaId = GA_MEASUREMENT_ID.trim();
  const effectiveGaId = resolveActiveGaId(webDraft.googleAnalyticsId);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Website & SEO Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Used Car Nearby branding, SEO metadata, official social profiles, Wonder Cars showroom maps, and GA4 settings.
          </p>
        </div>
        {Object.values(dirtyMap).some(Boolean) && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold self-start sm:self-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Unsaved changes</span>
          </span>
        )}
      </div>

      {statusNotice && (
        <div
          role="status"
          className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs font-medium ${
            statusNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {statusNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{statusNotice.text}</span>
        </div>
      )}

      {/* Responsive 7-Section Sub-Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSubTab(tab.id);
                  setFieldErrors({});
                }}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0B1528] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.dirty && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                    title="Unsaved changes in this section"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: General Website Settings */}
      {activeSubTab === 'website' && (
        <form onSubmit={saveGeneralWebsite} className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>General Website Settings</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Keep primary website brand as <strong>Used Car Nearby</strong> and physical showroom reference as <strong>Wonder Cars</strong>.
              </p>
            </div>
            {dirtyMap.website && (
              <button
                type="button"
                onClick={() => setConfirmResetTab('website')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Draft</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Website Name *</label>
              <input
                type="text"
                value={webDraft.websiteName}
                onChange={(e) => setWebDraft({ ...webDraft, websiteName: e.target.value })}
                placeholder="Used Car Nearby"
                className={inputCls}
              />
              <FieldError message={fieldErrors.websiteName} />
            </div>
            <div>
              <label className={labelCls}>Brand Tagline</label>
              <input
                type="text"
                value={webDraft.tagline}
                onChange={(e) => setWebDraft({ ...webDraft, tagline: e.target.value })}
                placeholder="Certified Pre-Owned Cars by Wonder Cars"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Primary Phone</label>
              <input
                type="text"
                value={webDraft.primaryPhone}
                onChange={(e) => setWebDraft({ ...webDraft, primaryPhone: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>WhatsApp Number (with country code)</label>
              <input
                type="text"
                value={webDraft.whatsappNumber}
                onChange={(e) => setWebDraft({ ...webDraft, whatsappNumber: e.target.value })}
                placeholder="918384068347"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Support Email</label>
              <input
                type="email"
                value={webDraft.supportEmail}
                onChange={(e) => setWebDraft({ ...webDraft, supportEmail: e.target.value })}
                className={inputCls}
              />
              <FieldError message={fieldErrors.supportEmail} />
            </div>
            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webDraft.whatsappFloatingEnabled}
                  onChange={(e) =>
                    setWebDraft({ ...webDraft, whatsappFloatingEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Enable Floating WhatsApp Concierge Button</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Light Logo Path / URL</label>
              <input
                type="text"
                value={webDraft.logoLight}
                onChange={(e) => setWebDraft({ ...webDraft, logoLight: e.target.value })}
                className={inputCls}
              />
              <FieldError message={fieldErrors.logoLight} />
            </div>
            <div>
              <label className={labelCls}>Dark Logo Path / URL</label>
              <input
                type="text"
                value={webDraft.logoDark}
                onChange={(e) => setWebDraft({ ...webDraft, logoDark: e.target.value })}
                className={inputCls}
              />
              <FieldError message={fieldErrors.logoDark} />
            </div>
            <div>
              <label className={labelCls}>Favicon Path / URL</label>
              <input
                type="text"
                value={webDraft.faviconUrl}
                onChange={(e) => setWebDraft({ ...webDraft, faviconUrl: e.target.value })}
                className={inputCls}
              />
              <FieldError message={fieldErrors.faviconUrl} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Footer About Text</label>
            <textarea
              rows={3}
              value={webDraft.footerAboutText}
              onChange={(e) => setWebDraft({ ...webDraft, footerAboutText: e.target.value })}
              className={textareaCls}
            />
          </div>

          <div>
            <label className={labelCls}>Copyright Text</label>
            <input
              type="text"
              value={webDraft.copyrightText}
              onChange={(e) => setWebDraft({ ...webDraft, copyrightText: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSection === 'website'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
            >
              {savingSection === 'website' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savingSection === 'website' ? 'Saving...' : 'Save Website Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Section 2: SEO Settings */}
      {activeSubTab === 'seo' && (
        <form onSubmit={saveSeoSettings} className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>Brand & Search Engine Optimization (SEO)</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Primary Website Brand: <strong>Used Car Nearby</strong> · Showroom Entity: <strong>Wonder Cars</strong>
              </p>
            </div>
            {dirtyMap.seo && (
              <button
                type="button"
                onClick={() => setConfirmResetTab('seo')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Draft</span>
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Active Schema.org & Canonical Guardrails</span>
            </p>
            <p>
              Public pages output a unified Schema.org graph with <code>Organization</code> (&quot;Used Car Nearby&quot;),{' '}
              <code>WebSite</code> (&quot;Used Car Nearby&quot;), and <code>AutoDealer</code> (&quot;Wonder Cars&quot;, Preet Vihar, Delhi) anchored to{' '}
              <code>https://www.usedcarnearby.com</code>.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Default SEO Title *</label>
              <span className="text-[11px] text-slate-400 tabular-nums">{webDraft.seoTitle.length} chars</span>
            </div>
            <input
              type="text"
              value={webDraft.seoTitle}
              onChange={(e) => setWebDraft({ ...webDraft, seoTitle: e.target.value })}
              className={inputCls}
            />
            <FieldError message={fieldErrors.seoTitle} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Default SEO Meta Description *</label>
              <span className="text-[11px] text-slate-400 tabular-nums">{webDraft.seoDescription.length} chars</span>
            </div>
            <textarea
              rows={3}
              value={webDraft.seoDescription}
              onChange={(e) => setWebDraft({ ...webDraft, seoDescription: e.target.value })}
              className={textareaCls}
            />
            <FieldError message={fieldErrors.seoDescription} />
          </div>

          <div>
            <label className={labelCls}>SEO Keywords (comma-separated)</label>
            <textarea
              rows={2}
              value={webDraft.seoKeywords}
              onChange={(e) => setWebDraft({ ...webDraft, seoKeywords: e.target.value })}
              className={textareaCls}
            />
          </div>

          {/* Live Google SERP Preview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SERP Preview</p>
            <p className="text-[11px] text-emerald-700">https://www.usedcarnearby.com</p>
            <p className="text-sm font-semibold text-blue-700 line-clamp-1">
              {webDraft.seoTitle || 'Used Car Nearby — Certified Pre-Owned Cars in Preet Vihar, Delhi'}
            </p>
            <p className="text-xs text-slate-600 line-clamp-2">
              {webDraft.seoDescription ||
                'Explore certified pre-owned luxury cars on Used Car Nearby by Wonder Cars in Preet Vihar, Delhi.'}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSection === 'seo'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
            >
              {savingSection === 'seo' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savingSection === 'seo' ? 'Saving...' : 'Save SEO Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Section 3: Social Media Settings */}
      {activeSubTab === 'social' && (
        <form onSubmit={saveSocialSettings} className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>Official Social Media Profiles</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tracking query parameters (such as <code>?si=</code>, <code>?fqnt=</code>, <code>?mibextid=</code>, <code>utm_*</code>) are automatically stripped on save.
              </p>
            </div>
            {dirtyMap.social && (
              <button
                type="button"
                onClick={() => setConfirmResetTab('social')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Draft</span>
              </button>
            )}
          </div>

          {[
            {
              key: 'instagramUrl' as const,
              label: 'Instagram Profile URL',
              confirmed: OFFICIAL_SOCIAL_PROFILES.instagram,
            },
            {
              key: 'facebookUrl' as const,
              label: 'Facebook Profile / Page URL',
              confirmed: OFFICIAL_SOCIAL_PROFILES.facebook,
            },
            {
              key: 'youtubeUrl' as const,
              label: 'YouTube Channel URL',
              confirmed: OFFICIAL_SOCIAL_PROFILES.youtube,
            },
          ].map((item) => {
            const val = webDraft[item.key] || '';
            const hasTracking = hasSocialTrackingParams(val);
            const cleanedPreview = val.trim() ? (() => {
              try {
                return stripSocialTrackingParams(val);
              } catch {
                return '';
              }
            })() : '';
            const isValidUrl = !validateHttpUrl(val, item.label, { allowEmpty: false });

            return (
              <div key={item.key} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-800">{item.label}</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWebDraft({ ...webDraft, [item.key]: item.confirmed })}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Use Confirmed Official URL
                    </button>
                    {isValidUrl && (
                      <a
                        href={val}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-blue-600"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <input
                  type="url"
                  value={val}
                  onChange={(e) => setWebDraft({ ...webDraft, [item.key]: e.target.value })}
                  placeholder={item.confirmed}
                  className={inputCls}
                />
                <FieldError message={fieldErrors[item.key]} />
                {hasTracking && cleanedPreview && (
                  <p className="text-[11px] text-amber-700">
                    Tracking parameters detected. Will save cleanly as: <span className="font-mono">{cleanedPreview}</span>
                  </p>
                )}
              </div>
            );
          })}

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={syncSocialToLocation}
              onChange={(e) => setSyncSocialToLocation(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600"
            />
            <span>Also sync these clean URLs to Showroom Location settings (used by public Footer & Contact section)</span>
          </label>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSection === 'social'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
            >
              {savingSection === 'social' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savingSection === 'social' ? 'Saving...' : 'Save Social Links'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Section 4: Showroom & Google Maps */}
      {activeSubTab === 'showroom' && (
        <form onSubmit={saveShowroomSettings} className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Showroom & Google Maps Settings</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure physical showroom details for Wonder Cars in Preet Vihar, Delhi without overwriting phone/email/social settings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setLocDraft((prev) => ({
                    ...prev,
                    businessName: prev.businessName || VERIFIED_SHOWROOM_DEFAULTS.businessName,
                    address: VERIFIED_SHOWROOM_DEFAULTS.address,
                    city: VERIFIED_SHOWROOM_DEFAULTS.city,
                    state: VERIFIED_SHOWROOM_DEFAULTS.state,
                    postalCode: VERIFIED_SHOWROOM_DEFAULTS.postalCode,
                    latitude: VERIFIED_SHOWROOM_DEFAULTS.latitude,
                    longitude: VERIFIED_SHOWROOM_DEFAULTS.longitude,
                    googleMapsPlaceId: VERIFIED_SHOWROOM_DEFAULTS.googleMapsPlaceId,
                    googleMapsUrl: VERIFIED_SHOWROOM_DEFAULTS.googleMapsUrl,
                    googleMapsEmbedUrl: VERIFIED_SHOWROOM_DEFAULTS.googleMapsEmbedUrl,
                    googleMapsDirectionsUrl: VERIFIED_SHOWROOM_DEFAULTS.googleMapsDirectionsUrl,
                  }))
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Verified Wonder Cars Maps</span>
              </button>
              {dirtyMap.showroom && (
                <button
                  type="button"
                  onClick={() => setConfirmResetTab('showroom')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Draft</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Showroom Business Name *</label>
              <input
                type="text"
                value={locDraft.businessName}
                onChange={(e) => setLocDraft({ ...locDraft, businessName: e.target.value })}
                placeholder="Wonder Cars"
                className={inputCls}
              />
              <FieldError message={fieldErrors.businessName} />
            </div>
            <div>
              <label className={labelCls}>Google Maps Place ID</label>
              <input
                type="text"
                value={locDraft.googleMapsPlaceId || ''}
                onChange={(e) => setLocDraft({ ...locDraft, googleMapsPlaceId: e.target.value })}
                placeholder={VERIFIED_SHOWROOM_DEFAULTS.googleMapsPlaceId}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Full Showroom Address</label>
            <input
              type="text"
              value={locDraft.address}
              onChange={(e) => setLocDraft({ ...locDraft, address: e.target.value })}
              placeholder={VERIFIED_SHOWROOM_DEFAULTS.address}
              className={inputCls}
            />
            <FieldError message={fieldErrors.address} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>City</label>
              <input
                type="text"
                value={locDraft.city}
                onChange={(e) => setLocDraft({ ...locDraft, city: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input
                type="text"
                value={locDraft.state}
                onChange={(e) => setLocDraft({ ...locDraft, state: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>PIN / Postal Code</label>
              <input
                type="text"
                value={locDraft.postalCode}
                onChange={(e) => setLocDraft({ ...locDraft, postalCode: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Opening Hours</label>
              <input
                type="text"
                value={locDraft.openingHours}
                onChange={(e) => setLocDraft({ ...locDraft, openingHours: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Nearby Landmarks</label>
              <input
                type="text"
                value={locDraft.nearbyLandmarks}
                onChange={(e) => setLocDraft({ ...locDraft, nearbyLandmarks: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className={labelCls}>Latitude</label>
              <input
                type="text"
                value={locDraft.latitude}
                onChange={(e) => setLocDraft({ ...locDraft, latitude: e.target.value })}
                placeholder="28.6396915"
                className={inputCls}
              />
              <FieldError message={fieldErrors.latitude} />
            </div>
            <div>
              <label className={labelCls}>Longitude</label>
              <input
                type="text"
                value={locDraft.longitude}
                onChange={(e) => setLocDraft({ ...locDraft, longitude: e.target.value })}
                placeholder="77.2936307"
                className={inputCls}
              />
              <FieldError message={fieldErrors.longitude} />
            </div>
            <button
              type="button"
              onClick={handleGeocodeShowroom}
              disabled={geocoding}
              className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {geocoding ? 'Geocoding...' : 'Lookup Coordinates'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelCls}>Google Maps Place URL</label>
              <input
                type="url"
                value={locDraft.googleMapsUrl}
                onChange={(e) => setLocDraft({ ...locDraft, googleMapsUrl: e.target.value })}
                className={inputCls}
              />
              <FieldError message={fieldErrors.googleMapsUrl} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Google Maps Embed URL (iframe src)</label>
                <button
                  type="button"
                  onClick={() =>
                    setLocDraft((prev) => ({
                      ...prev,
                      googleMapsEmbedUrl: buildEmbedUrlFromCoords(
                        prev.latitude,
                        prev.longitude,
                        prev.businessName || 'Wonder Cars'
                      ),
                    }))
                  }
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Generate from Coordinates
                </button>
              </div>
              <input
                type="url"
                value={locDraft.googleMapsEmbedUrl || ''}
                onChange={(e) => setLocDraft({ ...locDraft, googleMapsEmbedUrl: e.target.value })}
                placeholder={VERIFIED_SHOWROOM_DEFAULTS.googleMapsEmbedUrl}
                className={inputCls}
              />
              <FieldError message={fieldErrors.googleMapsEmbedUrl} />
            </div>
            <div>
              <label className={labelCls}>Google Maps Directions URL</label>
              <input
                type="url"
                value={locDraft.googleMapsDirectionsUrl || ''}
                onChange={(e) => setLocDraft({ ...locDraft, googleMapsDirectionsUrl: e.target.value })}
                placeholder={VERIFIED_SHOWROOM_DEFAULTS.googleMapsDirectionsUrl}
                className={inputCls}
              />
              <FieldError message={fieldErrors.googleMapsDirectionsUrl} />
            </div>
          </div>

          {/* Live Map Preview */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <div className="px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>Live Google Maps Embed Preview</span>
              <a
                href={
                  locDraft.googleMapsDirectionsUrl ||
                  buildDirectionsUrl(locDraft) ||
                  buildOpenMapsUrl(locDraft) ||
                  VERIFIED_SHOWROOM_DEFAULTS.googleMapsDirectionsUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <span>Test Directions Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <iframe
              title="Admin Showroom Map Preview"
              src={previewMapSrc}
              className="w-full h-56 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSection === 'showroom'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
            >
              {savingSection === 'showroom' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savingSection === 'showroom' ? 'Saving...' : 'Save Showroom & Maps'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Section 5: About Us & Showcase */}
      {activeSubTab === 'about' && (
        <form onSubmit={saveAboutSection} className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>About Us & Showcase Quick Settings</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sync showroom address, Google Maps embed/directions, and social links on <code>/api/about</code> without overwriting Owner Bio, Gallery, or Certificates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('about')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
              >
                <span>Open Full About Us Manager</span>
              </button>
              {dirtyMap.about && (
                <button
                  type="button"
                  onClick={() => setConfirmResetTab('about')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Draft</span>
                </button>
              )}
            </div>
          </div>

          {!aboutDraft ? (
            <p className="text-xs text-slate-500">Loading About Us settings...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Hero Badge</label>
                  <input
                    type="text"
                    value={aboutDraft.heroBadge}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, heroBadge: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Showroom Display Name</label>
                  <input
                    type="text"
                    value={aboutDraft.showroomName || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, showroomName: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>About Page Headline</label>
                <input
                  type="text"
                  value={aboutDraft.headline}
                  onChange={(e) => setAboutDraft({ ...aboutDraft, headline: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>About Page Subheadline</label>
                <textarea
                  rows={2}
                  value={aboutDraft.subheadline}
                  onChange={(e) => setAboutDraft({ ...aboutDraft, subheadline: e.target.value })}
                  className={textareaCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Showroom Address (/api/about)</label>
                  <input
                    type="text"
                    value={aboutDraft.showroomAddress || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, showroomAddress: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Showroom Opening Hours</label>
                  <input
                    type="text"
                    value={aboutDraft.showroomOpeningHours || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, showroomOpeningHours: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Showroom Phone</label>
                  <input
                    type="text"
                    value={aboutDraft.showroomPhone || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, showroomPhone: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Showroom Email</label>
                  <input
                    type="email"
                    value={aboutDraft.showroomEmail || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, showroomEmail: e.target.value })}
                    className={inputCls}
                  />
                  <FieldError message={fieldErrors.showroomEmail} />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Google Maps Embed URL</label>
                  <input
                    type="url"
                    value={aboutDraft.googleMapsEmbedUrl || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, googleMapsEmbedUrl: e.target.value })}
                    className={inputCls}
                  />
                  <FieldError message={fieldErrors.aboutGoogleMapsEmbedUrl} />
                </div>
                <div>
                  <label className={labelCls}>Google Maps Directions URL</label>
                  <input
                    type="url"
                    value={aboutDraft.googleMapsDirectionsUrl || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, googleMapsDirectionsUrl: e.target.value })}
                    className={inputCls}
                  />
                  <FieldError message={fieldErrors.aboutGoogleMapsDirectionsUrl} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>About Instagram URL</label>
                  <input
                    type="url"
                    value={aboutDraft.instagramUrl || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, instagramUrl: e.target.value })}
                    className={inputCls}
                  />
                  <FieldError message={fieldErrors.aboutInstagramUrl} />
                </div>
                <div>
                  <label className={labelCls}>About Facebook URL</label>
                  <input
                    type="url"
                    value={aboutDraft.facebookUrl || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, facebookUrl: e.target.value })}
                    className={inputCls}
                  />
                  <FieldError message={fieldErrors.aboutFacebookUrl} />
                </div>
                <div>
                  <label className={labelCls}>About YouTube URL</label>
                  <input
                    type="url"
                    value={aboutDraft.youtubeUrl || ''}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, youtubeUrl: e.target.value })}
                    className={inputCls}
                  />
                  <FieldError message={fieldErrors.aboutYoutubeUrl} />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSection === 'about'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {savingSection === 'about' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingSection === 'about' ? 'Saving...' : 'Save About & Showcase'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Section 6: Homepage Settings */}
      {activeSubTab === 'homepage' && (
        <form onSubmit={saveHomepageSection} className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                <span>Homepage Brand & Hero Settings</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ensure the public hero H1 displays <strong>Used Car Nearby</strong> consistently and manage hero CTAs without losing slide images or featured cars.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('homepage')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
              >
                <span>Open Full Homepage Manager</span>
              </button>
              {dirtyMap.homepage && (
                <button
                  type="button"
                  onClick={() => setConfirmResetTab('homepage')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Draft</span>
                </button>
              )}
            </div>
          </div>

          {!homeDraft ? (
            <p className="text-xs text-slate-500">Loading Homepage settings...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Hero Heading (H1) *</label>
                  <input
                    type="text"
                    value={homeDraft.heroHeading}
                    onChange={(e) => setHomeDraft({ ...homeDraft, heroHeading: e.target.value })}
                    placeholder="Used Car Nearby"
                    className={inputCls}
                  />
                  <FieldError message={fieldErrors.heroHeading} />
                </div>
                <div>
                  <label className={labelCls}>Hero Badge</label>
                  <input
                    type="text"
                    value={homeDraft.heroBadge}
                    onChange={(e) => setHomeDraft({ ...homeDraft, heroBadge: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Hero Subheadline</label>
                <input
                  type="text"
                  value={homeDraft.heroSubheadline}
                  onChange={(e) => setHomeDraft({ ...homeDraft, heroSubheadline: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Hero Description / Tagline</label>
                <textarea
                  rows={3}
                  value={homeDraft.heroTagline}
                  onChange={(e) => setHomeDraft({ ...homeDraft, heroTagline: e.target.value })}
                  className={textareaCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Primary CTA Text</label>
                  <input
                    type="text"
                    value={homeDraft.ctaExploreText}
                    onChange={(e) => setHomeDraft({ ...homeDraft, ctaExploreText: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Primary CTA Link</label>
                  <input
                    type="text"
                    value={homeDraft.ctaExploreLink || ''}
                    onChange={(e) => setHomeDraft({ ...homeDraft, ctaExploreLink: e.target.value })}
                    placeholder="/cars"
                    className={inputCls}
                  />
                  <FieldError message={fieldErrors.ctaExploreLink} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homeDraft.promotionalBannerActive}
                    onChange={(e) =>
                      setHomeDraft({ ...homeDraft, promotionalBannerActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Show Top Promotional Banner</span>
                </label>
                <input
                  type="text"
                  value={homeDraft.promotionalBannerText}
                  onChange={(e) => setHomeDraft({ ...homeDraft, promotionalBannerText: e.target.value })}
                  placeholder="Promotional banner message..."
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSection === 'homepage'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {savingSection === 'homepage' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingSection === 'homepage' ? 'Saving...' : 'Save Homepage Settings'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Section 7: Analytics Configuration */}
      {activeSubTab === 'analytics' && (
        <form onSubmit={saveAnalyticsSettings} className={cardCls}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-[#0B1528] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Google Analytics 4 (GA4) Configuration</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Compare build-time Vite environment configuration with runtime Website Settings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
              >
                <span>View Reports & Analytics</span>
              </button>
              {dirtyMap.analytics && (
                <button
                  type="button"
                  onClick={() => setConfirmResetTab('analytics')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Draft</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Build-Time Env (VITE_GA_MEASUREMENT_ID)
              </p>
              <p className="text-xs font-mono font-semibold text-slate-900">
                {activeBuildGaId || 'Not configured at build time'}
              </p>
              <p className="text-[11px] text-slate-500">
                Set in hosting build environment (e.g. Vercel). Always takes precedence when valid.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Effective Client Tracking ID
              </p>
              <p className="text-xs font-mono font-semibold text-slate-900">
                {effectiveGaId || 'Disabled (no valid GA4 ID active)'}
              </p>
              <p className="text-[11px] text-slate-500">
                Placeholder values such as <code>G-WONDERCARS2026</code> are automatically rejected.
              </p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Runtime GA4 Measurement ID (Website Settings Fallback)</label>
            <input
              type="text"
              value={webDraft.googleAnalyticsId}
              onChange={(e) => setWebDraft({ ...webDraft, googleAnalyticsId: e.target.value })}
              placeholder="G-XXXXXXXXXX (leave blank if using VITE_GA_MEASUREMENT_ID)"
              className={inputCls}
            />
            <FieldError message={fieldErrors.googleAnalyticsId} />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Security Boundary</p>
            <p>
              GA4 Data API reporting credentials (<code>GA_PRIVATE_KEY</code>, <code>GA_CLIENT_EMAIL</code>,{' '}
              <code>GA4_PROPERTY_ID</code>) remain strictly server-side environment variables and are never exposed in the browser or public settings API.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSection === 'analytics'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-60"
            >
              {savingSection === 'analytics' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savingSection === 'analytics' ? 'Saving...' : 'Save Analytics Config'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Modal Before Discarding Unsaved Draft Changes */}
      {confirmResetTab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-[#0B1528]">Discard Unsaved Changes?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will revert your unsaved edits in this section back to the last saved configuration.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetTab(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDiscard(confirmResetTab)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

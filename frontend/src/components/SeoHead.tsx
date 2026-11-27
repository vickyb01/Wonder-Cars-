import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildAutoDealerJsonLd,
  buildCanonicalUrl,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  CANONICAL_ORIGIN,
  formatSeoTitle,
  HOMEPAGE_SEO_DESCRIPTION,
  resolveSeoImageUrl,
  SITE_BRAND_NAME,
} from '../utils/seo';

const SITEWIDE_SCHEMA_IDS = new Set([
  'organization-schema',
  'website-schema',
  'autodealer-schema',
]);

interface SeoHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  robots?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  noCanonical?: boolean;
  jsonLd?: Record<string, unknown> | null;
  jsonLdId?: string;
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
  const selector = `meta[${attrName}="${attrValue}"]`;
  const existing = document.head.querySelectorAll<HTMLMetaElement>(selector);
  existing.forEach((el, idx) => {
    if (idx > 0) el.remove();
  });
  let tag = existing[0];
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function removeMetaTag(attrName: 'name' | 'property', attrValue: string): void {
  const selector = `meta[${attrName}="${attrValue}"]`;
  document.head.querySelectorAll<HTMLMetaElement>(selector).forEach((el) => el.remove());
}

function syncCanonicalTag(href: string | null): void {
  const existing = document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    existing.forEach((el) => el.remove());
    return;
  }
  existing.forEach((el, idx) => {
    if (idx > 0) el.remove();
  });
  let link = existing[0];
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function removeJsonLdScript(id: string): void {
  document.head.querySelectorAll<HTMLScriptElement>(`script[type="application/ld+json"]`).forEach((el) => {
    if (el.id === id) {
      el.remove();
    }
  });
}

function syncJsonLdScript(id: string, jsonLd?: Record<string, unknown> | null): void {
  const allScripts = document.head.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]');
  let targetScript: HTMLScriptElement | null = null;

  allScripts.forEach((el) => {
    if (el.id === id) {
      if (!targetScript) {
        targetScript = el;
      } else {
        el.remove();
      }
      return;
    }

    // Remove any duplicate Car/Organization/AutoDealer JSON-LD scripts injected elsewhere
    if (!SITEWIDE_SCHEMA_IDS.has(el.id)) {
      try {
        const parsed = JSON.parse(el.textContent || '{}') as { '@type'?: string };
        const schemaType = parsed?.['@type'];
        if (schemaType === 'Car' || schemaType === 'Organization' || schemaType === 'AutoDealer') {
          el.remove();
        }
      } catch {
        // Ignore unparseable third-party JSON-LD
      }
    }
  });

  if (!jsonLd) {
    if (targetScript) {
      (targetScript as HTMLScriptElement).remove();
    }
    return;
  }

  if (!targetScript) {
    targetScript = document.createElement('script');
    targetScript.type = 'application/ld+json';
    targetScript.id = id;
    document.head.appendChild(targetScript);
  }
  targetScript.textContent = JSON.stringify(jsonLd);
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  robots = 'index, follow',
  ogType = 'website',
  ogImage,
  noCanonical = false,
  jsonLd,
  jsonLdId = 'car-schema',
}: SeoHeadProps) {
  const { pathname } = useLocation();
  const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const formattedTitle = formatSeoTitle(title);
    document.title = formattedTitle;

    const effectiveDescription = description?.trim() || HOMEPAGE_SEO_DESCRIPTION;
    const canonicalUrl = noCanonical ? null : buildCanonicalUrl(canonicalPath || pathname);
    const resolvedImage = resolveSeoImageUrl(ogImage);

    upsertMetaTag('name', 'description', effectiveDescription);
    upsertMetaTag('name', 'robots', robots);
    syncCanonicalTag(canonicalUrl);

    upsertMetaTag('property', 'og:site_name', SITE_BRAND_NAME);
    upsertMetaTag('property', 'og:title', formattedTitle);
    upsertMetaTag('property', 'og:description', effectiveDescription);
    upsertMetaTag('property', 'og:type', ogType);
    upsertMetaTag('property', 'og:image', resolvedImage);
    if (canonicalUrl) {
      upsertMetaTag('property', 'og:url', canonicalUrl);
    } else {
      removeMetaTag('property', 'og:url');
    }

    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', formattedTitle);
    upsertMetaTag('name', 'twitter:description', effectiveDescription);
    upsertMetaTag('name', 'twitter:image', resolvedImage);

    const isIndexable = !/\bnoindex\b/i.test(robots);
    if (isIndexable) {
      syncJsonLdScript('organization-schema', buildOrganizationJsonLd(CANONICAL_ORIGIN));
      syncJsonLdScript('website-schema', buildWebSiteJsonLd(CANONICAL_ORIGIN));
      syncJsonLdScript('autodealer-schema', buildAutoDealerJsonLd(CANONICAL_ORIGIN));
      syncJsonLdScript(
        jsonLdId,
        serializedJsonLd ? (JSON.parse(serializedJsonLd) as Record<string, unknown>) : null
      );
    } else {
      removeJsonLdScript('organization-schema');
      removeJsonLdScript('website-schema');
      removeJsonLdScript('autodealer-schema');
      removeJsonLdScript(jsonLdId);
    }
  }, [title, description, canonicalPath, pathname, robots, ogType, ogImage, noCanonical, jsonLdId, serializedJsonLd]);

  useEffect(() => {
    return () => {
      if (serializedJsonLd) {
        removeJsonLdScript(jsonLdId);
      }
    };
  }, [jsonLdId, serializedJsonLd]);

  return null;
}

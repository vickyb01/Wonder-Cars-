import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildCanonicalUrl,
  formatSeoTitle,
  resolveSeoImageUrl,
} from '../utils/seo';

interface SeoHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  robots?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  noCanonical?: boolean;
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

export function SeoHead({
  title,
  description,
  canonicalPath,
  robots = 'index, follow',
  ogType = 'website',
  ogImage,
  noCanonical = false,
}: SeoHeadProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const formattedTitle = formatSeoTitle(title);
    document.title = formattedTitle;

    const effectiveDescription =
      description?.trim() ||
      'Discover quality pre-owned luxury and performance cars at the right price. Certified 210-point inspected vehicles at Wonder Cars, Preet Vihar, Delhi.';
    const canonicalUrl = noCanonical ? null : buildCanonicalUrl(canonicalPath || pathname);
    const resolvedImage = resolveSeoImageUrl(ogImage);

    upsertMetaTag('name', 'description', effectiveDescription);
    upsertMetaTag('name', 'robots', robots);
    syncCanonicalTag(canonicalUrl);

    upsertMetaTag('property', 'og:site_name', 'Wonder Cars');
    upsertMetaTag('property', 'og:title', formattedTitle);
    upsertMetaTag('property', 'og:description', effectiveDescription);
    upsertMetaTag('property', 'og:type', ogType);
    upsertMetaTag('property', 'og:image', resolvedImage);
    if (canonicalUrl) {
      upsertMetaTag('property', 'og:url', canonicalUrl);
    }

    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', formattedTitle);
    upsertMetaTag('name', 'twitter:description', effectiveDescription);
    upsertMetaTag('name', 'twitter:image', resolvedImage);
  }, [title, description, canonicalPath, pathname, robots, ogType, ogImage, noCanonical]);

  return null;
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  OFFICIAL_SOCIAL_PROFILES,
  VERIFIED_SHOWROOM_DEFAULTS,
  buildEmbedUrlFromCoords,
  hasSocialTrackingParams,
  isValidGa4MeasurementId,
  resolveMapsDirectionsUrl,
  resolveMapsEmbedUrl,
  stripSocialTrackingParams,
  validateCoordinatesPair,
  validateEmailAddress,
  validateGa4IdInput,
  validateHttpUrl,
} from '../src/utils/settingsHelpers.mjs';
import {
  SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL,
  SHOWROOM_GOOGLE_MAPS_EMBED_URL,
  buildAutoDealerJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '../src/utils/carSeoShared.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '..');

describe('Settings Management Helpers & Validation', () => {
  it('detects and strips tracking query parameters from social media URLs', () => {
    const dirtyIg = 'https://www.instagram.com/usedcarsnearby/?fqnt=MWdxdjZndW4zNHkwNQ%3D%3D';
    const dirtyFb = 'https://www.facebook.com/amanjain.nj784/?mibextid=wwXIfr&rdid=PxDsB5WikY8FmiYB&share_url=foo#';
    const dirtyYt = 'https://www.youtube.com/c/usedcarsnearby?si=rLhUh-H6HIdMfBQ5';

    assert.equal(hasSocialTrackingParams(dirtyIg), true);
    assert.equal(hasSocialTrackingParams(dirtyFb), true);
    assert.equal(hasSocialTrackingParams(dirtyYt), true);

    assert.equal(stripSocialTrackingParams(dirtyIg), OFFICIAL_SOCIAL_PROFILES.instagram);
    assert.equal(stripSocialTrackingParams(dirtyFb), OFFICIAL_SOCIAL_PROFILES.facebook);
    assert.equal(stripSocialTrackingParams(dirtyYt), OFFICIAL_SOCIAL_PROFILES.youtube);
    assert.equal(hasSocialTrackingParams(OFFICIAL_SOCIAL_PROFILES.instagram), false);
  });

  it('rejects placeholder GA4 ID G-WONDERCARS2026 and validates GA4 format', () => {
    assert.equal(isValidGa4MeasurementId('G-WONDERCARS2026'), false);
    assert.equal(isValidGa4MeasurementId('G-9XYZ123456'), true);
    assert.match(validateGa4IdInput('G-WONDERCARS2026') || '', /placeholder/i);
    assert.match(validateGa4IdInput('UA-99999-1') || '', /G-/);
    assert.equal(validateGa4IdInput(''), null);
    assert.equal(validateGa4IdInput('G-9XYZ123456'), null);
  });

  it('validates coordinates pairs, URLs, emails, and Google Maps defaults', () => {
    assert.deepEqual(
      validateCoordinatesPair(VERIFIED_SHOWROOM_DEFAULTS.latitude, VERIFIED_SHOWROOM_DEFAULTS.longitude),
      {}
    );
    assert.ok(validateCoordinatesPair('28.6396915', '').longitude);
    assert.ok(validateCoordinatesPair('120', '77.29').latitude);
    assert.ok(validateHttpUrl('javascript:alert(1)', 'Maps URL'));
    assert.equal(validateHttpUrl('/assets/wonder-cars-logo.png', 'Logo', { allowRelative: true }), null);
    assert.ok(validateEmailAddress('invalid-email', 'Email'));
    assert.equal(validateEmailAddress('amanjain.nj784@gmail.com', 'Email'), null);

    const generatedEmbed = buildEmbedUrlFromCoords('28.6396915', '77.2936307', 'Wonder Cars');
    assert.ok(generatedEmbed.includes('28.6396915,77.2936307'));
    assert.ok(generatedEmbed.includes('output=embed'));
  });
});

describe('Admin Navigation, Public Consumption, and Phase 1/2 Schema Preservation', () => {
  it('registers Website & SEO Settings in AdminPage sidebar while keeping existing sections intact', () => {
    const adminSource = fs.readFileSync(path.join(FRONTEND_ROOT, 'src/pages/AdminPage.tsx'), 'utf-8');
    const requiredLabels = [
      'Website & SEO Settings',
      'Dashboard',
      'Cars Management',
      'Contact Messages',
      'Homepage Management',
      'About Us Management',
      'Media Library',
      'Reports & Analytics',
    ];
    for (const label of requiredLabels) {
      assert.ok(adminSource.includes(label), `Expected AdminPage.tsx to keep sidebar label "${label}"`);
    }
    assert.ok(adminSource.includes('<WebsiteSeoSettingsPanel'), 'AdminPage should render WebsiteSeoSettingsPanel');
  });

  it('connects Footer and FloatingWhatsAppButton to saved WebsiteSettings without adding /admin links', () => {
    const footerSource = fs.readFileSync(path.join(FRONTEND_ROOT, 'src/components/Footer.tsx'), 'utf-8');
    assert.ok(footerSource.includes('fetchWebsiteSettings'));
    assert.ok(footerSource.includes('copyrightText'));
    assert.equal(footerSource.includes('to="/admin"'), false);

    const whatsappSource = fs.readFileSync(
      path.join(FRONTEND_ROOT, 'src/components/FloatingWhatsAppButton.tsx'),
      'utf-8'
    );
    assert.ok(whatsappSource.includes('whatsappFloatingEnabled'));
  });

  it('preserves Used Car Nearby Organization/WebSite and Wonder Cars AutoDealer schemas', () => {
    const org = buildOrganizationJsonLd();
    const website = buildWebSiteJsonLd();
    const dealer = buildAutoDealerJsonLd();

    assert.equal(org.name, 'Used Car Nearby');
    assert.equal(website.publisher['@id'], org['@id']);
    assert.equal(dealer.name, 'Wonder Cars');
    assert.equal(dealer.parentOrganization['@id'], org['@id']);
    assert.deepEqual(org.sameAs, [
      OFFICIAL_SOCIAL_PROFILES.instagram,
      OFFICIAL_SOCIAL_PROFILES.facebook,
      OFFICIAL_SOCIAL_PROFILES.youtube,
    ]);
  });

  it('keeps showroom Maps URLs & address consistent across About, Contact, and Footer', () => {
    const aboutSource = fs.readFileSync(path.join(FRONTEND_ROOT, 'src/pages/AboutPage.tsx'), 'utf-8');
    const contactSource = fs.readFileSync(path.join(FRONTEND_ROOT, 'src/components/ContactSection.tsx'), 'utf-8');
    const footerSource = fs.readFileSync(path.join(FRONTEND_ROOT, 'src/components/Footer.tsx'), 'utf-8');
    const mapSource = fs.readFileSync(path.join(FRONTEND_ROOT, 'src/components/ShowroomGoogleMap.tsx'), 'utf-8');
    const locationSource = fs.readFileSync(path.join(FRONTEND_ROOT, 'src/utils/location.ts'), 'utf-8');

    assert.ok(aboutSource.includes('fetchBusinessLocation'), 'AboutPage must read authoritative location settings');
    assert.ok(aboutSource.includes('buildDirectionsUrl(') && aboutSource.includes('buildMapsEmbedUrl('));
    assert.ok(contactSource.includes('normalizeShowroomAddress(displayAddress)'));
    assert.ok(footerSource.includes('fetchBusinessLocation') && footerSource.includes('displayAddress'));
    assert.ok(mapSource.includes('buildDirectionsUrl(location)') && mapSource.includes('buildMapsEmbedUrl(location'));
    assert.ok(locationSource.includes('resolveMapsDirectionsUrl(location)'));
  });

  it('prioritizes saved custom googleMapsDirectionsUrl in InteractiveMapInner / buildDirectionsUrl', () => {
    const customDirections = 'https://www.google.com/maps/dir//Wonder+Cars+Showroom/@28.645,77.299,17z';
    const resolved = resolveMapsDirectionsUrl({
      businessName: 'Wonder Cars',
      latitude: '28.6396915',
      longitude: '77.2936307',
      googleMapsPlaceId: '0x390cfbb6c71185b3:0x518ca5e40932dc6d',
      googleMapsDirectionsUrl: customDirections,
    });
    assert.equal(resolved, customDirections);

    const customEmbed = 'https://maps.google.com/maps?q=loc:28.645,77.299+(Wonder+Cars)&output=embed';
    assert.equal(
      resolveMapsEmbedUrl({
        latitude: '28.6396915',
        longitude: '77.2936307',
        googleMapsEmbedUrl: customEmbed,
      }),
      customEmbed
    );
  });

  it('falls back to generated coordinate/address directions & embed URLs when custom URL is absent or legacy placeholder', () => {
    // Missing custom directions URL -> falls back to generated coordinate + Place ID URL
    assert.equal(
      resolveMapsDirectionsUrl({
        businessName: 'Wonder cars',
        latitude: '28.6396915',
        longitude: '77.2936307',
        googleMapsPlaceId: '0x390cfbb6c71185b3:0x518ca5e40932dc6d',
        googleMapsDirectionsUrl: '',
      }),
      SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL
    );

    // Legacy ?q= URL -> treated as fallback trigger
    assert.equal(
      resolveMapsDirectionsUrl({
        businessName: 'Wonder cars',
        latitude: '28.6396915',
        longitude: '77.2936307',
        googleMapsDirectionsUrl: 'https://maps.google.com/?q=Wonder+Cars+Preet+Vihar',
      }),
      SHOWROOM_GOOGLE_MAPS_DIRECTIONS_URL
    );

    // Address-only fallback when coordinates and custom URL are both missing
    assert.equal(
      resolveMapsDirectionsUrl({
        address: 'Preet Vihar, Delhi',
        googleMapsDirectionsUrl: '',
      }),
      'https://www.google.com/maps/dir/?api=1&destination=Preet%20Vihar%2C%20Delhi'
    );

    // Empty location returns null for directions and default verified embed URL for iframe
    assert.equal(resolveMapsDirectionsUrl({}), null);
    assert.equal(
      resolveMapsEmbedUrl({
        googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=0x390cfb5c00000001:0x89abcdef12345678',
      }),
      SHOWROOM_GOOGLE_MAPS_EMBED_URL
    );
  });
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import express from 'express';

// Point persistence at an isolated temporary directory so backend/data/db.json is untouched
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucn-settings-test-'));
process.env.DATA_DIR = tempDir;
process.env.DB_PATH = path.join(tempDir, 'db.json');

const { default: apiRoutes } = await import('../src/routes/index.ts');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = await import('../src/config/index.ts');

const basicAuthHeader = `Basic ${Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString('base64')}`;

let server;
let baseUrl = '';

async function requestJson(urlPath, options = {}) {
  const res = await fetch(`${baseUrl}${urlPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

describe('Settings Management Backend API', () => {
  before(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', apiRoutes);
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('requires admin authorization for all settings PUT endpoints', async () => {
    const endpoints = [
      '/api/admin/settings',
      '/api/admin/location',
      '/api/admin/about',
      '/api/admin/homepage',
    ];

    for (const endpoint of endpoints) {
      const res = await requestJson(endpoint, {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 401, `${endpoint} should reject unauthenticated PUT requests`);
    }
  });

  it('rejects placeholder and invalid GA4 measurement IDs on PUT /api/admin/settings', async () => {
    const placeholderRes = await requestJson('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({ googleAnalyticsId: 'G-WONDERCARS2026' }),
    });
    assert.equal(placeholderRes.status, 400);
    assert.match(placeholderRes.data.error, /placeholder/i);

    const invalidRes = await requestJson('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({ googleAnalyticsId: 'UA-12345' }),
    });
    assert.equal(invalidRes.status, 400);

    const validRes = await requestJson('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({ googleAnalyticsId: 'g-ab12cd34ef' }),
    });
    assert.equal(validRes.status, 200);
    assert.equal(validRes.data.googleAnalyticsId, 'G-AB12CD34EF');
  });

  it('validates and strips tracking parameters from social URLs across settings endpoints', async () => {
    const invalidSocial = await requestJson('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({ instagramUrl: 'not-a-valid-url' }),
    });
    assert.equal(invalidSocial.status, 400);

    const dirtyUrls = {
      instagramUrl: 'https://www.instagram.com/usedcarsnearby/?fqnt=MWdxdjZndW4zNHkwNQ%3D%3D&utm_source=ig_web',
      facebookUrl: 'https://www.facebook.com/amanjain.nj784/?mibextid=wwXIfr&rdid=PxDsB5WikY8FmiYB#',
      youtubeUrl: 'https://www.youtube.com/c/usedcarsnearby?si=rLhUh-H6HIdMfBQ5',
    };

    const webRes = await requestJson('/api/admin/settings', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify(dirtyUrls),
    });
    assert.equal(webRes.status, 200);
    assert.equal(webRes.data.instagramUrl, 'https://www.instagram.com/usedcarsnearby/');
    assert.equal(webRes.data.facebookUrl, 'https://www.facebook.com/amanjain.nj784/');
    assert.equal(webRes.data.youtubeUrl, 'https://www.youtube.com/c/usedcarsnearby');

    const aboutRes = await requestJson('/api/admin/about', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify(dirtyUrls),
    });
    assert.equal(aboutRes.status, 200);
    assert.equal(aboutRes.data.instagramUrl, 'https://www.instagram.com/usedcarsnearby/');
    assert.equal(aboutRes.data.facebookUrl, 'https://www.facebook.com/amanjain.nj784/');
    assert.equal(aboutRes.data.youtubeUrl, 'https://www.youtube.com/c/usedcarsnearby');
  });

  it('merges partial updates cleanly without overwriting unrelated fields or exposing secrets', async () => {
    const initialLoc = (await requestJson('/api/location')).data.location;
    const initialPhone = initialLoc.phone;

    const badCoords = await requestJson('/api/admin/location', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({ latitude: '95.5', longitude: '77.29' }),
    });
    assert.equal(badCoords.status, 400);

    const partialLoc = await requestJson('/api/admin/location', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({
        businessName: 'Wonder Cars',
        address: 'Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi, India - 110092',
        latitude: '28.6396915',
        longitude: '77.2936307',
        googleMapsPlaceId: '0x390cfbb6c71185b3:0x518ca5e40932dc6d',
      }),
    });
    assert.equal(partialLoc.status, 200);
    assert.equal(partialLoc.data.phone, initialPhone, 'Partial location update must preserve existing phone');
    assert.equal(partialLoc.data.googleMapsPlaceId, '0x390cfbb6c71185b3:0x518ca5e40932dc6d');

    const initialHome = (await requestJson('/api/homepage')).data;
    const partialHome = await requestJson('/api/admin/homepage', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({ heroHeading: 'Used Car Nearby' }),
    });
    assert.equal(partialHome.status, 200);
    assert.equal(partialHome.data.heroHeading, 'Used Car Nearby');
    assert.deepEqual(partialHome.data.heroSlides, initialHome.heroSlides, 'Partial homepage update must preserve heroSlides');

    const publicSettings = (await requestJson('/api/settings')).data;
    assert.equal('jwtSecret' in publicSettings, false);
    assert.equal('adminPassword' in publicSettings, false);
  });

  it('synchronizes saved showroom Maps & address settings between /api/admin/location and /api/about without overwriting unrelated About content', async () => {
    const initialAbout = (await requestJson('/api/about')).data;
    const customEmbed = 'https://maps.google.com/maps?q=loc:28.641,77.295+(Wonder+Cars+New)&t=m&z=17&ie=UTF8&iwloc=&output=embed';
    const customDirections = 'https://www.google.com/maps/dir//Wonder+Cars/@28.641,77.295,17z/data=!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d28.641!4d77.295';
    const customAddress = 'Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi, India - 110092';

    const locSave = await requestJson('/api/admin/location', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({
        businessName: 'Wonder Cars',
        address: customAddress,
        latitude: '28.641',
        longitude: '77.295',
        googleMapsEmbedUrl: customEmbed,
        googleMapsDirectionsUrl: customDirections,
      }),
    });
    assert.equal(locSave.status, 200);

    const updatedAbout = (await requestJson('/api/about')).data;
    assert.equal(updatedAbout.showroomAddress, customAddress);
    assert.equal(updatedAbout.googleMapsEmbedUrl, customEmbed);
    assert.equal(updatedAbout.googleMapsDirectionsUrl, customDirections);
    assert.deepEqual(updatedAbout.ownerBio, initialAbout.ownerBio, 'Location save must not overwrite ownerBio');
    assert.deepEqual(updatedAbout.galleryItems, initialAbout.galleryItems, 'Location save must not overwrite galleryItems');

    // Verify unrelated About update does not alter locationSettings, whereas explicit Maps edit in About syncs back
    const locBeforeHeadline = (await requestJson('/api/location')).data.location;
    await requestJson('/api/admin/about', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({ headline: 'Updated About Headline' }),
    });
    const locAfterHeadline = (await requestJson('/api/location')).data.location;
    assert.equal(locAfterHeadline.googleMapsDirectionsUrl, locBeforeHeadline.googleMapsDirectionsUrl);

    const syncedDirectionsFromAbout = 'https://www.google.com/maps/dir//Wonder+Cars/@28.642,77.296,17z';
    await requestJson('/api/admin/about', {
      method: 'PUT',
      headers: { Authorization: basicAuthHeader },
      body: JSON.stringify({ googleMapsDirectionsUrl: syncedDirectionsFromAbout }),
    });
    const locAfterAboutMaps = (await requestJson('/api/location')).data.location;
    assert.equal(locAfterAboutMaps.googleMapsDirectionsUrl, syncedDirectionsFromAbout);
    assert.equal(locAfterAboutMaps.phone, locBeforeHeadline.phone, 'About Maps sync must preserve location phone');
  });
});

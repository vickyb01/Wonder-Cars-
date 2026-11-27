import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');

const vercelConfig = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'vercel.json'), 'utf8'));
const { createNotFoundHandler } = await import(
  pathToFileURL(path.join(FRONTEND_DIR, 'api/not-found.mjs')).href
);
const { createCarPageHandler } = await import(
  pathToFileURL(path.join(FRONTEND_DIR, 'api/car-page.mjs')).href
);
const { createSitemapHandler } = await import(
  pathToFileURL(path.join(FRONTEND_DIR, 'api/sitemap.mjs')).href
);

function createMockRes() {
  const headers = {};
  let body = '';
  return {
    statusCode: 200,
    headers,
    get body() {
      return body;
    },
    setHeader(k, v) {
      headers[k.toLowerCase()] = String(v);
    },
    end(chunk) {
      if (chunk !== undefined) body += String(chunk);
    },
  };
}

/**
 * Converts a Vercel path-to-regexp style route pattern into a RegExp.
 * Supports :param, :param*, and regex groups like ((?!...).*) used in frontend/vercel.json.
 */
function compileVercelPattern(source) {
  let pattern = '^';
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < source.length && depth > 0) {
        if (source[j] === '\\') {
          j += 2;
          continue;
        }
        if (source[j] === '(') depth++;
        else if (source[j] === ')') depth--;
        j++;
      }
      pattern += source.slice(i, j);
      i = j;
      continue;
    }
    if (ch === ':') {
      const match = source.slice(i).match(/^:([a-zA-Z0-9_]+)(\*)?/);
      if (match) {
        if (match[2] === '*') {
          pattern += '(.*)';
        } else {
          pattern += '([^/]+)';
        }
        i += match[0].length;
        continue;
      }
    }
    if ('.+?^${}|[]\\'.includes(ch)) {
      pattern += `\\${ch}`;
    } else if (ch === '*') {
      pattern += '.*';
    } else {
      pattern += ch;
    }
    i++;
  }
  pattern += '$';
  return new RegExp(pattern);
}

/**
 * Simulates Vercel request routing order:
 * 1. trailingSlash: false
 * 2. redirects
 * 3. filesystem static files in dist/ (cleanUrls: true)
 * 4. rewrites -> static dist file, serverless function, or external proxy
 */
function resolveVercelRequest(rawPath) {
  const [pathnameOnly] = rawPath.split('?');

  if (vercelConfig.trailingSlash === false && pathnameOnly.length > 1 && pathnameOnly.endsWith('/')) {
    return {
      type: 'redirect',
      status: 308,
      location: pathnameOnly.replace(/\/+$/, '') || '/',
    };
  }

  for (const rule of vercelConfig.redirects || []) {
    const regex = compileVercelPattern(rule.source);
    if (regex.test(pathnameOnly)) {
      return {
        type: 'redirect',
        status: rule.permanent ? 308 : 307,
        location: rule.destination,
      };
    }
  }

  // Static filesystem resolution in dist/
  if (pathnameOnly === '/') {
    return { type: 'static', file: 'index.html' };
  }
  const rel = pathnameOnly.replace(/^\/+/, '');
  const exactFile = path.join(DIST_DIR, rel);
  if (fs.existsSync(exactFile) && fs.statSync(exactFile).isFile()) {
    return { type: 'static', file: rel };
  }
  if (vercelConfig.cleanUrls && !path.extname(rel)) {
    const cleanHtml = path.join(DIST_DIR, `${rel}.html`);
    if (fs.existsSync(cleanHtml) && fs.statSync(cleanHtml).isFile()) {
      return { type: 'static', file: `${rel}.html` };
    }
  }

  // Rewrites
  for (const rule of vercelConfig.rewrites || []) {
    const regex = compileVercelPattern(rule.source);
    const match = pathnameOnly.match(regex);
    if (!match) continue;

    let dest = rule.destination;
    for (let idx = 1; idx < match.length; idx++) {
      dest = dest.replace(`$${idx}`, match[idx] ?? '');
    }
    if (rule.source.includes(':id') && match[1]) {
      dest = dest.replace(':id', match[1]);
    }
    if (rule.source.includes(':path*') && match[1]) {
      dest = dest.replace(':path*', match[1]);
    }

    if (/^https?:\/\//i.test(dest)) {
      return { type: 'proxy', destination: dest };
    }
    if (dest.startsWith('/api/')) {
      return { type: 'function', destination: dest };
    }
    const destRel = dest.replace(/^\/+/, '');
    return { type: 'static', file: destRel };
  }

  // Direct Vercel Serverless Function resolution (api/*.mjs)
  if (pathnameOnly.startsWith('/api/')) {
    const fnName = pathnameOnly.slice('/api/'.length).replace(/\/+$/, '');
    const fnPath = path.join(FRONTEND_DIR, 'api', `${fnName}.mjs`);
    if (fnName && !fnName.includes('/') && fs.existsSync(fnPath)) {
      return { type: 'function', destination: `/api/${fnName}` };
    }
  }

  return { type: 'unmatched' };
}

test('built dist/ contains spa-fallback.html with noindex and no canonical', () => {
  const spaFallbackPath = path.join(DIST_DIR, 'spa-fallback.html');
  assert.equal(fs.existsSync(spaFallbackPath), true);
  const html = fs.readFileSync(spaFallbackPath, 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, nofollow" \/>/);
  assert.equal(/<link\s+rel=["']canonical["']/i.test(html), false);
  assert.equal(/property=["']og:url["']/i.test(html), false);
});

test('valid static routes and static assets resolve properly and are not caught by 404', () => {
  assert.deepEqual(resolveVercelRequest('/'), { type: 'static', file: 'index.html' });
  assert.deepEqual(resolveVercelRequest('/cars'), { type: 'static', file: 'cars.html' });
  assert.deepEqual(resolveVercelRequest('/about'), { type: 'static', file: 'about.html' });
  assert.deepEqual(resolveVercelRequest('/contact'), { type: 'static', file: 'contact.html' });
  assert.deepEqual(resolveVercelRequest('/privacy'), { type: 'static', file: 'privacy.html' });
  assert.deepEqual(resolveVercelRequest('/terms'), { type: 'static', file: 'terms.html' });
  assert.deepEqual(resolveVercelRequest('/admin'), { type: 'static', file: 'admin.html' });
  assert.deepEqual(resolveVercelRequest('/robots.txt'), { type: 'static', file: 'robots.txt' });
  assert.deepEqual(resolveVercelRequest('/favicon.ico'), { type: 'static', file: 'favicon.ico' });
  assert.deepEqual(resolveVercelRequest('/favicon.png'), { type: 'static', file: 'favicon.png' });

  const distAssets = fs.readdirSync(path.join(DIST_DIR, 'assets'));
  const jsAsset = distAssets.find((f) => f.endsWith('.js'));
  assert.ok(jsAsset, 'Expected built JS asset in dist/assets');
  assert.deepEqual(resolveVercelRequest(`/assets/${jsAsset}`), {
    type: 'static',
    file: `assets/${jsAsset}`,
  });
});

test('trailing slashes redirect cleanly and legacy redirect routes return 308', () => {
  assert.deepEqual(resolveVercelRequest('/about/'), {
    type: 'redirect',
    status: 308,
    location: '/about',
  });
  assert.deepEqual(resolveVercelRequest('/cars/'), {
    type: 'redirect',
    status: 308,
    location: '/cars',
  });
  assert.deepEqual(resolveVercelRequest('/cars/car-101/'), {
    type: 'redirect',
    status: 308,
    location: '/cars/car-101',
  });
  assert.deepEqual(resolveVercelRequest('/cars/foo/bar/'), {
    type: 'redirect',
    status: 308,
    location: '/cars/foo/bar',
  });

  assert.deepEqual(resolveVercelRequest('/compare'), {
    type: 'redirect',
    status: 308,
    location: '/cars',
  });
  assert.deepEqual(resolveVercelRequest('/sell'), {
    type: 'redirect',
    status: 308,
    location: '/cars',
  });
  assert.deepEqual(resolveVercelRequest('/gallery'), {
    type: 'redirect',
    status: 308,
    location: '/about#gallery',
  });
});

test('api, uploads, sitemap.xml, and valid /cars/:id routes preserve expected targets', () => {
  assert.deepEqual(resolveVercelRequest('/sitemap.xml'), {
    type: 'function',
    destination: '/api/sitemap',
  });
  assert.deepEqual(resolveVercelRequest('/cars/car-1795405569642'), {
    type: 'function',
    destination: '/api/car-page?id=car-1795405569642',
  });
  assert.deepEqual(resolveVercelRequest('/api/mail-relay'), {
    type: 'function',
    destination: '/api/mail-relay',
  });
  assert.deepEqual(resolveVercelRequest('/api/cars'), {
    type: 'proxy',
    destination: 'https://wonder-cars-1.onrender.com/api/cars',
  });
  assert.deepEqual(resolveVercelRequest('/uploads/test.jpeg'), {
    type: 'proxy',
    destination: 'https://wonder-cars-1.onrender.com/uploads/test.jpeg',
  });
});

test('unknown routes and nested invalid paths route to /api/not-found and return HTTP 404', async () => {
  const invalidUrls = [
    '/does-not-exist',
    '/random/nested/route',
    '/cars/foo/bar',
    '/cars/foo/bar/baz',
    '/about/team',
    '/contact/extra',
    '/assets/missing-file-xyz.js',
  ];

  const distFallback = fs.readFileSync(path.join(DIST_DIR, 'spa-fallback.html'), 'utf8');
  const notFoundHandler = createNotFoundHandler({ templateHtml: distFallback });

  for (const url of invalidUrls) {
    const resolved = resolveVercelRequest(url);
    assert.deepEqual(
      resolved,
      { type: 'function', destination: '/api/not-found' },
      `Expected ${url} to route to /api/not-found`
    );

    const res = createMockRes();
    await notFoundHandler({ method: 'GET', url }, res);
    assert.equal(res.statusCode, 404, `Expected HTTP 404 for ${url}`);
    assert.equal(res.headers['x-robots-tag'], 'noindex, nofollow');
    assert.match(res.headers['cache-control'], /no-store/);
    assert.match(res.body, /<title>Page Not Found \| Used Car Nearby<\/title>/);
    assert.match(res.body, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.equal(/<link\s+rel=["']canonical["']/i.test(res.body), false);
    assert.equal(/property=["']og:url["']/i.test(res.body), false);
    assert.equal(/id=["']car-schema["']/i.test(res.body), false);
    assert.match(res.body, /<script type="module"/i);
  }

  // HEAD request on unknown route returns 404 with empty body
  const headRes = createMockRes();
  await notFoundHandler({ method: 'HEAD', url: '/cars/foo/bar' }, headRes);
  assert.equal(headRes.statusCode, 404);
  assert.equal(headRes.body, '');
});

test('valid car-page and sitemap handlers still return HTTP 200', async () => {
  const distFallback = fs.readFileSync(path.join(DIST_DIR, 'spa-fallback.html'), 'utf8');
  const sampleCar = {
    id: 'car-101',
    brand: 'Porsche',
    model: '911',
    variant: 'Carrera S',
    year: 2022,
    priceInr: 18500000,
    kilometres: 9200,
    fuelType: 'Petrol',
    transmission: 'PDK',
    status: 'Available',
    images: ['https://res.cloudinary.com/demo/image/upload/911.jpg'],
  };

  const carHandler = createCarPageHandler({
    templateHtml: distFallback,
    fetchImpl: async () =>
      new Response(JSON.stringify({ car: sampleCar, similar: [], sellerOtherCars: [] }), {
        status: 200,
      }),
  });
  const carRes = createMockRes();
  await carHandler({ method: 'GET', query: { id: 'car-101' }, url: '/cars/car-101' }, carRes);
  assert.equal(carRes.statusCode, 200);
  assert.match(carRes.body, /https:\/\/www\.usedcarnearby\.com\/cars\/car-101/);

  const sitemapHandler = createSitemapHandler({
    fetchImpl: async () => new Response(JSON.stringify([sampleCar]), { status: 200 }),
  });
  const sitemapRes = createMockRes();
  await sitemapHandler({ method: 'GET', url: '/sitemap.xml' }, sitemapRes);
  assert.equal(sitemapRes.statusCode, 200);
  assert.match(sitemapRes.body, /\/cars\/car-101<\/loc>/);
});

test('App.tsx routes unknown paths to NotFoundPage with Browse Cars and Homepage links', () => {
  const appSource = fs.readFileSync(path.join(FRONTEND_DIR, 'src/App.tsx'), 'utf8');
  assert.match(appSource, /<Route path="\*" element=\{<NotFoundPage \/>\} \/>/);
  assert.equal(/<Route path="\*" element=\{<HomePage \/>\} \/>/.test(appSource), false);

  const notFoundSource = fs.readFileSync(path.join(FRONTEND_DIR, 'src/pages/NotFoundPage.tsx'), 'utf8');
  assert.match(notFoundSource, /Page Not Found/);
  assert.match(notFoundSource, /robots="noindex, nofollow"/);
  assert.match(notFoundSource, /noCanonical/);
  assert.match(notFoundSource, /to="\/cars"/);
  assert.match(notFoundSource, /to="\/"/);
});

function extractJsonLdScripts(html) {
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return matches.map((m) => JSON.parse(m[1]));
}

test('public HTML shells have valid, non-duplicated Organization, WebSite, and AutoDealer JSON-LD', () => {
  const publicFiles = ['index.html', 'about.html', 'cars.html', 'contact.html', 'privacy.html', 'terms.html'];
  const expectedSameAs = [
    'https://www.instagram.com/usedcarsnearby/',
    'https://www.facebook.com/amanjain.nj784/',
    'https://www.youtube.com/c/usedcarsnearby',
  ];

  for (const fileName of publicFiles) {
    const html = fs.readFileSync(path.join(DIST_DIR, fileName), 'utf8');
    const schemas = extractJsonLdScripts(html);
    const orgs = schemas.filter((s) => s['@type'] === 'Organization');
    const sites = schemas.filter((s) => s['@type'] === 'WebSite');
    const dealers = schemas.filter((s) => s['@type'] === 'AutoDealer');

    assert.equal(orgs.length, 1, `Expected 1 Organization in ${fileName}`);
    assert.equal(sites.length, 1, `Expected 1 WebSite in ${fileName}`);
    assert.equal(dealers.length, 1, `Expected 1 AutoDealer in ${fileName}`);

    assert.equal(orgs[0].name, 'Used Car Nearby');
    assert.deepEqual(orgs[0].alternateName, ['UsedCarNearby', 'usedcarnearby.com']);
    assert.deepEqual(orgs[0].sameAs, expectedSameAs);
    assert.equal(orgs[0].subOrganization?.['@id'], 'https://www.usedcarnearby.com/#wondercars');

    assert.equal(sites[0].publisher?.['@id'], 'https://www.usedcarnearby.com/#organization');

    assert.equal(dealers[0].name, 'Wonder Cars');
    assert.equal(dealers[0].parentOrganization?.['@id'], 'https://www.usedcarnearby.com/#organization');
    assert.equal(dealers[0].address?.postalCode, '110092');
    assert.equal(dealers[0].geo?.latitude, 28.6396915);
    assert.equal(dealers[0].geo?.longitude, 77.2936307);
    assert.equal(dealers[0].sameAs, undefined);
  }
});

test('noindex admin and 404 HTML shells exclude Organization, AutoDealer, and business social profiles', async () => {
  for (const fileName of ['admin.html', 'spa-fallback.html']) {
    const html = fs.readFileSync(path.join(DIST_DIR, fileName), 'utf8');
    assert.equal(extractJsonLdScripts(html).length, 0, `Expected no JSON-LD in ${fileName}`);
    assert.equal(/instagram\.com|facebook\.com|youtube\.com/i.test(html), false);
  }

  const distFallback = fs.readFileSync(path.join(DIST_DIR, 'spa-fallback.html'), 'utf8');
  const notFoundHandler = createNotFoundHandler({ templateHtml: distFallback });
  const res = createMockRes();
  await notFoundHandler({ method: 'GET', url: '/unknown-page' }, res);
  assert.equal(extractJsonLdScripts(res.body).length, 0);
  assert.equal(/instagram\.com|facebook\.com|youtube\.com/i.test(res.body), false);
});

test('Phase 2 metadata consistency: unique titles/descriptions and aligned static vs shared SEO constants', async () => {
  const seoShared = await import(
    pathToFileURL(path.join(FRONTEND_DIR, 'src/utils/carSeoShared.mjs')).href
  );

  const decodeEntities = (s) =>
    s
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

  const expectedPages = [
    {
      file: 'index.html',
      title: seoShared.HOMEPAGE_SEO_TITLE,
      description: seoShared.HOMEPAGE_SEO_DESCRIPTION,
      canonical: 'https://www.usedcarnearby.com/',
      robots: 'index, follow',
    },
    {
      file: 'cars.html',
      title: `${seoShared.CARS_SEO_TITLE} | ${seoShared.SITE_BRAND_NAME}`,
      description: seoShared.CARS_SEO_DESCRIPTION,
      canonical: 'https://www.usedcarnearby.com/cars',
      robots: 'index, follow',
    },
    {
      file: 'about.html',
      title: `${seoShared.ABOUT_SEO_TITLE} | ${seoShared.SITE_BRAND_NAME}`,
      description: seoShared.ABOUT_SEO_DESCRIPTION,
      canonical: 'https://www.usedcarnearby.com/about',
      robots: 'index, follow',
    },
    {
      file: 'contact.html',
      title: `${seoShared.CONTACT_SEO_TITLE} | ${seoShared.SITE_BRAND_NAME}`,
      description: seoShared.CONTACT_SEO_DESCRIPTION,
      canonical: 'https://www.usedcarnearby.com/contact',
      robots: 'index, follow',
    },
    {
      file: 'privacy.html',
      title: `${seoShared.PRIVACY_SEO_TITLE} | ${seoShared.SITE_BRAND_NAME}`,
      description: seoShared.PRIVACY_SEO_DESCRIPTION,
      canonical: 'https://www.usedcarnearby.com/privacy',
      robots: 'index, follow',
    },
    {
      file: 'terms.html',
      title: `${seoShared.TERMS_SEO_TITLE} | ${seoShared.SITE_BRAND_NAME}`,
      description: seoShared.TERMS_SEO_DESCRIPTION,
      canonical: 'https://www.usedcarnearby.com/terms',
      robots: 'index, follow',
    },
    {
      file: 'admin.html',
      title: seoShared.ADMIN_LOGIN_SEO_TITLE,
      description: seoShared.ADMIN_LOGIN_SEO_DESCRIPTION,
      canonical: null,
      robots: 'noindex, nofollow',
    },
  ];

  const seenTitles = new Set();
  const seenDescriptions = new Set();

  for (const page of expectedPages) {
    const html = fs.readFileSync(path.join(DIST_DIR, page.file), 'utf8');
    const title = decodeEntities(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
    const description = decodeEntities(
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] || ''
    );
    const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i)?.[1] || '';
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)?.[1] || null;

    assert.equal(title, page.title, `Title mismatch in ${page.file}`);
    assert.equal(description, page.description, `Description mismatch in ${page.file}`);
    assert.equal(robots, page.robots, `Robots mismatch in ${page.file}`);
    assert.equal(canonical, page.canonical, `Canonical mismatch in ${page.file}`);

    assert.equal(seenTitles.has(title), false, `Duplicate title found: ${title}`);
    assert.equal(seenDescriptions.has(description), false, `Duplicate description found: ${description}`);
    seenTitles.add(title);
    seenDescriptions.add(description);
  }
});

test('Phase 2 Google Maps URLs, showroom address, and internal navigation links are consistent', () => {
  const locationSrc = fs.readFileSync(path.join(FRONTEND_DIR, 'src/utils/location.ts'), 'utf8');
  assert.match(locationSrc, /0x390cfb5c00000001/);
  assert.match(locationSrc, /SHOWROOM_GOOGLE_MAPS_EMBED_URL/);

  const seoSharedSrc = fs.readFileSync(path.join(FRONTEND_DIR, 'src/utils/carSeoShared.mjs'), 'utf8');
  assert.match(seoSharedSrc, /28\.6396915/);
  assert.match(seoSharedSrc, /77\.2936307/);
  assert.match(seoSharedSrc, /0x390cfbb6c71185b3:0x518ca5e40932dc6d/);
  assert.match(seoSharedSrc, /Shop No\.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi, India - 110092/);

  const navbarSrc = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/Navbar.tsx'), 'utf8');
  const mobileNavMatch = navbarSrc.match(/aria-label="Mobile navigation"[\s\S]*?<\/nav>/);
  assert.ok(mobileNavMatch, 'Expected mobile navigation block');
  assert.match(mobileNavMatch[0], /to="\/cars"/);

  const footerSrc = fs.readFileSync(path.join(FRONTEND_DIR, 'src/components/Footer.tsx'), 'utf8');
  assert.match(footerSrc, /to="\/about"/);
  assert.match(footerSrc, /to="\/contact"/);
  assert.match(footerSrc, /to="\/privacy"/);
  assert.match(footerSrc, /to="\/terms"/);
  assert.equal(/to="\/admin"/.test(footerSrc), false, 'Public footer must not link to /admin');
  assert.equal(/About Wonder Cars/.test(footerSrc), false, 'Footer should not use About Wonder Cars link label');
});

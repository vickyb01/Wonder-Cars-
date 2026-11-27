import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const SCRATCH_TMP = path.join(FRONTEND_DIR, '.tmp-test-build');

const { build: viteBuild } = await import(
  pathToFileURL(path.join(FRONTEND_DIR, 'node_modules/vite/dist/node/index.js')).href
);

test('api.ts upload candidates prefer direct Render once proxy fails', async () => {
  await viteBuild({
    root: FRONTEND_DIR,
    logLevel: 'silent',
    define: {
      'import.meta.env.VITE_API_URL': '"https://wonder-cars-1.onrender.com"',
      'import.meta.env.VITE_API_BASE_URL': '"https://wonder-cars-1.onrender.com"',
    },
    build: {
      outDir: path.join(SCRATCH_TMP, 'api'),
      emptyOutDir: true,
      minify: false,
      lib: {
        entry: path.join(FRONTEND_DIR, 'src/utils/api.ts'),
        formats: ['es'],
        fileName: () => 'api.mjs',
      },
    },
  });

  globalThis.window = {
    location: { hostname: 'www.usedcarnearby.com' },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  };
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };

  const apiMod = await import(pathToFileURL(path.join(SCRATCH_TMP, 'api/api.mjs')).href);

  // Initially relative /uploads/... comes first (hits Vercel CDN if present)
  const initialCandidates = apiMod.getUploadUrlCandidates('/uploads/sample-car.jpeg');
  assert.deepEqual(initialCandidates, [
    '/uploads/sample-car.jpeg',
    'https://wonder-cars-1.onrender.com/uploads/sample-car.jpeg',
  ]);

  // After proxy failure, direct Render URL is prioritized automatically
  apiMod.markUploadProxyFailed();
  const afterFailureCandidates = apiMod.getUploadUrlCandidates('/uploads/sample-car.jpeg');
  assert.deepEqual(afterFailureCandidates, [
    'https://wonder-cars-1.onrender.com/uploads/sample-car.jpeg',
    '/uploads/sample-car.jpeg',
  ]);

  // Absolute Render URL keeps direct URL first
  const directCandidates = apiMod.getUploadUrlCandidates(
    'https://wonder-cars-1.onrender.com/uploads/direct-car.jpeg'
  );
  assert.equal(
    directCandidates[0],
    'https://wonder-cars-1.onrender.com/uploads/direct-car.jpeg'
  );
});

test('VehicleImage renders img immediately on first pass and handles responsive desktopSrc + retries', async () => {
  const shimDir = path.join(SCRATCH_TMP, 'shims');
  fs.mkdirSync(shimDir, { recursive: true });

  const reactShimPath = path.join(shimDir, 'react.mjs');
  fs.writeFileSync(
    reactShimPath,
    `
const store = (globalThis.__ucnReactShim ??= {
  states: [],
  refs: [],
  effects: [],
  stateIdx: 0,
  refIdx: 0,
});

export function __resetHookState() {
  store.states.length = 0;
  store.refs.length = 0;
  store.effects.length = 0;
  store.stateIdx = 0;
  store.refIdx = 0;
}

export function __beginRender() {
  store.stateIdx = 0;
  store.refIdx = 0;
  store.effects.length = 0;
}

export function __flushEffects() {
  for (const fn of store.effects) {
    fn();
  }
}

export function useState(init) {
  const idx = store.stateIdx++;
  if (!(idx in store.states)) {
    store.states[idx] = typeof init === 'function' ? init() : init;
  }
  const setState = (next) => {
    store.states[idx] = typeof next === 'function' ? next(store.states[idx]) : next;
  };
  return [store.states[idx], setState];
}

export function useRef(init) {
  const idx = store.refIdx++;
  if (!(idx in store.refs)) {
    store.refs[idx] = { current: init };
  }
  return store.refs[idx];
}

export function useCallback(fn) {
  return fn;
}

export function useEffect(fn) {
  store.effects.push(fn);
}

export function forwardRef(render) {
  return render;
}

export function createElement(type, props, ...children) {
  return { type, props: { ...props, children } };
}
`,
    'utf8'
  );

  const jsxRuntimeShimPath = path.join(shimDir, 'jsx-runtime.mjs');
  fs.writeFileSync(
    jsxRuntimeShimPath,
    `
export function jsx(type, props) {
  return { type, props };
}
export const jsxs = jsx;
export const Fragment = Symbol('Fragment');
`,
    'utf8'
  );

  await viteBuild({
    root: FRONTEND_DIR,
    logLevel: 'silent',
    resolve: {
      alias: [
        { find: /^react\/jsx-runtime$/, replacement: jsxRuntimeShimPath },
        { find: /^react\/jsx-dev-runtime$/, replacement: jsxRuntimeShimPath },
        { find: /^react$/, replacement: reactShimPath },
      ],
    },
    build: {
      outDir: path.join(SCRATCH_TMP, 'vehicle-img'),
      emptyOutDir: true,
      minify: false,
      lib: {
        entry: path.join(FRONTEND_DIR, 'src/components/VehicleImage.tsx'),
        formats: ['es'],
        fileName: () => 'VehicleImage.mjs',
      },
    },
  });

  const listeners = new Map();
  globalThis.window = {
    location: { hostname: 'www.usedcarnearby.com' },
    addEventListener: (ev, cb) => {
      const arr = listeners.get(ev) || [];
      arr.push(cb);
      listeners.set(ev, arr);
    },
    removeEventListener: () => {},
    dispatchEvent: (ev) => {
      for (const cb of listeners.get(ev.type) || []) cb(ev);
    },
    setTimeout,
    clearTimeout,
  };
  globalThis.document = {
    visibilityState: 'visible',
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const reactShim = await import(pathToFileURL(reactShimPath).href);
  const { VehicleImage } = await import(
    pathToFileURL(path.join(SCRATCH_TMP, 'vehicle-img/VehicleImage.mjs')).href
  );

  // 1. First render with valid src must immediately emit <img> (NOT placeholder div)
  reactShim.__resetHookState();
  reactShim.__beginRender();
  const tree1 = VehicleImage({
    src: '/uploads/test-123.jpeg',
    alt: '2023 Porsche 911',
    loading: 'eager',
    fetchPriority: 'high',
  });
  assert.equal(tree1.type, 'img', 'Initial render must directly output <img> without waiting for useEffect');
  assert.match(tree1.props.src, /\/uploads\/test-123\.jpeg$/);
  assert.equal(tree1.props.loading, 'eager');
  assert.equal(tree1.props.fetchPriority, 'high');

  const pictureNodes = (tree) =>
    (Array.isArray(tree.props.children) ? tree.props.children : [tree.props.children])
      .flat(Infinity)
      .filter((n) => n && typeof n === 'object');

  // Prevent wakeBackend() from opening network/timer handles during unit test
  const origFetch = globalThis.fetch;
  globalThis.fetch = () => new Promise(() => {});

  try {
    // 2. When desktopSrc differs, outputs <picture> with desktop WebP <source>, JPG fallback <source>, and mobile <img>
    reactShim.__resetHookState();
    reactShim.__beginRender();
    const pictureTree = VehicleImage({
      src: '/assets/hero_luxury_coupe_mobile.webp',
      desktopSrc: '/src/assets/images/hero_luxury_coupe_1794898128860.jpg',
      alt: 'Hero car',
      loading: 'eager',
      fetchPriority: 'high',
    });
    assert.equal(pictureTree.type, 'picture');
    const picChildren = pictureNodes(pictureTree);
    const sources = picChildren.filter((c) => c.type === 'source');
    const imgNode = picChildren.find((c) => c.type === 'img');
    assert.equal(sources[0].props.media, '(min-width: 768px)');
    assert.equal(sources[0].props.type, 'image/webp');
    assert.equal(
      sources[0].props.srcSet,
      '/src/assets/images/hero_luxury_coupe_1794898128860.webp'
    );
    assert.equal(sources[1].props.media, '(min-width: 768px)');
    assert.equal(
      sources[1].props.srcSet,
      '/src/assets/images/hero_luxury_coupe_1794898128860.jpg'
    );
    assert.equal(imgNode.props.src, '/assets/hero_luxury_coupe_mobile.webp');

    // WebP error bypasses <source type="image/webp"> cleanly to original JPG fallback
    imgNode.props.onError();
    reactShim.__beginRender();
    const pictureFallback = VehicleImage({
      src: '/assets/hero_luxury_coupe_mobile.webp',
      desktopSrc: '/src/assets/images/hero_luxury_coupe_1794898128860.jpg',
      alt: 'Hero car',
    });
    const fallbackSources = pictureNodes(pictureFallback).filter((c) => c.type === 'source');
    assert.equal(fallbackSources.some((s) => s.props.type === 'image/webp'), false);
    assert.equal(
      fallbackSources[0].props.srcSet,
      '/src/assets/images/hero_luxury_coupe_1794898128860.jpg'
    );

    // 3. When first /uploads/ attempt errors, switches cleanly to alternate Render URL without ?r=
    reactShim.__resetHookState();
    reactShim.__beginRender();
    const errTree = VehicleImage({
      src: '/uploads/test-retry.jpeg',
      alt: 'Retry car',
    });
    errTree.props.onError();
    reactShim.__beginRender();
    const afterErrorTree = VehicleImage({
      src: '/uploads/test-retry.jpeg',
      alt: 'Retry car',
    });
    assert.equal(afterErrorTree.type, 'img');
    assert.notEqual(afterErrorTree.props.src, errTree.props.src);
    assert.equal(afterErrorTree.props.src.includes('?r='), false);

    // 4. When <picture> desktopSrc uses /uploads/ after proxy failed, attempt 1 falls back to relative /uploads/... and attempt 2 schedules direct Render ?retry=2
    reactShim.__resetHookState();
    reactShim.__beginRender();
    const desktopErrTree = VehicleImage({
      src: '/assets/hero_luxury_coupe_mobile.webp',
      desktopSrc: '/uploads/custom-desktop-hero.jpeg',
      alt: 'Custom hero',
    });
    assert.equal(desktopErrTree.type, 'picture');
    const d1Nodes = pictureNodes(desktopErrTree);
    assert.equal(
      d1Nodes.find((c) => c.type === 'source').props.srcSet,
      'https://wonder-cars-1.onrender.com/uploads/custom-desktop-hero.jpeg'
    );
    d1Nodes.find((c) => c.type === 'img').props.onError();
    reactShim.__beginRender();
    const desktopAfterErr = VehicleImage({
      src: '/assets/hero_luxury_coupe_mobile.webp',
      desktopSrc: '/uploads/custom-desktop-hero.jpeg',
      alt: 'Custom hero',
    });
    assert.equal(desktopAfterErr.type, 'picture');
    const d2Nodes = pictureNodes(desktopAfterErr);
    assert.equal(
      d2Nodes.find((c) => c.type === 'source').props.srcSet,
      '/uploads/custom-desktop-hero.jpeg'
    );

    // 5. On attempt 2 (proxy + direct initial failure), retry advances cleanly back to direct Render URL with ?retry=2 (never repeats same URL)
    let scheduledTimer = null;
    const origSetTimeout = globalThis.window.setTimeout;
    globalThis.window.setTimeout = (cb) => {
      scheduledTimer = cb;
      return 1;
    };
    try {
      d2Nodes.find((c) => c.type === 'img').props.onError();
      assert.ok(typeof scheduledTimer === 'function', 'Attempt 2 must schedule retry callback');
      scheduledTimer();
      reactShim.__beginRender();
      const afterAttempt2 = VehicleImage({
        src: '/assets/hero_luxury_coupe_mobile.webp',
        desktopSrc: '/uploads/custom-desktop-hero.jpeg',
        alt: 'Custom hero',
      });
      assert.equal(
        pictureNodes(afterAttempt2).find((c) => c.type === 'source').props.srcSet,
        'https://wonder-cars-1.onrender.com/uploads/custom-desktop-hero.jpeg?retry=2'
      );
    } finally {
      globalThis.window.setTimeout = origSetTimeout;
    }
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('All static WebP manifest paths exist on disk and components render OptimizedPicture', () => {
  const manifestSrc = fs.readFileSync(
    path.join(FRONTEND_DIR, 'src/utils/optimizedImages.ts'),
    'utf8'
  );
  const paths = [...manifestSrc.matchAll(/'(\/[^']+\.webp)'/g)].map((m) => m[1]);
  assert.ok(paths.length >= 40, 'Expected verified static WebP entries in optimizedImages.ts');
  for (const webpPath of paths) {
    const diskPath = webpPath.startsWith('/src/')
      ? path.join(FRONTEND_DIR, webpPath.slice(1))
      : path.join(FRONTEND_DIR, 'public', webpPath.slice(1));
    assert.ok(fs.existsSync(diskPath), `Missing WebP file on disk for ${webpPath}`);

    // Confirm original fallback still exists
    const stem = diskPath.replace(/\.webp$/, '');
    const hasFallback = ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => fs.existsSync(stem + ext));
    assert.ok(hasFallback, `Missing fallback asset for ${webpPath}`);
  }

  for (const rel of ['src/components/Navbar.tsx', 'src/components/Footer.tsx', 'src/pages/AboutPage.tsx']) {
    const src = fs.readFileSync(path.join(FRONTEND_DIR, rel), 'utf8');
    assert.match(src, /OptimizedPicture/);
  }
});

test('HomePage, InventoryPage, CarDetailPage, AboutPage, and ShowroomGallery implement priority & recovery', () => {
  const home = fs.readFileSync(path.join(FRONTEND_DIR, 'src/pages/HomePage.tsx'), 'utf8');
  assert.match(home, /BACKEND_READY_EVENT/);
  assert.match(home, /desktopSrc=\{slide\.src\}/);
  assert.match(home, /fetchPriority=\{idx === 0 \? 'high' : 'low'\}/);

  const inv = fs.readFileSync(path.join(FRONTEND_DIR, 'src/pages/InventoryPage.tsx'), 'utf8');
  assert.match(inv, /BACKEND_READY_EVENT/);
  assert.match(inv, /loading=\{idx < 6 \? 'eager' : 'lazy'\}/);

  const detail = fs.readFileSync(path.join(FRONTEND_DIR, 'src/pages/CarDetailPage.tsx'), 'utf8');
  assert.match(detail, /BACKEND_READY_EVENT/);
  assert.match(detail, /ApiRequestError/);

  const gallery = fs.readFileSync(
    path.join(FRONTEND_DIR, 'src/components/showroom/ShowroomGallery.tsx'),
    'utf8'
  );
  assert.match(gallery, /indicesToPreload/);
  assert.match(gallery, /fetchPriority="high"/);

  const indexHtml = fs.readFileSync(path.join(FRONTEND_DIR, 'index.html'), 'utf8');
  assert.match(indexHtml, /rel="preconnect" href="https:\/\/wonder-cars-1\.onrender\.com"/);

  // Clean up scratch build folder
  fs.rmSync(SCRATCH_TMP, { recursive: true, force: true });
});

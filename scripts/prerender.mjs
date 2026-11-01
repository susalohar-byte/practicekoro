// Renders the public pages of the built site in a headless browser and saves the finished HTML to
// dist/_prerender/<page>.html. .htaccess serves those files to search and AI crawlers (many of
// which never run JavaScript), while visitors keep getting the normal app from dist/index.html.
// Runs after `vite build`. Set PRERENDER=skip to leave it out (CI has no browser installed).
/* global document, window, DOMParser -- used inside page.evaluate(), which runs in the browser */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright';

// Public routes, without the leading slash; '' is the homepage. Keep in step with sitemap.xml.
const ROUTES = ['', 'blog', 'contact', 'privacy', 'terms', 'refund'];
const OUT_DIR = join('dist', '_prerender');

if (process.env.PRERENDER === 'skip') {
  console.log('Prerender skipped (PRERENDER=skip).');
  process.exit(0);
}

// Playwright's own headless browser may not be downloaded; fall back to a full Chromium or Chrome.
async function launchBrowser() {
  for (const options of [{}, { channel: 'chromium' }, { channel: 'chrome' }]) {
    try {
      return await chromium.launch(options);
    } catch {
      // try the next one
    }
  }
  throw new Error('No browser for prerendering. Run `npx playwright install chromium`.');
}

const shell = readFileSync(join('dist', 'index.html'), 'utf8');
const server = await preview({ preview: { port: 4179, strictPort: true }, logLevel: 'warn' });
const origin = 'http://localhost:4179';
const browser = await launchBrowser();

try {
  mkdirSync(OUT_DIR, { recursive: true });
  // A crawler is a first-time visitor: no saved theme, no session, no cached data.
  const context = await browser.newContext({
    colorScheme: 'light',
    viewport: { width: 1280, height: 900 },
  });

  for (const route of ROUTES) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${origin}/${route}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#root h1', { timeout: 20000 });
    // Scroll through so every scroll-triggered section has animated into its final state
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    if (route === '' && !(await page.locator('#pricing h3').count())) {
      throw new Error('Homepage plans did not load (check VITE_SUPABASE_* in .env)');
    }
    if (errors.length) throw new Error(`/${route}: ${errors.join('; ')}`);

    const html = await page.evaluate((shellHtml) => {
      const shellDoc = new DOMParser().parseFromString(shellHtml, 'text/html');
      const shellScripts = new Set(
        [...shellDoc.querySelectorAll('script[src]')].map((s) => s.getAttribute('src'))
      );
      const doc = document.documentElement.cloneNode(true);
      const head = doc.querySelector('head');
      const body = doc.querySelector('body');

      // Scripts the app added while running (payment SDKs and the like) would load twice
      head.querySelectorAll('script[src]').forEach((s) => {
        if (!shellScripts.has(s.getAttribute('src'))) s.remove();
      });
      // The page's own tags (marked data-rh by react-helmet) replace the sitewide defaults
      const key = (el) =>
        el.tagName === 'LINK'
          ? `link:${el.getAttribute('rel')}`
          : `meta:${el.getAttribute('name') || el.getAttribute('property')}`;
      const pageKeys = new Set([...head.querySelectorAll('[data-rh]')].map(key));
      head.querySelectorAll('meta[name], meta[property], link[rel="canonical"]').forEach((el) => {
        if (!el.hasAttribute('data-rh') && pageKeys.has(key(el))) el.remove();
      });
      // Only #root and the shell's scripts belong in <body>; drop portals, toasts and iframes
      [...body.children].forEach((el) => {
        const keep =
          el.id === 'root' || (el.tagName === 'SCRIPT' && shellScripts.has(el.getAttribute('src')));
        if (!keep) el.remove();
      });
      // Theme classes are the visitor's choice, set again by theme-init.js on load
      doc.classList.remove('dark');
      doc.removeAttribute('data-theme');
      doc.style.removeProperty('color-scheme');
      if (!doc.getAttribute('style')) doc.removeAttribute('style');
      return `<!doctype html>\n${doc.outerHTML}`;
    }, shell);

    const file = join(OUT_DIR, `${route || 'index'}.html`);
    writeFileSync(file, html);
    const words = (await page.locator('#root').innerText()).split(/\s+/).filter(Boolean).length;
    console.log(`  /${route} -> ${file} (${words} words)`);
    await page.close();
  }
} finally {
  await browser.close();
  // Idle keep-alive sockets would otherwise hold the preview server (and the build) open
  server.httpServer.closeAllConnections?.();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
console.log(`Prerendered ${ROUTES.length} pages into ${OUT_DIR}/`);

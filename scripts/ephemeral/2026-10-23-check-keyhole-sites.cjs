// Verify the Keyhole product page and manual through their public reading paths.
// Usage: node <this-file> <playwright-module> <product-base> <manual-base> <output-dir>
// Accepts local HTTP previews or live HTTPS sites. Uses an existing Playwright
// installation; adds no application dependencies and visits no GitHub links.
// Outputs screenshots plus report.json. Fake clipboard-denial testing is scoped
// to its own browser context. No extension, service account, or credential is used.
// Used 2026-10-24 against local previews and both GitHub Pages sites: all five
// pages and 40 layout cases passed; exact page/code copies, clipboard fallbacks,
// hosted font, no-JavaScript reading, and exports passed with no browser errors.
// Expanded 2026-10-24 for the model reference, Render/Neon MCP and settings:
// local run passed 9 pages, 72 layouts and every configuration copy. The first
// expanded check incorrectly assumed per-block status nodes; each copy button's
// completed label now establishes readiness before checking clipboard bytes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error('Usage: node check-keyhole-sites.cjs <playwright-module> <product-base> <manual-base> <output-dir>');
  process.exit(2);
}
const { chromium } = require(args[0]);
function directoryURL(value) {
  const url = new URL(value);
  assert(['http:', 'https:'].includes(url.protocol), 'Use an HTTP(S) site root');
  assert(!url.search && !url.hash, 'Base URL must not have a query or fragment');
  url.pathname = url.pathname.replace(/\/?$/, '/');
  return url.href;
}
const productBase = directoryURL(args[1]);
const manualBase = directoryURL(args[2]);
const output = path.resolve(args[3]);
const publishedProduct = 'https://jlumbroso.github.io/keyhole/';
const publishedManual = 'https://jlumbroso.github.io/keyhole-docs/';
const chapterNames = [
  'index.html', 'first-secret.html', 'for-assistants.html',
  'render-mcp.html', 'neon-mcp.html', 'assistant-settings.html',
  'keeping-secrets-out-of-the-conversation.html', 'troubleshooting.html',
];
const errors = { javascript: [], console: [], requests: [], http: [] };
let layoutCases = 0;
let contributionLinks = 0;

function observe(context, label) {
  context.on('page', page => {
    page.on('pageerror', error => errors.javascript.push(`${label}: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') errors.console.push(`${label}: ${message.text()}`);
    });
  });
  context.on('requestfailed', request => {
    errors.requests.push(`${label}: ${request.url()}: ${request.failure()?.errorText}`);
  });
  context.on('response', response => {
    if (response.status() >= 400) errors.http.push(`${label}: ${response.status()} ${response.url()}`);
  });
}

async function visit(page, url) {
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  assert(response && response.status() === 200, `Page HTTP status: ${url}`);
  assert.equal(await page.locator('h1').count(), 1, `One h1: ${url}`);
  assert(await page.locator('h1').isVisible(), `Visible heading: ${url}`);
  assert.equal(await page.locator('main').count(), 1, `One main landmark: ${url}`);
  const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
  assert.equal(new Set(ids).size, ids.length, `Unique IDs: ${url}`);
  assert(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)), `Images loaded: ${url}`);
  // Parse destinations without following external links, including private GitHub.
  const links = await page.locator('a[href]').evaluateAll(elements => elements.map(element => ({
    raw: element.getAttribute('href'), href: element.href,
  })));
  for (const link of links) {
    const target = new URL(link.href);
    assert(['https:', 'http:', 'mailto:'].includes(target.protocol), `Usable link scheme: ${link.raw}`);
    if (link.raw.startsWith('#')) {
      assert(ids.includes(decodeURIComponent(target.hash.slice(1))), `Fragment target: ${link.raw} on ${url}`);
    }
  }
}

async function checkFonts(page) {
  const result = await page.evaluate(async () => {
    const body = getComputedStyle(document.body);
    const heading = getComputedStyle(document.querySelector('h1'));
    const loaded = await document.fonts.load(`${heading.fontWeight} ${heading.fontSize} "Berkeley Mono"`, 'Keyhole');
    await document.fonts.ready;
    return {
      body: body.fontFamily, heading: heading.fontFamily,
      loaded: loaded.length > 0 && loaded.every(face => face.status === 'loaded'),
    };
  });
  assert(result.loaded, `Berkeley Mono actually loads: ${page.url()}`);
  assert(result.body.includes('Berkeley Mono') && result.heading.includes('Berkeley Mono'), `Mono body and heading: ${page.url()}`);
}

async function checkOverflow(page, label) {
  const result = await page.evaluate(() => ({
    width: innerWidth, scroll: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll('body *')].filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.right > innerWidth + 1;
    }).slice(0, 8).map(element => `${element.tagName.toLowerCase()}.${element.className}`),
  }));
  assert(result.scroll <= result.width + 1, `Horizontal overflow ${label}: ${JSON.stringify(result)}`);
  layoutCases++;
}

async function checkSkipLink(page, url) {
  await visit(page, url);
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  assert.match(await focused.innerText(), /^Skip to /, `Skip link first in keyboard order: ${url}`);
  const href = await focused.getAttribute('href');
  assert(href?.startsWith('#'), `Skip link destination: ${url}`);
  await page.keyboard.press('Enter');
  const target = href.slice(1);
  await page.waitForFunction(id => document.activeElement?.id === id, target);
  assert.equal(await page.locator(':focus').evaluate(element => element.tagName), 'MAIN', `Skip link focuses main: ${url}`);
}

async function exportText(context, url) {
  const response = await context.request.get(url);
  assert.equal(response.status(), 200, `Markdown HTTP status: ${url}`);
  const text = await response.text();
  assert(/^#\s+\S/m.test(text) && !/^\s*<!doctype html/i.test(text), `Markdown rather than an HTML fallback: ${url}`);
  return text;
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    observe(context, 'normal');
    const page = await context.newPage();
    page.setDefaultTimeout(15000);

    const productURL = new URL('index.html', productBase).href;
    await visit(page, productURL);
    await checkFonts(page);
    assert.equal(await page.locator('script').count(), 0, 'Product remains script-free');
    assert(await page.locator(`a[href="${publishedManual}"]`).count() > 0, 'Product links to the manual');
    assert(await page.locator('a[href="https://jlumbroso.github.io/porthole/"]').count() > 0, 'Product links to Porthole');
    assert(await page.locator('a[href="https://github.com/jlumbroso/keyhole"]').count() > 0, 'Product repository link');
    for (const width of [320, 420, 900, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme });
        await checkOverflow(page, `product/${width}/${colorScheme}`);
      }
    }
    await page.emulateMedia({ colorScheme: 'light' });
    await checkSkipLink(page, productURL);
    for (const [label, width, height] of [['desktop', 1440, 1050], ['narrow', 420, 920]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
      await page.screenshot({ path: path.join(output, `product-${label}.png`), fullPage: true, animations: 'disabled' });
    }

    await visit(page, new URL('index.html', manualBase).href);
    const chapters = await page.locator('nav[aria-label="Chapters"] a').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
    assert.deepEqual(chapters, chapterNames, 'The manual navigation covers every chapter');
    const exports = new Map();
    for (const name of chapters) {
      const url = new URL(name, manualBase).href;
      await visit(page, url);
      await checkFonts(page);
      assert.equal(await page.locator('nav[aria-label="Chapters"] a[aria-current="page"]').getAttribute('href'), name, `Current chapter: ${name}`);
      const viewMarkdown = page.getByRole('link', { name: 'View Markdown', exact: true });
      assert(await viewMarkdown.isVisible(), `Markdown link visible: ${name}`);
      const markdownName = await viewMarkdown.getAttribute('href');
      const markdown = await exportText(context, new URL(markdownName, url).href);
      exports.set(name, { text: markdown, markdownName });
      assert.equal(await page.locator('link[rel="alternate"][type="text/markdown"]').getAttribute('href'), markdownName);
      assert.equal(await page.locator('link[rel="describedby"]').getAttribute('href'), 'llms.txt');
      const edit = new URL(await page.getByRole('link', { name: 'Edit on GitHub', exact: true }).getAttribute('href'));
      assert.equal(edit.origin, 'https://github.com');
      assert(edit.pathname.startsWith('/jlumbroso/keyhole/edit/main/docs/manual/'), `Public-source editing route: ${name}`);
      const correction = new URL(await page.getByRole('link', { name: 'Suggest a correction', exact: true }).getAttribute('href'));
      assert.equal(correction.origin + correction.pathname, 'https://github.com/jlumbroso/keyhole/issues/new');
      assert(correction.searchParams.get('body')?.includes(publishedManual + name), `Correction identifies chapter: ${name}`);
      contributionLinks += 2;
      await page.getByRole('button', { name: 'Copy Page For LLM', exact: true }).click();
      await page.getByText('Page copied.', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), markdown, `Exact page copy: ${name}`);
      for (const width of [320, 420, 900, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const theme of ['light', 'dark']) {
          await page.locator(`[data-theme-choice="${theme}"]`).click();
          assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
          await checkOverflow(page, `${name}/${width}/${theme}`);
        }
      }
    }
    await visit(page, new URL('index.html', manualBase).href);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'Theme persists across chapters');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'Theme persists after reload');
    await page.locator('[data-theme-choice="light"]').click();
    await checkSkipLink(page, new URL('index.html', manualBase).href);
    for (const [label, width, height] of [['desktop', 1440, 1050], ['narrow', 420, 920]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
      await page.screenshot({ path: path.join(output, `manual-${label}.png`), fullPage: true, animations: 'disabled' });
    }
    // Every new setup/reference chapter contains executable or configuration
    // examples. Check every block, including JSON quotes and literal ${...}.
    for (const name of ['for-assistants.html', 'render-mcp.html', 'neon-mcp.html',
      'assistant-settings.html', 'keeping-secrets-out-of-the-conversation.html']) {
      await visit(page, new URL(name, manualBase).href);
      const blocks = page.locator('pre');
      assert(await blocks.count() > 0, `Configuration blocks exist: ${name}`);
      for (let index = 0; index < await blocks.count(); index++) {
        const expectedCode = await blocks.nth(index).textContent();
        await page.getByRole('button', { name: 'Copy code example', exact: true }).nth(index).click();
        await page.waitForFunction(i => document.querySelectorAll('.copy')[i]?.textContent === 'Copied', index);
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expectedCode, `Exact code copy: ${name}/${index}`);
      }
      if (['render-mcp.html', 'neon-mcp.html'].includes(name)) {
        await page.setViewportSize({ width: 1440, height: 1050 });
        await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
        await page.screenshot({ path: path.join(output, name.replace('.html', '.png')), animations: 'disabled' });
      }
    }
    const codeCopy = true;

    const completeManual = await exportText(context, new URL('manual.md', manualBase).href);
    for (const { text } of exports.values()) assert(completeManual.includes(text.trim()), 'Complete manual includes each complete chapter export');
    assert.equal(await exportText(context, new URL('index.md', manualBase).href), exports.get('index.html').text, 'Overview index.md alias');
    const llms = await exportText(context, new URL('llms.txt', manualBase).href);
    assert(llms.startsWith('# Keyhole manual\n\n> '), 'llms.txt title and summary');
    const indexed = [...llms.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].map(match => match[1]);
    assert.equal(indexed.length, chapters.length + 1, 'Every chapter and the complete manual in llms.txt');
    assert.equal(new Set(indexed).size, chapters.length + 1, 'No duplicate llms.txt destinations');
    const indexedTexts = [];
    for (const href of indexed) {
      assert(href.startsWith(publishedManual) && href.endsWith('.md'), `Canonical Markdown destination: ${href}`);
      indexedTexts.push(await exportText(context, new URL(href.slice(publishedManual.length), manualBase).href));
    }
    for (const { text } of exports.values()) assert(indexedTexts.includes(text), 'Each chapter is discoverable through llms.txt');
    assert(indexedTexts.includes(completeManual), 'Complete manual is discoverable through llms.txt');

    const denied = await browser.newContext();
    observe(denied, 'clipboard-denied');
    await denied.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: async () => { throw new DOMException('Clipboard denied by this check', 'NotAllowedError'); },
      } });
    });
    const fallbackPage = await denied.newPage();
    for (const name of chapters) {
      await visit(fallbackPage, new URL(name, manualBase).href);
      await fallbackPage.getByRole('button', { name: 'Copy Page For LLM', exact: true }).click();
      const field = fallbackPage.getByRole('textbox', { name: 'Chapter Markdown', exact: true });
      await field.waitFor({ state: 'visible' });
      assert.equal(await field.inputValue(), exports.get(name).text, `Complete fallback: ${name}`);
      assert(await field.evaluate(element => document.activeElement === element && element.selectionStart === 0 && element.selectionEnd === element.value.length), `Fallback focused and fully selected: ${name}`);
      const status = await fallbackPage.locator('#page-copy-status').innerText();
      assert(status.includes('Automatic copy is unavailable') && !status.includes('Page copied.'), `Honest fallback status: ${name}`);
    }
    await fallbackPage.screenshot({ path: path.join(output, 'manual-copy-fallback.png'), animations: 'disabled' });
    await denied.close();

    const noScript = await browser.newContext({ javaScriptEnabled: false });
    observe(noScript, 'no-javascript');
    const plain = await noScript.newPage();
    await visit(plain, productURL);
    assert(await plain.getByRole('link', { name: 'Read the manual', exact: false }).isVisible(), 'Product reading route without JavaScript');
    for (const name of chapters) {
      await visit(plain, new URL(name, manualBase).href);
      assert(await plain.locator('.prose').isVisible(), `Readable chapter without JavaScript: ${name}`);
      assert.equal(await plain.locator('nav[aria-label="Chapters"] a').count(), chapters.length);
      assert.equal(await plain.locator('.copy-page').count(), 1, 'Page-copy control is present for enhancement');
      assert(!(await plain.locator('.copy-page').isVisible()), 'No dead copy control without JavaScript');
      const markdownLink = plain.getByRole('link', { name: 'View Markdown', exact: true });
      assert(await markdownLink.isVisible(), `No-JS Markdown route: ${name}`);
      assert.equal(await exportText(noScript, new URL(await markdownLink.getAttribute('href'), plain.url()).href), exports.get(name).text);
    }
    await noScript.close();
    for (const [kind, entries] of Object.entries(errors)) assert.deepEqual(entries, [], `No ${kind} errors`);
    const report = {
      productBase, manualBase, productCanonical: publishedProduct, manualCanonical: publishedManual,
      pages: chapters.length + 1, layoutCases, hostedFontLoadedAndUsed: true,
      exactPageCopies: exports.size, codeCopy, clipboardDeniedFallbacks: chapters.length,
      markdownExports: true, llmsIndex: true, contributionLinks,
      keyboardSkipLinks: 2, themePersistence: true, noJavaScriptPages: chapters.length + 1,
      browserErrors: errors, screenshots: output,
      limits: 'Chromium automation only; no installed-extension, screen-reader, contrast, or cross-browser conformance claim. External GitHub destinations inspected, not visited.',
    };
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    await context.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

// 2026-10-23: created for the product/manual build. Syntax check is separate
// from a browser run; report.json records the outcome of each successful run.

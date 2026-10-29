/**
 * The README's pictures, taken from the demo board.
 *
 *   npm run demo -w pleasenobugs           (in one terminal, keep it running)
 *   npm run screenshots -w pleasenobugs    (in another)
 *
 * Writes docs/images/board-light.png, board-dark.png, owner-answer.png,
 * tiles-nimiq.png and writing.gif. Needs Chrome or Edge (or CHROME=path/to/browser) and, for the
 * animation, ffmpeg on the PATH. Take them again whenever the look changes.
 */
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.DEMO_URL || 'http://localhost:5180/';
const OUT = fileURLToPath(new URL('../../../docs/images/', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BROWSERS = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = BROWSERS.find((p) => fs.existsSync(p));
if (!executablePath) throw new Error('No Chrome or Edge found: set CHROME=path/to/browser');

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--hide-scrollbars'] });

/** The demo page with only the board on it, at phone size. */
async function open(params, { width = 390, height = 760, scale = 2, scheme = 'light' } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: height + 120, deviceScaleFactor: scale });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  await page.goto(BASE + '?' + new URLSearchParams(params), { waitUntil: 'networkidle0' });
  await page.addStyleTag({
    content: `.controls,.note{display:none!important} body{margin:0} .phone{height:${height}px!important;max-width:none!important}`,
  });
  await waitIn(page, '.card');
  await sleep(300);
  return page;
}
/**
 * Waits for something inside the board. Puppeteer's own waitForSelector with
 * `>>>` does not notice what appears in a shadow root later, so this polls.
 */
const waitIn = (page, sel) =>
  page.waitForFunction((s) => document.querySelector('please-no-bugs')?.shadowRoot?.querySelector(s), { polling: 100, timeout: 10_000 }, sel);
const shot = async (page, file) => (await page.$('.phone')).screenshot({ path: file });
// Clicked in the page rather than with the mouse: the floating Top/New pill
// covers the bottom of the list, and a real click lands on it instead.
const click = async (page, sel, i = 0) =>
  (await page.$$('please-no-bugs >>> ' + sel))[i].evaluate((el) => el.click());

// The board, light and dark.
for (const scheme of ['light', 'dark']) {
  const page = await open({ who: 'alice', theme: scheme }, { scheme });
  await shot(page, path.join(OUT, `board-${scheme}.png`));
  await page.close();
}

// The owner answering a bug, with the context it came with.
{
  const page = await open({ who: 'owner', theme: 'light' });
  await click(page, '.sign-in .text-btn');
  await waitIn(page, '.card--owner');
  await sleep(300);
  for (const card of await page.$$('please-no-bugs >>> .card--owner')) {
    if ((await card.evaluate((n) => n.textContent)).includes('Dutch translation')) {
      await card.evaluate((n) => n.click());
      break;
    }
  }
  await waitIn(page, '.sheet');
  await sleep(500);
  await shot(page, path.join(OUT, 'owner-answer.png'));
  await page.close();
}

// The three tiles behind the "+", in the bright theme.
{
  const page = await open({ who: 'alice', theme: 'nimiq' });
  await click(page, '.bar .icon-btn:last-child');
  await waitIn(page, '.tile');
  await sleep(300);
  await shot(page, path.join(OUT, 'tiles-nimiq.png'));
  await page.close();
}

// Writing a wish while a lookalike appears: one frame per keystroke, then
// ffmpeg turns the frames into a GIF with the durations listed here.
{
  const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'pnb-frames-'));
  const page = await open({ who: 'alice', theme: 'light' }, { width: 360, height: 640, scale: 1.5 });
  const list = [];
  let n = 0;
  const frame = async (seconds) => {
    const file = String(n++).padStart(3, '0') + '.png';
    await shot(page, path.join(frames, file));
    list.push(`file '${file}'`, `duration ${seconds}`);
  };

  await frame(2.0);
  await click(page, '.bar .icon-btn:last-child');
  await waitIn(page, '.tile');
  await sleep(200);
  await frame(1.2);
  await click(page, '.tile--idea');
  await waitIn(page, 'textarea.field');
  await sleep(150);
  await frame(0.6);
  // No red squiggles in the picture.
  await (await page.$('please-no-bugs >>> textarea.field')).evaluate((t) => {
    t.spellcheck = false;
    t.focus();
  });
  for (const ch of 'A dark mode for my eyes at night') {
    await page.keyboard.type(ch);
    await sleep(30);
    await frame(0.07);
  }
  await frame(3.5);
  // ffmpeg's concat demuxer ignores the last duration unless the file is repeated.
  list.push(list.at(-2));
  fs.writeFileSync(path.join(frames, 'list.txt'), list.join('\n') + '\n');
  await page.close();

  execFileSync(
    'ffmpeg',
    [
      '-loglevel', 'error', '-y', '-f', 'concat', '-i', 'list.txt',
      '-vf', 'fps=15,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
      '-loop', '0', path.join(OUT, 'writing.gif'),
    ],
    { cwd: frames, stdio: 'inherit' },
  );
  fs.rmSync(frames, { recursive: true, force: true });
}

await browser.close();
console.log(`[screenshots] written to ${OUT}`);

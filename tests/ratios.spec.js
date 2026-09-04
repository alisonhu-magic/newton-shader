/* The composition is designed once, on the 3:1 banner, and scaled from there.
   These tests pin the proportions that have to survive every other shape:
   the headline-to-logo relationship, the logo's own aspect ratio, and the
   promise that nothing spills outside the frame. */
const { test, expect } = require('@playwright/test');
const { open, settle, expandAll, pickSeg, setCanvasSize, commitInput } = require('./helpers');

/* baseline first, then wider, then progressively taller */
const RATIOS = [
  ['3:1  banner',     1920, 640],
  ['2:1  wide',       1920, 960],
  ['16:9 widescreen', 1920, 1080],
  ['4:3  classic',    1440, 1080],
  ['1:1  square',     1080, 1080],
  ['4:5  portrait',   1080, 1350],
  ['9:16 story',      1080, 1920],
];

const LONG_HEAD = 'Policy, enforced before the transaction exists, across every single service that you happen to run today.';

/* Everything is read off the live preview and expressed as a share of the
   frame, so the fitted preview size never enters the assertions. */
const measure = () => ({
  frame: (() => {
    const f = document.getElementById('frame').getBoundingClientRect();
    return { w: f.width, h: f.height, left: f.left, right: f.right, top: f.top, bottom: f.bottom };
  })(),
  logo: (() => {
    const plate = document.querySelector('#logoLayer .scrim');
    if (!plate) return null;
    const box = plate.getBoundingClientRect();
    const svg = plate.querySelector('svg').getBoundingClientRect();
    return { w: box.w, h: box.height, box, drawnAR: svg.width / svg.height };
  })(),
  head: (() => {
    const el = document.getElementById('tHead');
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const size = parseFloat(cs.fontSize);
    return { size, lines: Math.max(1, Math.round(box.height / (parseFloat(cs.lineHeight) || size * 1.2))) };
  })(),
  inner: document.getElementById('txtInner').getBoundingClientRect(),
});

/** Set the canvas to an exact size and let the frame refit. */
async function useRatio(page, w, h) {
  await setCanvasSize(page, w, h);
  await settle(page);
  return page.evaluate(measure);
}

test.beforeEach(async ({ page }) => {
  await open(page);
  await expandAll(page);
  await pickSeg(page, 'lType', 'lockup');
});

test.describe('scaling across aspect ratios', () => {
  test('the headline keeps its size relationship to the logo', async ({ page }) => {
    const seen = [];
    for (const [name, w, h] of RATIOS) {
      const m = await useRatio(page, w, h);
      seen.push([name, m.head.size / m.logo.h]);
    }
    const baseline = seen[0][1];
    for (const [name, ratio] of seen) {
      // a couple of percent of slack absorbs sub-pixel rounding in the frame fit
      expect(ratio / baseline, `${name} headline ÷ logo`).toBeGreaterThan(0.97);
      expect(ratio / baseline, `${name} headline ÷ logo`).toBeLessThan(1.03);
    }
  });

  test('the logo is never stretched', async ({ page }) => {
    const artwork = await page.evaluate(() => window.__NF.logoAR());
    for (const [name, w, h] of RATIOS) {
      const m = await useRatio(page, w, h);
      expect(m.logo.drawnAR / artwork, `${name} logo aspect ratio`).toBeCloseTo(1, 1);
    }
  });

  test('the logo and the copy stay inside the frame', async ({ page }) => {
    for (const [name, w, h] of RATIOS) {
      const m = await useRatio(page, w, h);
      for (const [what, box] of [['logo', m.logo.box], ['copy', m.inner]]) {
        expect(box.left, `${name} ${what} left`).toBeGreaterThanOrEqual(m.frame.left - 1);
        expect(box.right, `${name} ${what} right`).toBeLessThanOrEqual(m.frame.right + 1);
        expect(box.top, `${name} ${what} top`).toBeGreaterThanOrEqual(m.frame.top - 1);
        expect(box.bottom, `${name} ${what} bottom`).toBeLessThanOrEqual(m.frame.bottom + 1);
      }
    }
  });

  test('the headline stays legible against the canvas it sits on', async ({ page }) => {
    for (const [name, w, h] of RATIOS) {
      const m = await useRatio(page, w, h);
      const shortSide = Math.min(m.frame.w, m.frame.h);
      // never so small it disappears, never so large it crowds the frame
      expect(m.head.size / shortSide, `${name} headline ÷ short side`).toBeGreaterThan(0.02);
      expect(m.head.size / m.frame.h, `${name} headline ÷ height`).toBeLessThan(0.25);
    }
  });

  test('long copy still wraps to a readable number of lines', async ({ page }) => {
    await commitInput(page, 'tiHead', LONG_HEAD);
    for (const [name, w, h] of RATIOS) {
      const m = await useRatio(page, w, h);
      expect(m.head.lines, `${name} headline lines`).toBeLessThanOrEqual(12);
      expect(m.inner.bottom, `${name} copy overflows`).toBeLessThanOrEqual(m.frame.bottom + 1);
    }
  });

  test('portrait copy uses a longer measure than the 3:1 banner', async ({ page }) => {
    await commitInput(page, 'tiHead', LONG_HEAD);
    const banner = await useRatio(page, 1920, 640);
    const classic = await useRatio(page, 1440, 1080);
    const portrait = await useRatio(page, 1080, 1350);
    const story = await useRatio(page, 1080, 1920);
    const share = m => m.inner.width / m.frame.w;
    expect(share(classic), '4:3 measure share').toBeGreaterThan(share(banner) + 0.08);
    expect(share(portrait), '4:5 measure share').toBeGreaterThan(share(banner) + 0.10);
    expect(share(story), '9:16 measure share').toBeGreaterThan(0.65);
  });
});

test.describe('layout tokens', () => {
  test('type and logo resolve to their baseline sizes on the 3:1 banner', async ({ page }) => {
    const got = await page.evaluate(() => {
      const N = window.__NF;
      const { w, h } = N.BASELINE;
      return {
        headPctW: N.typePx(3, { scale: 1 }, w, h) / w * 100,
        logoPctH: N.logoHeightPx(w, h) / h * 100,
      };
    });
    expect(got.headPctW).toBeCloseTo(5.0, 6);
    expect(got.logoPctH).toBeCloseTo(5.76, 6);
  });

  test('the 3:1 banner is locked at scale 1', async ({ page }) => {
    const got = await page.evaluate(() => {
      const N = window.__NF;
      const { w, h } = N.BASELINE;
      try { N.BASELINE.w = 1; } catch (e) {}
      try { N.TOKENS.logo.height = 99; } catch (e) {}
      return {
        frozen: Object.isFrozen(N.BASELINE) && Object.isFrozen(N.TOKENS) && Object.isFrozen(N.TOKENS.logo),
        w: N.BASELINE.w,
        logo: N.TOKENS.logo.height,
        scale: N.ratioScale(w, h),
        also: N.ratioScale(3000, 1000),
        locked: N.isLockedBaseline(w, h),
      };
    });
    expect(got.frozen).toBe(true);
    expect(got.w).toBe(1920);
    expect(got.logo).toBe(5.76);
    expect(got.scale).toBe(1);
    expect(got.also).toBe(1);
    expect(got.locked).toBe(true);
  });

  test('a fit-based share scales by the smaller of the two axes', async ({ page }) => {
    const got = await page.evaluate(() => {
      const N = window.__NF;
      const { w, h } = N.BASELINE;
      const at = (W, H) => N.tokenPx(100, 'fitw', W, H) / w;
      return {
        base: at(w, h),
        half: at(w / 2, h),
        tall: at(w, h * 4),
        wide: at(w * 4, h),
      };
    });
    expect(got.base).toBeCloseTo(1, 6);
    expect(got.half).toBeCloseTo(0.5, 6);
    expect(got.tall).toBeCloseTo(1, 6); // extra height buys nothing
    expect(got.wide).toBeCloseTo(1, 6); // extra width buys nothing
  });

  test('4:3 and portrait copy span more columns; 3:1 stays at 7', async ({ page }) => {
    const got = await page.evaluate(() => {
      const N = window.__NF;
      const { w, h } = N.BASELINE;
      const pct = (W, H) => N.spanPx(W, H, N.measureCols(W, H)) / W * 100;
      return {
        bannerCols: N.measureCols(w, h),
        squareCols: N.measureCols(1080, 1080),
        classicCols: N.measureCols(1440, 1080),
        portraitCols: N.measureCols(1080, 1350),
        storyCols: N.measureCols(1080, 1920),
        bannerPct: pct(w, h),
        classicPct: pct(1440, 1080),
        portraitPct: pct(1080, 1350),
        storyPct: pct(1080, 1920),
        squareSpan: N.FORMAT_LAYOUT['1:1'].spanCols,
        classicSpan: N.FORMAT_LAYOUT['4:3'].spanCols,
        tallSpan: N.FORMAT_LAYOUT['9:16'].spanCols,
      };
    });
    expect(got.bannerCols).toBe(7);
    expect(got.squareCols).toBe(got.squareSpan);
    expect(got.classicCols).toBe(got.classicSpan);
    expect(got.portraitCols).toBe(got.tallSpan);
    expect(got.storyCols).toBe(got.tallSpan);
    expect(got.classicPct).toBeGreaterThan(got.bannerPct);
    expect(got.portraitPct).toBeGreaterThan(got.bannerPct + 10);
    expect(got.storyPct).toBeGreaterThan(65);
  });

  test('off-baseline ratios bump type and logo; 3:1 does not', async ({ page }) => {
    const got = await page.evaluate(() => {
      const N = window.__NF;
      const { w, h } = N.BASELINE;
      const head = (W, H) => N.typePx(3, { scale: 1 }, W, H);
      const logo = (W, H) => N.logoHeightPx(W, H);
      const unscaledHead = (W, H) => N.TOKENS.type.steps[3] / 100 * N.refPx(N.TOKENS.type.basis, W, H);
      const unscaledLogo = (W, H) => N.TOKENS.logo.height / 100 * N.refPx(N.TOKENS.logo.basis, W, H);
      return {
        wide: N.SCALE_WIDE,
        screen: N.SCALE_WIDESCREEN,
        classicScale: N.SCALE_CLASSIC,
        square: N.SCALE_SQUARE,
        tall: N.SCALE_TALL,
        baseHead: head(w, h) / unscaledHead(w, h),
        baseLogo: logo(w, h) / unscaledLogo(w, h),
        twoOne: head(1920, 960) / unscaledHead(1920, 960),
        wideHead: head(1920, 1080) / unscaledHead(1920, 1080),
        classicHead: head(1440, 1080) / unscaledHead(1440, 1080),
        squareHead: head(1080, 1080) / unscaledHead(1080, 1080),
        squareLogo: logo(1080, 1080) / unscaledLogo(1080, 1080),
        portrait: head(1080, 1350) / unscaledHead(1080, 1350),
        storyHead: head(1080, 1920) / unscaledHead(1080, 1920),
        oddWide: N.ratioScale(6144, 4096),
      };
    });
    expect(got.baseHead).toBeCloseTo(1, 6);
    expect(got.baseLogo).toBeCloseTo(1, 6);
    expect(got.twoOne).toBeCloseTo(got.wide, 6);
    expect(got.wideHead).toBeCloseTo(got.screen, 6);
    expect(got.classicHead).toBeCloseTo(got.classicScale, 6);
    expect(got.squareHead).toBeCloseTo(got.square, 6);
    expect(got.squareLogo).toBeCloseTo(got.square, 6);
    expect(got.portrait).toBeCloseTo(got.tall, 6);
    expect(got.storyHead).toBeCloseTo(got.tall, 6);
    expect(got.oddWide).toBeCloseTo(got.screen, 6);
  });

  test('setFormatLayout mutates an unlocked format and refuses 3:1', async ({ page }) => {
    const got = await page.evaluate(() => {
      const N = window.__NF;
      const before = N.measureCols(1080, 1920);
      N.setFormatLayout('9:16', { spanCols: 11 });
      const after = N.measureCols(1080, 1920);
      const lockedBefore = { scale: N.FORMAT_LAYOUT['3:1'].scale, spanCols: N.FORMAT_LAYOUT['3:1'].spanCols };
      N.setFormatLayout('3:1', { scale: 9, spanCols: 2 });
      return {
        before,
        after,
        storyCols: N.FORMAT_LAYOUT['9:16'].spanCols,
        lockedScale: N.FORMAT_LAYOUT['3:1'].scale,
        lockedCols: N.FORMAT_LAYOUT['3:1'].spanCols,
        lockedUnchanged: N.FORMAT_LAYOUT['3:1'].scale === lockedBefore.scale
          && N.FORMAT_LAYOUT['3:1'].spanCols === lockedBefore.spanCols,
        stats: N.layoutStats(),
      };
    });
    expect(got.before).toBe(10);
    expect(got.after).toBe(11);
    expect(got.storyCols).toBe(11);
    expect(got.lockedScale).toBe(1);
    expect(got.lockedCols).toBe(7);
    expect(got.lockedUnchanged).toBe(true);
    expect(got.stats.scale).toBe(1);
    expect(got.stats.cols).toBe(7);
  });
});

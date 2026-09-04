const { test, expect } = require('@playwright/test');
const { open, settle, state, setCanvasSize } = require('./helpers');

const FORMATS = [
  ['3:1',  'banner'],
  ['2:1',  'wide'],
  ['16:9', 'widescreen'],
  ['4:3',  'classic'],
  ['1:1',  'square'],
  ['4:5',  'portrait'],
  ['9:16', 'story'],
];

test.describe('canvas size and framing', () => {
  test('the format list includes the marketing ratios plus custom size', async ({ page }) => {
    await open(page);
    const vals = await page.locator('#format option').evaluateAll(os => os.map(o => o.value));
    expect(vals).toEqual([...FORMATS.map(([id]) => id), 'custom']);
    expect(await page.locator('#cw').count()).toBe(1);
    expect(await page.locator('#ch').count()).toBe(1);
  });

  test('custom width and height set the export size', async ({ page }) => {
    await open(page);
    await page.locator('#cw').fill('1280');
    await page.locator('#cw').dispatchEvent('change');
    await page.locator('#ch').fill('720');
    await page.locator('#ch').dispatchEvent('change');
    await settle(page);
    const s = await state(page);
    expect(s.canvasW).toBe(1280);
    expect(s.canvasH).toBe(720);
    expect(await page.locator('#format').inputValue()).toBe('custom');
    expect(await page.textContent('#exportSize')).toMatch(/1280/);
  });

  test('every preset keeps the frame inside the stage', async ({ page }) => {
    await open(page);
    for (const [value, name] of FORMATS) {
      await page.selectOption('#format', value);
      await settle(page);
      const box = await page.evaluate(() => {
        const f = document.getElementById('frame').getBoundingClientRect();
        const w = document.querySelector('.canvas-wrap').getBoundingClientRect();
        return {
          overflowsX: f.width - w.width > 1,
          overflowsY: f.height - w.height > 1,
          pageScrolls: document.documentElement.scrollHeight - window.innerHeight > 1,
          offTop: f.top < -1,
          offBottom: f.bottom - window.innerHeight > 1,
        };
      });
      expect(box, `format ${name}`).toEqual({
        overflowsX: false, overflowsY: false, pageScrolls: false, offTop: false, offBottom: false,
      });
    }
  });

  test('frame aspect matches the requested dimensions', async ({ page }) => {
    await open(page);
    for (const [value] of FORMATS) {
      await page.selectOption('#format', value);
      await settle(page);
      const r = await page.evaluate(() => {
        const S = window.__NF.S;
        const f = document.getElementById('frame').getBoundingClientRect();
        return { want: S.canvasW / S.canvasH, got: f.width / f.height };
      });
      expect(r.got).toBeCloseTo(r.want, 1);
    }
  });

  test('the stage footer stays on screen for the tallest format', async ({ page }) => {
    await open(page);
    await page.selectOption('#format', '9:16');
    await settle(page);
    const r = await page.evaluate(() => {
      const f = document.querySelector('.stagefoot').getBoundingClientRect();
      return { top: f.top, bottom: f.bottom, height: f.height, vh: window.innerHeight };
    });
    expect(r.height).toBeGreaterThan(0);
    expect(r.top).toBeGreaterThanOrEqual(-1);
    expect(r.bottom).toBeLessThanOrEqual(r.vh + 1);
  });

  test('the export button is reachable by scrolling the rail, not the page', async ({ page }) => {
    await open(page);
    await page.selectOption('#format', '9:16');
    await settle(page);
    await page.locator('#exportBtn').scrollIntoViewIfNeeded();
    await expect(page.locator('#exportBtn')).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('the footer readout follows the current size', async ({ page }) => {
    await open(page);
    await page.selectOption('#format', '1:1');
    await settle(page);
    expect(await page.textContent('#pngSize')).toBe('1080×1080');
    expect(await page.textContent('#exportSize')).toMatch(/1080\s*×\s*1080/);
  });

  test('every preset stays within the pixel budget', async ({ page }) => {
    await open(page);
    const { areaMax } = await page.evaluate(() => window.__NF.limits());
    for (const [value, name] of FORMATS) {
      await page.selectOption('#format', value);
      await settle(page);
      const s = await state(page);
      expect(s.canvasW * s.canvasH, `format ${name}`).toBeLessThanOrEqual(areaMax);
    }
  });

  test('the drawing buffer never exceeds the WebGL viewport limit', async ({ page }) => {
    await open(page);
    await setCanvasSize(page, 8192, 8192);
    await settle(page);
    const ok = await page.evaluate(() => {
      const c = document.getElementById('gl');
      const gl = c.getContext('webgl2');
      const [mw, mh] = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      return c.width <= mw && c.height <= mh;
    });
    expect(ok).toBe(true);
  });
});

test.describe('preview fit', () => {
  const frameW = page => page.evaluate(() => document.getElementById('frame').getBoundingClientRect().width);

  test('fits the stage and the footer reports the scale', async ({ page }) => {
    await open(page);
    await settle(page);
    const s = await state(page);
    const pct = Math.round((await frameW(page)) / s.canvasW * 100);
    expect(await page.textContent('#zoomOut')).toBe(`${pct}%`);
    expect(pct).toBeLessThan(100);   // 1920 wide never fits the stage 1:1
  });

  test('the frame stays inside the stage', async ({ page }) => {
    await open(page);
    await settle(page);
    const r = await page.evaluate(() => {
      const f = document.getElementById('frame').getBoundingClientRect();
      const w = document.querySelector('.canvas-wrap');
      return { overflowsX: f.width - w.clientWidth > 1, scrollable: w.scrollWidth - w.clientWidth > 1 };
    });
    expect(r).toEqual({ overflowsX: false, scrollable: false });
  });

  test('the drawing buffer stays inside the driver limits on a huge frame', async ({ page }) => {
    await open(page);
    await setCanvasSize(page, 8192, 640);
    await settle(page);
    const ok = await page.evaluate(() => {
      const c = document.getElementById('gl');
      const gl = c.getContext('webgl2');
      const [mw, mh] = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      return c.width > 0 && c.height > 0 && c.width <= mw && c.height <= mh;
    });
    expect(ok).toBe(true);
  });
});


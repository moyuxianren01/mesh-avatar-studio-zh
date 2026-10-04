import { test, expect, type Page } from '@playwright/test';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import fixture from '../samples/miko-qipao/rig.json' with { type: 'json' };
import { dismissGuide, samplePresent, sampleSkipReason } from './sample';

let directory: string, name: string;
test.beforeEach(async ({ page }) => {
  test.skip(!samplePresent, sampleSkipReason);
  await mkdir(resolve('projects'), { recursive: true });
  directory = await mkdtemp(join(resolve('projects'), 'integer-check-')); name = basename(directory);
  await cp(resolve('samples/miko-qipao'), directory, { recursive: true });
  await page.goto('/'); await dismissGuide(page);
  await page.locator('.open-menu > summary').click(); await page.getByTestId(`project-${name}`).click();
  await expect(page.getByTestId('preview-status')).toHaveAttribute('data-state', 'ready');
});
test.afterEach(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });
async function point(page: Page, x: number, y: number) {
  return page.getByTestId('editor').evaluate((canvas, point) => {
    const box = canvas.getBoundingClientRect(), scale = Number(canvas.dataset.scale);
    return { x: box.x + Number(canvas.dataset.offsetX) + point.x * scale, y: box.y + Number(canvas.dataset.offsetY) + point.y * scale };
  }, { x, y });
}
async function drag(page: Page, from: [number, number], to: [number, number]) {
  const start = await point(page, ...from), end = await point(page, ...to);
  await page.mouse.move(start.x, start.y); await page.mouse.down(); await page.mouse.move(end.x, end.y, { steps: 3 }); await page.mouse.up();
}

test('accessory dragging and numeric input save integer boxes and the real rebuild succeeds', async ({ page }) => {
  test.setTimeout(90000);
  await page.getByTestId('part-accessories').click();
  const box = fixture.accessories[1].box;
  await drag(page, [box[2], box[3]], [1075.9, 482.7]);
  await page.getByText('Cut-out box (4)', { exact: true }).click();
  const x = page.getByRole('spinbutton', { name: 'accessories.1.box.2', exact: true });
  const y = page.getByRole('spinbutton', { name: 'accessories.1.box.3', exact: true });
  await expect(x).toHaveValue('1076'); await expect(y).toHaveValue('483'); await expect(x).toHaveAttribute('step', '1');
  await x.fill('1075.9'); await expect(x).toHaveValue('1076');
  await y.fill('482.7'); await expect(y).toHaveValue('483');
  await page.getByRole('button', { name: 'Save and rebuild layers', exact: true }).click();
  await expect(page.getByTestId('stale-banner')).toHaveCount(0, { timeout: 60000 });
  const saved = JSON.parse(await readFile(join(directory, 'rig.json'), 'utf8'));
  expect(saved.accessories[1].box).toEqual([box[0], box[1], 1076, 483]);
  await expect(page.getByTestId('preview-status')).toHaveAttribute('data-state', 'ready');
});

test('mesh cell sizes and fine rectangle coordinates are integers while other fields retain decimals', async ({ page }) => {
  await page.locator('.advanced-section > summary').click(); await page.getByTestId('part-mesh').click();
  for (const key of ['baseCell', 'handCell', 'tasselCell', 'eyeBallCell', 'eyeCell', 'spriteCell']) {
    const field = page.getByRole('spinbutton', { name: `mesh.${key}`, exact: true });
    await expect(field).toHaveAttribute('step', '1'); await field.fill('7.6'); await expect(field).toHaveValue('8');
  }
  await drag(page, [fixture.mesh.fine.x1, fixture.mesh.fine.y1], [880.3, 760.8]);
  await expect(page.getByRole('spinbutton', { name: 'mesh.fine.x1', exact: true })).toHaveValue('880');
  await expect(page.getByRole('spinbutton', { name: 'mesh.fine.y1', exact: true })).toHaveValue('761');
  const cell = page.getByRole('spinbutton', { name: 'mesh.fine.cell', exact: true }); await cell.fill('6.6'); await expect(cell).toHaveValue('7');
  await page.getByTestId('part-head').click();
  const head = page.getByRole('spinbutton', { name: 'head.cx', exact: true }); await expect(head).toHaveAttribute('step', '0.1');
  await head.fill('615.4'); await head.blur(); await expect(head).toHaveValue('615.4');
  await page.getByRole('button', { name: 'Save rig', exact: true }).click();
  await expect.poll(async () => JSON.parse(await readFile(join(directory, 'rig.json'), 'utf8')).head.cx).toBe(615.4);
});

test('rebuild errors explain the part and correction in both languages while retaining the raw log', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByTestId('part-head').click(); await page.getByRole('spinbutton', { name: 'head.cx', exact: true }).fill('635');
  const log = 'build-layers: accessories[1].box has no area inside the image';
  await page.route(`**/__studio/projects/${name}/rebuild`, route => route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ code: 'toolFailed', log }) }));
  await page.getByRole('button', { name: 'Save and rebuild layers', exact: true }).click();
  const feedback = page.getByTestId('stale-banner').getByTestId('job-feedback');
  await expect(feedback.getByRole('alert')).toContainText('Accessory 2 (tassel_r)');
  await expect(feedback.getByRole('alert')).toContainText('no width or height inside the image');
  await expect(feedback.getByRole('alert')).not.toContainText('build-layers:');
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(feedback.getByRole('alert')).toContainText('饰品 2 (tassel_r) 的裁剪框没有宽或高');
  await feedback.getByText('显示日志', { exact: true }).click(); await expect(feedback.locator('pre')).toHaveText(log);
  await page.unroute(`**/__studio/projects/${name}/rebuild`);
  const validation = 'Invalid rig: rig.accessories[1].box: rectangle must stay inside the image';
  await page.route(`**/__studio/projects/${name}/rebuild`, route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: validation }) }));
  await page.getByRole('button', { name: '保存してレイヤーを作り直す', exact: true }).click();
  await expect(feedback.getByRole('alert')).toContainText('飾り 2 (tassel_r) の切り抜き範囲が画像の外');
  await expect(feedback.getByRole('alert')).not.toContainText('PNG');
  await feedback.locator('details').evaluate(element => { (element as HTMLDetailsElement).open = false; });
  await page.screenshot({ path: 'docs/screenshots/ui8-rebuild-error-zh-1440x900.png' });
});

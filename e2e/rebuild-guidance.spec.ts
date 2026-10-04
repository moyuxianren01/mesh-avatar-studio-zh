import { test, expect, type Page } from '@playwright/test';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { dismissGuide, samplePresent, sampleSkipReason } from './sample';

async function editHead(page: Page) {
  await page.getByTestId('part-head').click();
  const field = page.getByRole('spinbutton', { name: 'head.cx', exact: true });
  await field.fill('635');
  await expect(page.getByTestId('stale-banner')).toBeVisible();
  return field;
}

test('sample copy preserves edits and undo, protects the original and enables a real rebuild', async ({ page }) => {
  test.skip(!samplePresent, sampleSkipReason); test.setTimeout(90000);
  const sourceFiles = ['rig.json', 'source.png', 'built/base.png', 'built/layers.json'];
  const originals = await Promise.all(sourceFiles.map(file => readFile(resolve('samples/miko-qipao', file))));
  let copiedName = '';
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/'); await dismissGuide(page);
    const field = await editHead(page), banner = page.getByTestId('stale-banner');
    await expect(banner).toContainText('The sample is read-only');
    await expect(banner.getByRole('button', { name: 'Save and rebuild layers', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: '中文', exact: true }).click();
    await expect(banner).toContainText('只读项目');
    await page.screenshot({ path: 'docs/screenshots/ui7-sample-guidance-zh-1440x900.png' });
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/__studio/copy-sample', async route => { await gate; await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }); });
    await banner.getByRole('button', { name: 'コピーして編集を続ける', exact: true }).click();
    try {
      await expect(page.getByRole('button', { name: '元に戻す', exact: true })).toBeDisabled();
      await expect(page.getByRole('button', { name: '設定を保存', exact: true })).toBeDisabled();
    } finally { release(); }
    await expect(banner.getByRole('alert')).toContainText('今の編集内容は残っています'); await expect(field).toHaveValue('635');
    await page.unroute('**/__studio/copy-sample');
    const response = page.waitForResponse(response => response.url().endsWith('/__studio/copy-sample'));
    await banner.getByRole('button', { name: 'コピーして編集を続ける', exact: true }).click();
    const entry = await (await response).json(); copiedName = entry.name;
    await expect(page.getByTestId('project-location').locator('strong')).toHaveText(copiedName);
    await expect(field).toHaveValue('635'); await expect(page.getByTestId('preview-status')).toHaveAttribute('data-state', 'ready');
    expect(JSON.parse(await readFile(resolve('projects', copiedName, 'rig.json'), 'utf8')).head.cx).toBe(635);
    for (const file of ['source.png', 'built/base.png', 'built/layers.json']) expect(await readFile(resolve('projects', copiedName, file))).toEqual(originals[sourceFiles.indexOf(file)]);
    await page.getByRole('button', { name: '元に戻す', exact: true }).click(); await expect(field).toHaveValue('615');
    await page.getByRole('button', { name: 'やり直す', exact: true }).click(); await expect(field).toHaveValue('635');
    await banner.getByRole('button', { name: '保存してレイヤーを作り直す', exact: true }).click();
    await expect(banner).toHaveCount(0, { timeout: 60000 });
    await expect(page.getByTestId('preview-status')).toHaveAttribute('data-state', 'ready'); await expect(field).toHaveValue('635');
    for (let index = 0; index < sourceFiles.length; index++) expect(await readFile(resolve('samples/miko-qipao', sourceFiles[index]))).toEqual(originals[index]);
  } finally { if (copiedName) await rm(resolve('projects', copiedName), { recursive: true, force: true }); }
});

test('a picked folder can reopen a matching listed project without discarding edits', async ({ page }) => {
  test.skip(!samplePresent, sampleSkipReason);
  await mkdir(resolve('projects'), { recursive: true });
  const directory = await mkdtemp(join(resolve('projects'), 'reopen-check-'));
  try {
    await cp(resolve('samples/miko-qipao'), directory, { recursive: true });
    const original = await readFile(join(directory, 'rig.json'));
    await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/'); await dismissGuide(page);
    await page.getByLabel('Open project folder files', { exact: true }).setInputFiles(directory);
    const field = await editHead(page), banner = page.getByTestId('stale-banner');
    await expect(banner).toContainText('This project is available in the project list.');
    await expect(banner).toContainText('browser cannot identify this folder');
    await page.getByRole('button', { name: '中文', exact: true }).click();
    await expect(banner).toContainText('这个项目可以在列表中打开');
    await page.screenshot({ path: 'docs/screenshots/ui7-picked-guidance-zh-1440x900.png' });
    await banner.getByRole('button', { name: '一覧から開き直す', exact: true }).click();
    await expect(banner.getByRole('button', { name: '保存してレイヤーを作り直す', exact: true })).toBeEnabled();
    await expect(field).toHaveValue('635'); await expect(page.getByTestId('preview-status')).toHaveAttribute('data-state', 'ready');
    expect(await readFile(join(directory, 'rig.json'))).toEqual(original);
    await page.getByRole('button', { name: '設定を保存', exact: true }).click();
    await expect.poll(async () => JSON.parse(await readFile(join(directory, 'rig.json'), 'utf8')).head.cx).toBe(635);
    await page.getByRole('button', { name: '元に戻す', exact: true }).click(); await expect(field).toHaveValue('615');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('unmatched picked folders retain a short manual instruction and explain why rebuild is unavailable', async ({ page }) => {
  test.skip(!samplePresent, sampleSkipReason);
  await page.route('**/__studio/projects', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.goto('/'); await dismissGuide(page);
  await page.getByLabel('Open project folder files', { exact: true }).setInputFiles(resolve('samples/miko-qipao'));
  await editHead(page); const banner = page.getByTestId('stale-banner');
  await expect(banner).toContainText('browser cannot identify this folder'); await expect(banner).toContainText('run build-layers');
  await expect(banner.getByRole('button')).toHaveCount(0);
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(banner).toContainText('无法获取'); await expect(banner).toContainText('在该文件夹运行 build-layers');
});

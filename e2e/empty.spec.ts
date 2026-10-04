import { expect, test } from '@playwright/test';

test('missing sample images show an empty workspace with project opening controls', async ({ page }) => {
  await page.route('**/miko-qipao/**', route => {
    if (new URL(route.request().url()).pathname.endsWith('.png')) return route.fulfill({ status: 404, body: '' });
    return route.continue();
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Open a project', exact: true })).toBeVisible();
  await expect(page.getByText('Choose a project from Open project, or browse for its folder. Sample images are installed separately.')).toBeVisible();
  await expect(page.getByTestId('ask-agent-new')).toContainText('Open Codex in this repository folder');
  await page.locator('.open-menu > summary').click();
  await expect(page.getByRole('button', { name: 'Load rig.json only…', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Browse for a project folder…', exact: true })).toBeEnabled();
  await expect(page.getByTestId('preview')).toHaveCount(0);
  await page.screenshot({ path: 'docs/screenshots/empty-workspace.png' });
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await expect(page.getByTestId('ask-agent-new')).toContainText('在这个仓库文件夹中打开 Codex');
  await page.screenshot({ path: 'docs/screenshots/empty-workspace-zh.png' });
});

import { expect, test } from '@playwright/test';

const messages = {
  en: { unreadable: 'Cannot read this project.', missing: 'Required files are missing.', read: 'A file or folder could not be read.' },
  ja: { unreadable: 'このプロジェクトは読み取れません。', missing: '必要なファイルが足りません。', read: 'ファイルまたはフォルダを読み取れませんでした。' },
  zh: { unreadable: '无法读取此项目。', missing: '缺少必需文件。', read: '无法读取文件或文件夹。' },
};

for (const language of ['en', 'ja', 'zh'] as const) {
  test(`unreadable projects remain visible and disabled in the list and history (${language})`, async ({ page }, testInfo) => {
    await page.addInitScript(language => {
      localStorage.setItem('mesh-avatar-language', language);
      localStorage.setItem('mesh-avatar-guide-seen', '1');
      localStorage.setItem('mesh-avatar-recent-projects', JSON.stringify([{ id: 'server:locked-project', name: 'locked-project', serverName: 'locked-project', relativePath: 'projects/locked-project', kind: 'server', lastOpened: '2026-01-01T00:00:00Z' }]));
    }, language);
    const opened: string[] = [];
    page.on('request', request => { if (request.url().includes('/__studio/projects/locked-project/')) opened.push(request.url()); });
    await page.route('**/__studio/projects', async route => {
      const response = await route.fetch();
      const sample = (await response.json()).filter((entry: { name: string }) => entry.name === 'sample-miko-qipao');
      await route.fulfill({ json: [...sample, { name: 'locked-project', relativePath: 'projects/locked-project', readOnly: false, error: { code: 'EACCES', path: 'projects/locked-project/rig.json' } }] });
    });
    await page.goto('/');
    await page.locator('.open-menu > summary').click();
    const blocked = page.getByTestId('project-locked-project');
    await expect(blocked).toBeDisabled();
    await expect(blocked).toContainText(messages[language].unreadable);
    await expect(blocked).toContainText('EACCES');
    await expect(blocked).toContainText('projects/locked-project/rig.json');
    await expect(blocked).not.toContainText('Invalid Date');
    await expect(page.getByTestId('recent-server:locked-project')).toBeDisabled();
    expect(opened).toEqual([]);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mesh-avatar-recent-projects')!).length)).toBe(1);
    await testInfo.attach('project-menu', { body: await page.locator('.project-menu').screenshot(), contentType: 'image/png' });
    const sample = page.getByTestId('project-sample-miko-qipao');
    if (await sample.count()) {
      await expect(sample).toBeEnabled();
      await sample.click();
      await expect(page.getByTestId('project-location')).toBeVisible();
      await expect(page.getByTestId('preview-status')).toHaveAttribute('data-state', 'ready');
    }
  });

  test(`folder picker distinguishes missing files from unreadable files (${language})`, async ({ page }, testInfo) => {
    await page.addInitScript(language => {
      localStorage.setItem('mesh-avatar-language', language);
      localStorage.setItem('mesh-avatar-guide-seen', '1');
      let attempt = 0;
      Object.defineProperty(window, 'showDirectoryPicker', { value: async () => {
        const current = attempt++;
        return { name: 'locked-project', async *values() {
          if (current === 0) return;
          yield { kind: 'file', name: 'source.png', getFile: async () => new File(['image'], 'source.png') };
          yield { kind: 'directory', name: 'built', async *values() {
            yield { kind: 'file', name: 'layers.json', getFile: async () => {
              if (current === 1) throw new DOMException('File locked', 'NotReadableError');
              const file = new File(['{"layers":{}}'], 'layers.json');
              Object.defineProperty(file, 'arrayBuffer', { value: async () => { throw new DOMException('File locked', 'NotReadableError'); } });
              return file;
            } };
          } };
        } };
      } });
    }, language);
    await page.goto('/');
    const alert = page.locator('p.error[role="alert"]');
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.locator('.open-menu > summary').click();
      await page.locator('.project-menu > button').first().click();
      await expect(alert).toContainText(attempt === 0 ? messages[language].missing : messages[language].read);
      if (attempt > 0) {
        await expect(alert).not.toContainText(messages[language].missing);
        await expect(alert).toContainText('built/layers.json');
      }
      await expect(page.getByTestId('project-location')).toHaveCount(0);
    }
    await testInfo.attach('folder-read-error', { body: await alert.screenshot(), contentType: 'image/png' });
  });
}

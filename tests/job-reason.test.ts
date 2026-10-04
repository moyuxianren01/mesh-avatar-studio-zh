import { expect, test, vi } from 'vitest';
import fixture from '../samples/miko-qipao/rig.json';
import { jobReason } from '../src/editor/job-reason';
import { workflowEn, workflowZh } from '../src/editor/workflow-i18n';
import { runProjectJob, type LocalProject } from '../src/editor/project';
import { parseRig } from '../src/rig/validate';

test('tool geometry failures name the part and correction in each language, ignoring successful rounding logs', () => {
  const rig = parseRig(fixture), en = { ...workflowEn, accessory: 'Accessory' }, zh = { ...workflowZh, accessory: '饰品' };
  const outside = 'Invalid rig: rig.accessories[1].box: rectangle must stay inside the image';
  expect(jobReason(outside, en, rig)).toContain('Accessory 2 (tassel_r)');
  expect(jobReason(outside, zh, rig)).toContain('饰品 2 (tassel_r) 的裁剪框超出了图片范围');
  expect(jobReason('build-layers: accessories[1].box must be an integer rectangle inside the image', zh, rig)).toContain('4 个整数坐标');
  expect(jobReason('build-layers: accessories[1].box has no area inside the image', zh, rig)).toContain('没有宽或高');
  expect(jobReason('accessories[1].box rounded outward and clipped: [1,2,3.4,5] -> [1,2,4,5]', zh, rig)).toBeUndefined();
  expect(jobReason('build-layers: accessory tassel_r: no pixels match its box and color thresholds', zh)).toContain('颜色条件');
  expect(jobReason('build-layers: eyes[0].opening: points must be within source.png', zh)).toContain('眼睛 1');
  expect(jobReason('build-layers: rig.image must match source.png dimensions', zh)).toContain('原图尺寸');
});


test('rebuild validation errors remain geometry failures rather than image-import failures', async () => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: 'Invalid rig: rig.accessories[1].box: rectangle must stay inside the image' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
  try {
    const project = { name: 'nova' } as LocalProject;
    await expect(runProjectJob(project, 'rebuild', parseRig(fixture))).rejects.toMatchObject({ code: 'toolFailed', log: expect.stringContaining('accessories[1].box') });
  } finally { vi.unstubAllGlobals(); }
});

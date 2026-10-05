import { afterEach, expect, test, vi } from 'vitest';
import { openProjectFolder } from '../src/editor/project';
import { directoryFiles, type ProjectDirectory } from '../src/editor/recent-projects';
import { FolderOpenError, folderOpenError } from '../src/editor/folder-errors';

afterEach(() => vi.restoreAllMocks());
function files() {
  return ['source.png', 'built/layers.json', 'built/base.png', 'built/hairmask.png', 'built/head.png'].map(path => {
    const file = new File([path.endsWith('.json') ? '{"layers":{"head":{}}}' : 'synthetic bytes'], path.split('/').at(-1)!);
    Object.defineProperty(file, 'webkitRelativePath', { value: `nova/${path}` });
    return file;
  });
}

test('missing files identify what is absent', async () => {
  await expect(openProjectFolder([])).rejects.toMatchObject({ kind: 'missingFolderFiles', paths: ['source.png', 'layers.json'] });
  await expect(openProjectFolder(files().filter(file => file.name !== 'head.png'))).rejects.toMatchObject({ kind: 'missingFolderFiles', paths: ['built/head.png'] });
});

for (const name of ['layers.json', 'source.png', 'head.png']) test(`an existing unreadable ${name} is reported before creating object URLs`, async () => {
  const entries = files(), file = entries.find(file => file.name === name)!;
  vi.spyOn(file, 'arrayBuffer').mockRejectedValue(new DOMException('Locked', 'NotReadableError'));
  const create = vi.spyOn(URL, 'createObjectURL');
  await expect(openProjectFolder(entries)).rejects.toMatchObject({ kind: 'unreadableFolder', paths: [file.webkitRelativePath.slice('nova/'.length)] });
  expect(create).not.toHaveBeenCalled();
});

test('readable files still produce usable source and asset URLs', async () => {
  const result = await openProjectFolder(files());
  try {
    expect(Object.keys(result.assets)).toEqual(['layers.json', 'base.png', 'hairmask.png', 'head.png']);
    expect(await (await fetch(result.sourceUrl)).text()).toBe('synthetic bytes');
    expect(await (await fetch(result.assets['layers.json'])).json()).toEqual({ layers: { head: {} } });
  } finally { result.urls.forEach(url => URL.revokeObjectURL(url)); }
});

test('malformed metadata remains a format error and permissions are separate from missing files', async () => {
  const entries = files();
  vi.spyOn(entries[1], 'arrayBuffer').mockResolvedValue(new TextEncoder().encode('{bad json').buffer);
  try { await openProjectFolder(entries); throw new Error('Expected invalid JSON'); }
  catch (error) { expect(error).toBeInstanceOf(SyntaxError); expect(folderOpenError(error).kind).toBe('invalidFolder'); }
  for (const name of ['NotReadableError', 'NotAllowedError', 'SecurityError']) expect(folderOpenError(new DOMException('', name)).kind).toBe('unreadableFolder');
  expect(folderOpenError(new DOMException('', 'NotFoundError')).kind).toBe('missingFolderFiles');
  expect(folderOpenError(new FolderOpenError('unreadableFolder', ['built/head.png'])).paths).toEqual(['built/head.png']);
});

test('directory handles preserve the unreadable file or subdirectory path', async () => {
  const handle = { name: 'nova', async *values() {
    yield { kind: 'file', name: 'source.png', getFile: async () => { throw new DOMException('Denied', 'NotReadableError'); } };
  } } as unknown as ProjectDirectory;
  await expect(directoryFiles(handle)).rejects.toMatchObject({ kind: 'unreadableFolder', paths: ['nova/source.png'] });
  const nested = { name: 'nova', async *values() {
    yield { kind: 'directory', name: 'built', values() { throw new DOMException('Denied', 'NotAllowedError'); } };
  } } as unknown as ProjectDirectory;
  await expect(directoryFiles(nested)).rejects.toMatchObject({ kind: 'unreadableFolder', paths: ['nova/built'] });
});

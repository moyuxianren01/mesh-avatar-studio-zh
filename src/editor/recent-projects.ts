import { readPreference, savePreference } from './preferences';
import { FolderOpenError } from './folder-errors';

export const RECENT_KEY = 'mesh-avatar-recent-projects';
export const REOPEN_KEY = 'mesh-avatar-reopen-project';
export interface RecentProject {
  id: string;
  name: string;
  relativePath: string;
  lastOpened: string;
  kind: 'server' | 'folder';
  serverName?: string;
  hasHandle?: boolean;
}
export function readRecent(): RecentProject[] {
  try {
    const value: unknown = JSON.parse(readPreference(RECENT_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is RecentProject => entry && typeof entry.id === 'string' && typeof entry.name === 'string'
      && typeof entry.relativePath === 'string' && typeof entry.lastOpened === 'string' && Number.isFinite(Date.parse(entry.lastOpened))
      && (entry.kind === 'folder' || (entry.kind === 'server' && typeof entry.serverName === 'string'))).slice(0, 10);
  } catch { return []; }
}
export function addRecent(current: RecentProject[], entry: RecentProject) {
  return [entry, ...current.filter(item => item.id !== entry.id)].slice(0, 10);
}
export function saveRecent(value: RecentProject[]) { savePreference(RECENT_KEY, JSON.stringify(value)); }

export type ProjectDirectory = FileSystemDirectoryHandle & {
  queryPermission(options: { mode: 'read' }): Promise<PermissionState>;
  requestPermission(options: { mode: 'read' }): Promise<PermissionState>;
  values(): AsyncIterable<FileSystemDirectoryHandle | FileSystemFileHandle>;
};
export function hasDirectoryPicker() { return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function'; }
export function pickDirectory(): Promise<ProjectDirectory> {
  return (window as unknown as { showDirectoryPicker(options: { mode: 'read' }): Promise<ProjectDirectory> }).showDirectoryPicker({ mode: 'read' });
}
export async function directoryFiles(handle: ProjectDirectory): Promise<File[]> {
  const files: File[] = [];
  const read = async (entry: FileSystemFileHandle, path: string) => {
    try {
      const file = await entry.getFile();
      Object.defineProperty(file, 'webkitRelativePath', { value: path }); files.push(file);
    } catch (error) {
      throw new FolderOpenError(error instanceof DOMException && error.name === 'NotFoundError' ? 'missingFolderFiles' : 'unreadableFolder', [path]);
    }
  };
  async function walk(directory: ProjectDirectory, prefix: string) {
    try {
      for await (const entry of directory.values()) {
        const path = `${prefix}/${entry.name}`;
        if (entry.kind === 'directory') await walk(entry as ProjectDirectory, path);
        else await read(entry as FileSystemFileHandle, path);
      }
    } catch (error) {
      if (error instanceof FolderOpenError) throw error;
      throw new FolderOpenError('unreadableFolder', [prefix]);
    }
  }
  // Read only the files the editor uses, not scratch images or unrelated project documents.
  for await (const entry of handle.values()) {
    if (entry.kind === 'directory' && entry.name === 'built') await walk(entry as ProjectDirectory, `${handle.name}/built`);
    else if (entry.kind === 'file' && ['rig.json', 'source.png'].includes(entry.name)) {
      await read(entry as FileSystemFileHandle, `${handle.name}/${entry.name}`);
    }
  }
  return files;
}
async function handleStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  let db: IDBDatabase | undefined;
  try {
    db = await new Promise<IDBDatabase>((done, reject) => {
      const request = indexedDB.open('mesh-avatar-project-handles', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('directories');
      request.onerror = () => reject(request.error); request.onsuccess = () => done(request.result);
    });
    return await new Promise<T>((done, reject) => {
      const tx = db!.transaction('directories', mode), request = operation(tx.objectStore('directories'));
      tx.oncomplete = () => done(request.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  } catch { return undefined; }
  finally { db?.close(); }
}
export async function keepDirectory(id: string, handle: ProjectDirectory) { return (await handleStore('readwrite', store => store.put(handle, id))) !== undefined; }
export function restoreDirectory(id: string) { return handleStore<ProjectDirectory>('readonly', store => store.get(id)); }
export function forgetDirectory(id: string) { return handleStore('readwrite', store => store.delete(id)); }
export function clearDirectories() { return handleStore('readwrite', store => store.clear()); }

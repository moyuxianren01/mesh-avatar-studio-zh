export class FolderOpenError extends Error {
  constructor(public kind: 'missingFolderFiles' | 'unreadableFolder', public paths: string[] = []) { super(kind); }
}

export function folderOpenError(error: unknown): { kind: 'missingFolderFiles' | 'unreadableFolder' | 'invalidFolder'; paths: string[] } {
  if (error instanceof FolderOpenError) return error;
  if (error instanceof DOMException) {
    if (['NotReadableError', 'NotAllowedError', 'SecurityError'].includes(error.name)) return { kind: 'unreadableFolder', paths: [] };
    if (error.name === 'NotFoundError') return { kind: 'missingFolderFiles', paths: [] };
  }
  return { kind: 'invalidFolder', paths: [] };
}

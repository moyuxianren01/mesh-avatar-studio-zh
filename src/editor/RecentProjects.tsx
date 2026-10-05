import { useI18n } from './i18n';
import type { LocalProjectEntry } from './project';
import type { RecentProject } from './recent-projects';

export function RecentProjects({ recent, projects, reopen, onOpen, onRemove, onClear, onReopen }: {
  recent: RecentProject[]; projects: LocalProjectEntry[] | null; reopen: boolean;
  onOpen(entry: RecentProject): void; onRemove(id: string): void; onClear(): void; onReopen(value: boolean): void;
}) {
  const { t, locale } = useI18n();
  return <section className="recent-projects" aria-label={t.recent}>
    <div className="recent-heading"><h3>{t.recent}</h3>{recent.length > 0 && <button onClick={onClear}>{t.clearHistory}</button>}</div>
    {recent.length === 0 && <p className="recent-empty">{t.noRecent}</p>}
    <div className="recent-list">{recent.map(entry => {
      const browse = entry.kind === 'folder' ? !entry.hasHandle : !projects?.some(item => item.name === entry.serverName);
      const failure = entry.kind === 'server' ? projects?.find(item => item.name === entry.serverName)?.error : undefined;
      return <div key={entry.id} className="recent-row">
        <button data-testid={`recent-${entry.id}`} className={failure ? 'unreadable-project' : undefined} disabled={!!failure} onClick={() => onOpen(entry)}>
          <strong>{entry.serverName === 'sample-miko-qipao' ? t.sampleProject : entry.name}</strong>
          <small>{entry.relativePath} · {new Date(entry.lastOpened).toLocaleString(locale)}</small>
          {failure && <small>{t.unreadableProject} ({failure.code}) · {failure.path}</small>}
          {browse && <small>{t.browseAgain}</small>}
        </button><button className="remove-recent" aria-label={`${t.removeRecent} ${entry.name}`} onClick={() => onRemove(entry.id)}>×</button>
      </div>;
    })}</div>
    <label className="reopen-setting"><input type="checkbox" checked={reopen} onChange={event => onReopen(event.target.checked)} />{t.reopenLast}</label>
  </section>;
}

import type { Curriculum, ProgressV4, ToolCard } from './types';
import { completed, parseBackup, STORAGE_KEY, stopsForVillage } from './progress';
import { escapeHTML as h, notify } from './ui';

export function openJournal(c: Curriculum, p: ProgressV4, replace: (p: ProgressV4) => void) {
  const dialog = document.createElement('dialog');
  dialog.className = 'journal-dialog';
  dialog.setAttribute('aria-label', 'Toolkit Journal');
  const discovered = c.toolCards.filter(card => p.discoveredToolCards.includes(card.id));
  const bySymptom = groupBySymptom(discovered);
  dialog.innerHTML = `<div class="dialog-heading"><div><div class="eyebrow">TOOLKIT JOURNAL</div><h2>Methods you have collected</h2></div><button data-close aria-label="Close journal">×</button></div>
    <p>The journal groups reusable methods by the symptom that should make you reach for them.</p>
    <div class="journal-list">
      <h3>Journey Progress <small>${c.stops.filter(stop => completed(p.stops[stop.id])).length}/${c.stops.length} stops</small></h3>
      ${c.villages.map(village => {
        const stops = stopsForVillage(c, village.id);
        const count = stops.filter(stop => completed(p.stops[stop.id])).length;
        return `<h3>${h(village.title)} <small>${count}/${stops.length} stops</small></h3>${stops.map(stop => {
        const state = p.stops[stop.id];
        return `<article><div><b>${completed(state) ? '✓' : '○'} ${h(stop.place)}</b><span>Best quiz ${state.quizBest}% · ${state.quizAttempts} attempts</span></div>${state.weakTags.length ? `<p>Review suggested: ${state.weakTags.map(h).join(', ')}</p>` : ''}</article>`;
        }).join('')}`;
      }).join('')}
      ${Object.entries(bySymptom).map(([symptom, cards]) => `<h3>${h(symptom)} <small>${cards.length} cards</small></h3>${cards.map(card => `<article><div><b>${h(card.title)}</b><span>${h(card.category)}</span></div><small>${h(card.signal)}</small></article>`).join('')}`).join('')}
    </div>
    <div class="backup-actions"><button class="primary" data-export>Export JSON</button><label class="secondary file-label">Import JSON<input type="file" id="backup-file" accept="application/json,.json"></label></div>
    <p class="small">Import replaces local v4 progress only. Old v2 progress is ignored by this version; v3 is migrated automatically on first load.</p>
    <div id="import-preview" aria-live="polite"></div>`;
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector<HTMLButtonElement>('[data-close]')!.onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  dialog.querySelector<HTMLButtonElement>('[data-export]')!.onclick = () => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `architecture-village-v4-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  dialog.querySelector<HTMLInputElement>('#backup-file')!.onchange = async event => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const preview = dialog.querySelector<HTMLElement>('#import-preview')!;
    try {
      if (file.size > 500000) throw new Error('Backup is larger than 500 KB.');
      const next = parseBackup(await file.text(), c);
      preview.innerHTML = `<div class="import-summary"><b>Valid v4 backup</b><p>${Object.values(next.stops).filter(completed).length}/${c.stops.length} stops · ${h(next.updatedAt)}</p><button class="primary" data-confirm-import>Replace local progress</button></div>`;
      preview.querySelector<HTMLButtonElement>('[data-confirm-import]')!.onclick = () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          replace(next);
          dialog.close();
          notify('Progress restored from v4 backup.');
        } catch {
          preview.textContent = 'Could not save backup. Current progress was kept.';
        }
      };
    } catch (error) {
      preview.textContent = error instanceof Error ? error.message : 'Could not read file.';
    }
  };
}

function groupBySymptom(cards: ToolCard[]): Record<string, ToolCard[]> {
  const result: Record<string, ToolCard[]> = {};
  for (const card of cards) {
    result[card.symptom] ??= [];
    result[card.symptom].push(card);
  }
  return result;
}

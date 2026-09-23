import type { Route, VillageId } from './types';

const villages: VillageId[] = ['foundation', 'distributed-highlands'];
const villageId = (value: string | undefined): VillageId => villages.includes(value as VillageId) ? value as VillageId : 'foundation';

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 0) return { kind: 'village', villageId: 'foundation' };
  if (parts[0] === 'village') return { kind: 'village', villageId: villageId(parts[1]) };
  if (parts[0] === 'stop' && parts.length === 2) return { kind: 'stop', stopId: parts[1] };
  if (parts[0] === 'final') return { kind: 'final', villageId: villageId(parts[1]) };
  return { kind: 'village', villageId: 'foundation' };
}

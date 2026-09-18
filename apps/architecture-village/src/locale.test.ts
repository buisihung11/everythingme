import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLocale, saveLocale, text } from './locale';

test('locale defaults to Vietnamese and persists English selection', () => {
  const storage = new Map<string, string>();
  const adapter = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
  };
  assert.equal(loadLocale(adapter), 'vi');
  saveLocale(adapter, 'en');
  assert.equal(loadLocale(adapter), 'en');
  assert.equal(text('en', 'Xin chào', 'Hello'), 'Hello');
  assert.equal(text('vi', 'Xin chào', 'Hello'), 'Xin chào');
});

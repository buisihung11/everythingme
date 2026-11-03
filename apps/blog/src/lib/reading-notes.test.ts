import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mutateNotes,
  NOTES_STORAGE_KEY,
  readNotes,
  type ReadingNote,
} from "./reading-notes";

const note: ReadingNote = {
  id: "note-1",
  postUrl: "/blog/personal/story",
  postTitle: "A story",
  anchor: null,
  body: "Remember this",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
beforeEach(() => localStorage.clear());

describe("reading notes persistence", () => {
  it("persists notes across reads and preserves the latest notes from another tab", () => {
    expect(readNotes(localStorage)).toEqual([]);
    mutateNotes(localStorage, () => [note]);
    mutateNotes(localStorage, (current) => [
      ...current,
      { ...note, id: "note-2" },
    ]);
    expect(readNotes(localStorage).map((item) => item.id)).toEqual([
      "note-1",
      "note-2",
    ]);
  });
  it.each([
    "{broken",
    '{"version":2,"notes":[]}',
    JSON.stringify({
      version: 1,
      notes: [{ ...note, postUrl: "javascript:alert(1)" }],
    }),
  ])("preserves unreadable storage: %s", (raw) => {
    localStorage.setItem(NOTES_STORAGE_KEY, raw);
    expect(() => mutateNotes(localStorage, () => [note])).toThrow();
    expect(localStorage.getItem(NOTES_STORAGE_KEY)).toBe(raw);
  });
  it("propagates quota errors without claiming the note was saved", () => {
    const storage = {
      getItem: () => null,
      setItem: vi.fn(() => {
        throw new DOMException("Full", "QuotaExceededError");
      }),
    } as unknown as Storage;
    expect(() => mutateNotes(storage, () => [note])).toThrow("Full");
  });
  it("accepts known highlight colors and rejects unknown colors", () => {
    mutateNotes(localStorage, () => [{ ...note, color: "mint" }]);
    expect(readNotes(localStorage)[0].color).toBe("mint");

    localStorage.setItem(
      NOTES_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        notes: [{ ...note, color: "neon" }],
      }),
    );
    expect(() => readNotes(localStorage)).toThrow("Invalid reading notes");
  });
  it("updates and deletes only the requested note", () => {
    mutateNotes(localStorage, () => [note, { ...note, id: "note-2" }]);
    mutateNotes(localStorage, (current) =>
      current.map((item) =>
        item.id === note.id ? { ...item, body: "Updated" } : item,
      ),
    );
    expect(readNotes(localStorage)[0].body).toBe("Updated");
    mutateNotes(localStorage, (current) =>
      current.filter((item) => item.id !== note.id),
    );
    expect(readNotes(localStorage)).toEqual([{ ...note, id: "note-2" }]);
  });
});

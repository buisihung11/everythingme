import { useEffect, useState, type ReactNode } from "react";
import {
  mutateNotes,
  NOTES_STORAGE_KEY,
  readNotes,
  type NoteDraft,
  type ReadingNote,
} from "@/lib/reading-notes";
import { NotesDialog } from "./NotesDialog";

import { NotesContext, type NotebookView } from "./ReadingNotesContext";

export function ReadingNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<NotebookView>(null);

  useEffect(() => {
    function refresh() {
      try {
        setNotes(readNotes(window.localStorage));
        setError(null);
      } catch {
        setError(
          "Your saved notes could not be read. Check browser storage access. Existing data has not been changed.",
        );
      }
      setReady(true);
    }
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === NOTES_STORAGE_KEY || event.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function persist(update: (current: ReadingNote[]) => ReadingNote[]) {
    try {
      setNotes(mutateNotes(window.localStorage, update));
      setError(null);
      return true;
    } catch {
      setError(
        "Changes could not be saved. Browser storage may be full or unavailable. Your draft is still here; please try again.",
      );
      return false;
    }
  }

  function saveNote(draft: NoteDraft, id?: string) {
    return persist((current) => {
      const now = new Date().toISOString();
      if (id) {
        if (!current.some((note) => note.id === id))
          throw new Error("Note removed in another tab");
        return current.map((note) =>
          note.id === id
            ? { ...note, body: draft.body.trim(), updatedAt: now }
            : note,
        );
      }
      // Selecting the exact same passage twice should not create duplicate highlights.
      const existing =
        draft.anchor &&
        current.find(
          (note) =>
            note.postUrl === draft.postUrl &&
            note.anchor?.start === draft.anchor?.start &&
            note.anchor?.quote === draft.anchor?.quote,
        );
      if (existing) {
        const colorChanged =
          draft.color !== undefined && draft.color !== existing.color;
        if (!draft.body.trim() && !colorChanged) return current;
        return current.map((note) =>
          note.id === existing.id
            ? {
                ...note,
                color: draft.color ?? note.color,
                body: [note.body, draft.body.trim()]
                  .filter(Boolean)
                  .join("\n\n"),
                updatedAt: now,
              }
            : note,
        );
      }
      return [
        {
          ...draft,
          body: draft.body.trim(),
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ];
    });
  }

  return (
    <NotesContext.Provider
      value={{
        notes,
        ready,
        error,
        openNotebook: (next = {}) => setView(next),
        saveNote,
        deleteNote: (id) =>
          persist((current) => current.filter((note) => note.id !== id)),
        removeHighlight: (id) =>
          persist((current) =>
            current.flatMap((note) => {
              if (note.id !== id) return [note];
              if (!note.body) return [];
              return [
                {
                  ...note,
                  anchor: null,
                  updatedAt: new Date().toISOString(),
                },
              ];
            }),
          ),
      }}
    >
      {children}
      {view && (
        <NotesDialog
          initialPostUrl={view.postUrl}
          initialDraft={view.draft}
          onClose={() => setView(null)}
        />
      )}
    </NotesContext.Provider>
  );
}

import { createContext, useContext } from "react";
import type { NoteDraft, ReadingNote } from "@/lib/reading-notes";

export type NotebookView = { postUrl?: string; draft?: NoteDraft } | null;
interface NotesContextValue {
  notes: ReadingNote[];
  ready: boolean;
  error: string | null;
  openNotebook: (view?: Exclude<NotebookView, null>) => void;
  saveNote: (draft: NoteDraft, id?: string) => boolean;
  deleteNote: (id: string) => boolean;
  removeHighlight: (id: string) => boolean;
}
export const NotesContext = createContext<NotesContextValue | null>(null);

export function useReadingNotes() {
  const context = useContext(NotesContext);
  if (!context) throw new Error("ReadingNotesProvider is required");
  return context;
}

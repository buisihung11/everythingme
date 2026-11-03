import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Highlighter,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import {
  HIGHLIGHT_COLOR_LABELS,
  MAX_NOTE_LENGTH,
  type NoteDraft,
  type ReadingNote,
} from "@/lib/reading-notes";
import { useReadingNotes } from "./ReadingNotesContext";

export function NotesDialog({
  initialPostUrl,
  initialDraft,
  onClose,
}: {
  initialPostUrl?: string;
  initialDraft?: NoteDraft;
  onClose: () => void;
}) {
  const { notes, ready, error, saveNote, deleteNote } = useReadingNotes();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [postUrl, setPostUrl] = useState(initialPostUrl ?? "");
  const [editor, setEditor] = useState<{
    draft: NoteDraft;
    id?: string;
  } | null>(initialDraft ? { draft: initialDraft } : null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [discarding, setDiscarding] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const originalBody = useRef(initialDraft?.body ?? "");

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialog.current?.showModal();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    if (editor) editorRef.current?.focus();
    else searchRef.current?.focus();
  }, [editor?.id, !!editor]);

  const dirty = editor !== null && editor.draft.body !== originalBody.current;
  function close() {
    if (dirty) setDiscarding(true);
    else onClose();
  }
  function edit(note: ReadingNote) {
    originalBody.current = note.body;
    setEditor({ draft: note, id: note.id });
    setDiscarding(false);
  }
  const search = query.trim().toLocaleLowerCase();
  const filtered = notes
    .filter(
      (note) =>
        (!postUrl || note.postUrl === postUrl) &&
        `${note.postTitle} ${note.anchor?.quote ?? ""} ${note.body}`
          .toLocaleLowerCase()
          .includes(search),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const posts = Array.from(
    new Map(notes.map((note) => [note.postUrl, note.postTitle])),
  );

  return (
    <dialog
      ref={dialog}
      className="notes-dialog"
      aria-labelledby="notebook-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <header className="notes-dialog-header">
        <div>
          <p className="notes-eyebrow">
            <BookOpen size={15} aria-hidden="true" /> YOUR READING SPACE
          </p>
          <h2 id="notebook-title" className="display-title">
            My notes <span className="notes-count">{notes.length}</span>
          </h2>
        </div>
        <button
          type="button"
          className="notes-icon-button"
          aria-label="Close notes"
          onClick={close}
        >
          <X size={20} />
        </button>
      </header>
      <p className="notes-storage-hint">
        Saved in this browser. Available without signing in; not synced across
        devices. Clearing site data removes your notes.
      </p>
      {error && (
        <p role="alert" className="notes-error">
          {error}
        </p>
      )}
      <p role="status" className="notes-status">
        {status}
      </p>
      {discarding && (
        <div className="notes-discard" role="alert">
          <p>Discard your unsaved changes?</p>
          <div className="notes-actions">
            <button
              type="button"
              className="notes-button"
              onClick={() => {
                setDiscarding(false);
                editorRef.current?.focus();
              }}
            >
              Keep writing
            </button>
            <button type="button" className="notes-button" onClick={onClose}>
              Discard and close
            </button>
          </div>
        </div>
      )}
      {editor ? (
        <form
          className="notes-editor"
          onSubmit={(event) => {
            event.preventDefault();
            if (saveNote(editor.draft, editor.id)) {
              setEditor(null);
              setDiscarding(false);
              setStatus("Note saved.");
            }
          }}
        >
          <p className="notes-eyebrow">
            {editor.id ? "EDIT NOTE" : "NEW NOTE"}
          </p>
          <h3>{editor.draft.postTitle}</h3>
          {editor.draft.anchor && (
            <blockquote>{editor.draft.anchor.quote}</blockquote>
          )}
          <label htmlFor="reading-note-body">
            Your note{editor.draft.anchor ? " (optional)" : ""}
          </label>
          <textarea
            ref={editorRef}
            id="reading-note-body"
            rows={6}
            maxLength={MAX_NOTE_LENGTH}
            required={!editor.draft.anchor}
            value={editor.draft.body}
            placeholder="What would you like to remember?"
            onChange={(event) =>
              setEditor({
                ...editor,
                draft: { ...editor.draft, body: event.target.value },
              })
            }
          />
          <div className="notes-editor-footer">
            <span>
              {editor.draft.body.length.toLocaleString()} /{" "}
              {MAX_NOTE_LENGTH.toLocaleString()}
            </span>
            <div className="notes-actions">
              <button type="button" className="notes-button" onClick={close}>
                Cancel
              </button>
              <button
                type="submit"
                className="notes-button notes-button-primary"
                disabled={
                  !ready || (!editor.draft.anchor && !editor.draft.body.trim())
                }
              >
                Save note
              </button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <div className="notes-filters">
            <label className="notes-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search notes</span>
              <input
                ref={searchRef}
                type="search"
                placeholder="Search notes, highlights, articles…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Filter by article</span>
              <select
                value={postUrl}
                onChange={(event) => setPostUrl(event.target.value)}
              >
                <option value="">All articles</option>
                {postUrl && !posts.some(([url]) => url === postUrl) && (
                  <option value={postUrl}>This article</option>
                )}
                {posts.map(([url, title]) => (
                  <option key={url} value={url}>
                    {title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="notes-list">
            {!ready ? (
              <p>Loading your notes…</p>
            ) : filtered.length === 0 ? (
              <div className="notes-empty">
                <Highlighter size={30} aria-hidden="true" />
                <h3>
                  {notes.length
                    ? "No matching notes"
                    : "Keep the ideas that stay with you"}
                </h3>
                <p>
                  {notes.length
                    ? "Try another search or choose a different article."
                    : "Select a passage in any article to highlight it or add a note. Your saved ideas will appear here."}
                </p>
              </div>
            ) : (
              filtered.map((note) => (
                <article
                  key={note.id}
                  className="notes-card"
                  data-color={note.color ?? "yellow"}
                >
                  <div className="notes-card-meta">
                    <span>
                      {note.body ? (
                        <StickyNote size={14} aria-hidden="true" />
                      ) : (
                        <Highlighter size={14} aria-hidden="true" />
                      )}
                      {note.anchor
                        ? `${HIGHLIGHT_COLOR_LABELS[note.color ?? "yellow"]} ${note.body ? "NOTE" : "HIGHLIGHT"}`
                        : "NOTE"}
                    </span>
                    <time dateTime={note.updatedAt}>
                      {new Date(note.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <h3>{note.postTitle}</h3>
                  {note.anchor && <blockquote>{note.anchor.quote}</blockquote>}
                  {note.body && <p className="notes-card-body">{note.body}</p>}
                  <div className="notes-card-footer">
                    <a
                      className="notes-text-button"
                      href={`${note.postUrl}#note-${note.id}`}
                      onClick={onClose}
                    >
                      {note.anchor ? "Back to passage" : "Read article"}{" "}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                    <div className="notes-actions">
                      <button
                        type="button"
                        className="notes-text-button"
                        onClick={() => edit(note)}
                      >
                        {note.body ? "Edit" : "Add note"}
                      </button>
                      <button
                        type="button"
                        className="notes-text-button"
                        onClick={() => setDeleting(note.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {deleting === note.id && (
                    <div className="notes-delete-confirm">
                      <p>Delete this note and its highlight?</p>
                      <div className="notes-actions">
                        <button
                          type="button"
                          className="notes-button"
                          onClick={() => setDeleting(null)}
                        >
                          Keep note
                        </button>
                        <button
                          type="button"
                          className="notes-button"
                          onClick={() => {
                            if (deleteNote(note.id)) {
                              setDeleting(null);
                              setStatus("Note deleted.");
                              searchRef.current?.focus();
                            }
                          }}
                        >
                          Delete permanently
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </>
      )}
    </dialog>
  );
}

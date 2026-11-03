import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Check,
  Highlighter,
  Plus,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { captureAnchor, resolveAnchor } from "@/lib/text-anchors";
import {
  HIGHLIGHT_COLORS,
  HIGHLIGHT_COLOR_LABELS,
  type HighlightColor,
  type ReadingNote,
  type TextAnchor,
} from "@/lib/reading-notes";
import { useReadingNotes } from "./ReadingNotesContext";

interface ToolbarPosition {
  left: number;
  top: number;
  placement: "above" | "below";
}

interface HoveredHighlight {
  noteId: string;
  left: number;
  top: number;
  placement: "above" | "below";
}

function ColorChoices({
  value,
  disabled,
  onSelect,
}: {
  value: HighlightColor;
  disabled: boolean;
  onSelect: (color: HighlightColor) => void;
}) {
  return (
    <fieldset className="highlight-color-tiles is-compact">
      <legend>Highlight color</legend>
      <div>
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className="highlight-color-choice"
            data-color={color}
            disabled={disabled}
            aria-pressed={value === color}
            aria-label={`Highlight ${HIGHLIGHT_COLOR_LABELS[color].toLowerCase()} now`}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => onSelect(color)}
          >
            <span className="highlight-color-dot" aria-hidden="true" />
            {value === color && <Check size={14} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function SelectionActions({
  color,
  savedNote,
  ready,
  position,
  toolbarRef,
  onColorSelect,
  onAddNote,
  onRemove,
  onDismiss,
}: {
  color: HighlightColor;
  savedNote?: ReadingNote;
  ready: boolean;
  position: ToolbarPosition | null;
  toolbarRef: RefObject<HTMLDivElement | null>;
  onColorSelect: (color: HighlightColor) => void;
  onAddNote: () => void;
  onRemove: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      ref={toolbarRef}
      className="notes-selection-toolbar"
      role="group"
      aria-label="Save selected passage"
      data-placement={position?.placement ?? "above"}
      data-positioned={position ? "true" : "false"}
      style={{ left: position?.left ?? 0, top: position?.top ?? 0 }}
    >
      <ColorChoices value={color} disabled={!ready} onSelect={onColorSelect} />
      <button
        type="button"
        className="notes-toolbar-button"
        disabled={!ready}
        aria-label="Add note"
        title="Add note"
        onPointerDown={(event) => event.preventDefault()}
        onClick={onAddNote}
      >
        <StickyNote size={15} aria-hidden="true" />
      </button>
      {savedNote && (
        <button
          type="button"
          className="notes-toolbar-button is-danger"
          aria-label="Remove highlight"
          title="Remove highlight"
          onPointerDown={(event) => event.preventDefault()}
          onClick={onRemove}
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        className="notes-toolbar-button"
        aria-label="Dismiss selection"
        title="Dismiss"
        onPointerDown={(event) => event.preventDefault()}
        onClick={onDismiss}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ArticleNotes({
  postUrl,
  postTitle,
  children,
}: {
  postUrl: string;
  postTitle: string;
  children: ReactNode;
}) {
  const notebook = useReadingNotes();
  const [hydrated, setHydrated] = useState(false);
  const { openNotebook, saveNote, removeHighlight } = notebook;
  const notes = hydrated ? notebook.notes : [];
  const ready = hydrated && notebook.ready;
  const error = hydrated ? notebook.error : null;
  useEffect(() => setHydrated(true), []);
  const root = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<TextAnchor | null>(null);
  const [toolbarPosition, setToolbarPosition] =
    useState<ToolbarPosition | null>(null);
  const [hoveredHighlight, setHoveredHighlight] =
    useState<HoveredHighlight | null>(null);
  const [color, setColor] = useState<HighlightColor>("yellow");
  const [status, setStatus] = useState("");
  const [supported, setSupported] = useState(true);
  const articleNotes = notes.filter((note) => note.postUrl === postUrl);
  const selectedNote = selection
    ? articleNotes.find(
        (note) =>
          note.anchor?.start === selection.start &&
          note.anchor.quote === selection.quote,
      )
    : undefined;
  const hoveredNote = hoveredHighlight
    ? articleNotes.find((note) => note.id === hoveredHighlight.noteId)
    : undefined;

  useEffect(() => {
    function onSelection() {
      if (toolbar.current?.contains(document.activeElement)) return;
      const selected = window.getSelection();
      const anchor =
        root.current && selected?.rangeCount
          ? captureAnchor(root.current, selected.getRangeAt(0))
          : null;
      setSelection(anchor);
      setToolbarPosition(null);
      if (anchor) {
        const saved = notes.find(
          (note) =>
            note.postUrl === postUrl &&
            note.anchor?.start === anchor.start &&
            note.anchor.quote === anchor.quote,
        );
        setColor(saved?.color ?? "yellow");
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
      }
    }
    document.addEventListener("selectionchange", onSelection);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("selectionchange", onSelection);
      document.removeEventListener("keydown", onKey);
    };
  }, [notes, postUrl]);

  useLayoutEffect(() => {
    const content = root.current;
    const panel = toolbar.current;
    if (!selection || !content || !panel) return;
    const selectedAnchor = selection;
    const contentElement = content;
    const panelElement = panel;

    function placeToolbar() {
      const range = resolveAnchor(contentElement, selectedAnchor);
      if (!range) return;
      const passage =
        typeof range.getBoundingClientRect === "function"
          ? range.getBoundingClientRect()
          : { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 };
      const panelRect = panelElement.getBoundingClientRect();
      const edge = 8;

      if (passage.width === 0 && passage.height === 0) {
        setToolbarPosition({
          left: window.innerWidth / 2,
          top: window.innerHeight - edge,
          placement: "above",
        });
        return;
      }

      const halfWidth = panelRect.width / 2;
      const desiredLeft = passage.left + passage.width / 2;
      const left = Math.min(
        Math.max(desiredLeft, halfWidth + edge),
        window.innerWidth - halfWidth - edge,
      );
      const roomAbove = passage.top;
      const roomBelow = window.innerHeight - passage.bottom;
      const placement =
        roomAbove >= panelRect.height + 12 || roomAbove > roomBelow
          ? "above"
          : "below";

      setToolbarPosition({
        left,
        top: placement === "above" ? passage.top - 10 : passage.bottom + 10,
        placement,
      });
    }

    placeToolbar();
    window.addEventListener("resize", placeToolbar);
    window.addEventListener("scroll", placeToolbar, true);
    return () => {
      window.removeEventListener("resize", placeToolbar);
      window.removeEventListener("scroll", placeToolbar, true);
    };
  }, [selection, selectedNote?.id]);

  useEffect(() => {
    const content = root.current;
    if (!content) return;
    const canHighlight =
      typeof CSS !== "undefined" &&
      "highlights" in CSS &&
      typeof Highlight !== "undefined";
    setSupported(canHighlight);
    function renderHighlights() {
      if (!content || !canHighlight) return;
      HIGHLIGHT_COLORS.forEach((highlightColor) => {
        const ranges = notes
          .filter(
            (note) =>
              note.postUrl === postUrl &&
              note.anchor &&
              (note.color ?? "yellow") === highlightColor,
          )
          .flatMap((note) => {
            const range = resolveAnchor(content, note.anchor!);
            return range ? [range] : [];
          });
        const name = `reading-notes-${highlightColor}`;
        if (ranges.length) CSS.highlights.set(name, new Highlight(...ranges));
        else CSS.highlights.delete(name);
      });
    }
    function jumpToNote() {
      if (!content || !ready || !window.location.hash.startsWith("#note-"))
        return;
      const id = window.location.hash.slice(6);
      const note = notes.find(
        (item) => item.id === id && item.postUrl === postUrl,
      );
      if (!note) {
        setStatus("This note is no longer available in this browser.");
        return;
      }
      if (!note.anchor) {
        content.scrollIntoView({ block: "center" });
        content.focus({ preventScroll: true });
        return;
      }
      const range = resolveAnchor(content, note.anchor);
      if (!range) {
        setStatus(
          "This passage has changed. Your saved quote and note are still available in My notes.",
        );
        return;
      }
      const element = range.startContainer.parentElement;
      element?.scrollIntoView({ block: "center" });
      content.focus({ preventScroll: true });
      if (canHighlight)
        CSS.highlights.set("reading-note-active", new Highlight(range));
      else {
        const selected = window.getSelection();
        selected?.removeAllRanges();
        selected?.addRange(range);
      }
      setStatus("Showing your saved passage.");
    }
    renderHighlights();
    jumpToNote();
    const observer = new MutationObserver(renderHighlights);
    observer.observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    window.addEventListener("hashchange", jumpToNote);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", jumpToNote);
      if (canHighlight) {
        HIGHLIGHT_COLORS.forEach((highlightColor) =>
          CSS.highlights.delete(`reading-notes-${highlightColor}`),
        );
        CSS.highlights.delete("reading-note-active");
      }
    };
  }, [notes, postUrl, ready]);

  useEffect(() => {
    const content = root.current;
    if (!content || !ready || selection) {
      setHoveredHighlight(null);
      return;
    }
    const contentElement = content;
    const highlightedRanges = notes.flatMap((note) => {
      if (note.postUrl !== postUrl || !note.anchor) return [];
      const range = resolveAnchor(contentElement, note.anchor);
      return range ? [{ note, range }] : [];
    });

    let dismissTimer: ReturnType<typeof setTimeout> | undefined;

    function cancelDismiss() {
      if (dismissTimer) clearTimeout(dismissTimer);
      dismissTimer = undefined;
    }

    function dismissSoon() {
      cancelDismiss();
      dismissTimer = setTimeout(() => setHoveredHighlight(null), 160);
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      const target = event.target instanceof Element ? event.target : null;

      if (target?.closest(".notes-highlight-delete")) {
        cancelDismiss();
        return;
      }
      if (!target || !contentElement.contains(target)) {
        dismissSoon();
        return;
      }

      for (const { note, range } of highlightedRanges) {
        if (typeof range.getClientRects !== "function") continue;
        const rect = Array.from(range.getClientRects()).find(
          (item) =>
            event.clientX >= item.left - 2 &&
            event.clientX <= item.right + 2 &&
            event.clientY >= item.top - 2 &&
            event.clientY <= item.bottom + 2,
        );
        if (!rect) continue;

        cancelDismiss();
        const left = Math.min(Math.max(rect.right, 88), window.innerWidth - 8);
        const placement = rect.top >= 52 ? "above" : "below";
        const top = placement === "above" ? rect.top - 6 : rect.bottom + 6;
        setHoveredHighlight((current) =>
          current?.noteId === note.id &&
          current.left === left &&
          current.top === top &&
          current.placement === placement
            ? current
            : { noteId: note.id, left, top, placement },
        );
        return;
      }

      dismissSoon();
    }

    function clearHover() {
      setHoveredHighlight(null);
    }

    document.addEventListener("pointermove", onPointerMove);
    window.addEventListener("scroll", clearHover, true);
    window.addEventListener("resize", clearHover);
    return () => {
      cancelDismiss();
      document.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", clearHover, true);
      window.removeEventListener("resize", clearHover);
    };
  }, [notes, postUrl, ready, selection]);

  useEffect(() => {
    const content = root.current;
    const canHighlight =
      typeof CSS !== "undefined" &&
      "highlights" in CSS &&
      typeof Highlight !== "undefined";
    if (!content || !canHighlight || !hoveredNote?.anchor) {
      if (canHighlight) CSS.highlights.delete("reading-note-hover");
      return;
    }
    const range = resolveAnchor(content, hoveredNote.anchor);
    if (range) CSS.highlights.set("reading-note-hover", new Highlight(range));
    return () => {
      CSS.highlights.delete("reading-note-hover");
    };
  }, [hoveredNote]);

  function clearSelection() {
    setSelection(null);
    setToolbarPosition(null);
    window.getSelection()?.removeAllRanges();
  }

  function saveHighlight(nextColor: HighlightColor) {
    setColor(nextColor);
    if (
      selection &&
      saveNote({
        postUrl,
        postTitle,
        anchor: selection,
        color: nextColor,
        body: "",
      })
    ) {
      const wasSaved = Boolean(selectedNote);
      clearSelection();
      setStatus(
        wasSaved
          ? `Highlight changed to ${HIGHLIGHT_COLOR_LABELS[nextColor].toLowerCase()}.`
          : `${HIGHLIGHT_COLOR_LABELS[nextColor]} highlight saved in My notes.`,
      );
    }
  }

  function addNote() {
    if (!selection) return;
    openNotebook({
      postUrl,
      draft: { postUrl, postTitle, anchor: selection, color, body: "" },
    });
    clearSelection();
  }

  function removeSelectedHighlight() {
    if (!selectedNote || !removeHighlight(selectedNote.id)) return;
    clearSelection();
    setStatus(
      selectedNote.body
        ? "Highlight removed. Your written note is still in My notes."
        : "Highlight removed.",
    );
  }

  function removeHoveredHighlight() {
    if (!hoveredNote || !removeHighlight(hoveredNote.id)) return;
    setHoveredHighlight(null);
    setStatus(
      hoveredNote.body
        ? "Highlight removed. Your written note is still in My notes."
        : "Highlight removed.",
    );
  }

  return (
    <>
      <section
        className="article-notes-tools not-prose"
        aria-label="Reading notes"
      >
        <p>
          <Highlighter size={16} aria-hidden="true" /> Select a passage, then
          choose a color to highlight it instantly.
        </p>
        <div className="notes-actions">
          <button
            type="button"
            className="notes-button"
            disabled={!ready}
            onClick={() =>
              openNotebook({
                postUrl,
                draft: { postUrl, postTitle, anchor: null, body: "" },
              })
            }
          >
            <Plus size={15} aria-hidden="true" /> Add note
          </button>
          <button
            type="button"
            className="notes-button"
            onClick={() => openNotebook({ postUrl })}
          >
            <BookOpen size={15} aria-hidden="true" /> My notes (
            {articleNotes.length})
          </button>
        </div>
      </section>
      {!supported && (
        <p className="notes-storage-hint">
          This browser cannot display highlight colors. You can still save
          passages and read them in My notes.
        </p>
      )}
      <p className="notes-status" role="status">
        {status}
      </p>
      {error && (
        <p className="notes-error not-prose" role="alert">
          {error}
        </p>
      )}
      <div ref={root} tabIndex={-1} className="reading-notes-content">
        {children}
      </div>
      {hydrated &&
        selection &&
        createPortal(
          <SelectionActions
            color={color}
            savedNote={selectedNote}
            ready={ready}
            position={toolbarPosition}
            toolbarRef={toolbar}
            onColorSelect={saveHighlight}
            onAddNote={addNote}
            onRemove={removeSelectedHighlight}
            onDismiss={clearSelection}
          />,
          document.body,
        )}
      {hydrated &&
        hoveredHighlight &&
        hoveredNote &&
        !selection &&
        createPortal(
          <button
            type="button"
            className="notes-highlight-delete"
            data-color={hoveredNote.color ?? "yellow"}
            data-placement={hoveredHighlight.placement}
            aria-label={`Remove ${HIGHLIGHT_COLOR_LABELS[
              hoveredNote.color ?? "yellow"
            ].toLowerCase()} highlight`}
            style={{
              left: hoveredHighlight.left,
              top: hoveredHighlight.top,
            }}
            onPointerDown={(event) => event.preventDefault()}
            onPointerLeave={() => setHoveredHighlight(null)}
            onClick={removeHoveredHighlight}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>,
          document.body,
        )}
    </>
  );
}

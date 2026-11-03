export const NOTES_STORAGE_KEY = "everything-blog:reading-notes:v1";
export const MAX_NOTE_LENGTH = 5000;
export const MAX_QUOTE_LENGTH = 10000;

export const HIGHLIGHT_COLORS = ["yellow", "mint", "blue", "rose"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export const HIGHLIGHT_COLOR_LABELS: Record<HighlightColor, string> = {
  yellow: "Yellow",
  mint: "Mint",
  blue: "Blue",
  rose: "Rose",
};

export interface TextAnchor {
  start: number;
  end: number;
  quote: string;
  prefix: string;
  suffix: string;
}

export interface ReadingNote {
  id: string;
  postUrl: string;
  postTitle: string;
  anchor: TextAnchor | null;
  color?: HighlightColor;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteDraft = Pick<
  ReadingNote,
  "postUrl" | "postTitle" | "anchor" | "color" | "body"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAnchor(value: unknown): value is TextAnchor {
  if (!isRecord(value)) return false;
  return (
    Number.isSafeInteger(value.start) &&
    Number.isSafeInteger(value.end) &&
    Number(value.start) >= 0 &&
    Number(value.end) > Number(value.start) &&
    typeof value.quote === "string" &&
    value.quote.trim().length > 0 &&
    value.quote.length <= MAX_QUOTE_LENGTH &&
    Number(value.end) - Number(value.start) === value.quote.length &&
    typeof value.prefix === "string" &&
    value.prefix.length <= 32 &&
    typeof value.suffix === "string" &&
    value.suffix.length <= 32
  );
}

function isNote(value: unknown): value is ReadingNote {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    /^[\w-]{1,100}$/.test(value.id) &&
    typeof value.postUrl === "string" &&
    /^\/blog\/[\w%/-]+$/.test(value.postUrl) &&
    typeof value.postTitle === "string" &&
    value.postTitle.length > 0 &&
    typeof value.body === "string" &&
    value.body.length <= MAX_NOTE_LENGTH &&
    (value.color === undefined ||
      HIGHLIGHT_COLORS.includes(value.color as HighlightColor)) &&
    (value.anchor === null || isAnchor(value.anchor)) &&
    (value.anchor !== null || value.body.trim().length > 0) &&
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    typeof value.updatedAt === "string" &&
    Number.isFinite(Date.parse(value.updatedAt))
  );
}

export function readNotes(storage: Pick<Storage, "getItem">): ReadingNote[] {
  const raw = storage.getItem(NOTES_STORAGE_KEY);
  if (raw === null) return [];
  const data: unknown = JSON.parse(raw);
  if (
    !isRecord(data) ||
    data.version !== 1 ||
    !Array.isArray(data.notes) ||
    !data.notes.every(isNote) ||
    new Set(data.notes.map((note) => note.id)).size !== data.notes.length
  ) {
    throw new Error("Invalid reading notes");
  }
  return data.notes;
}

// Re-read before each mutation so another tab's saved notes are preserved.
// Never overwrite unreadable data or report success before storage accepts it.
export function mutateNotes(
  storage: Storage,
  update: (notes: ReadingNote[]) => ReadingNote[],
) {
  const notes = update(readNotes(storage));
  if (!notes.every(isNote)) throw new Error("Invalid reading note");
  storage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 1, notes }));
  return notes;
}

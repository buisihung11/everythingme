import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReadingNotesProvider } from "./ReadingNotesProvider";
import { useReadingNotes } from "./ReadingNotesContext";
import { ArticleNotes } from "./ArticleNotes";
import { NOTES_STORAGE_KEY, readNotes } from "@/lib/reading-notes";

function NotebookButton() {
  const { openNotebook } = useReadingNotes();
  return <button onClick={() => openNotebook()}>All my notes</button>;
}
function TestArticle() {
  return (
    <ReadingNotesProvider>
      <NotebookButton />
      <ArticleNotes postUrl="/blog/personal/story" postTitle="A good story">
        <p data-testid="passage">An idea worth remembering.</p>
      </ArticleNotes>
    </ReadingNotesProvider>
  );
}
function selectPassage() {
  const range = document.createRange();
  range.selectNodeContents(screen.getByTestId("passage"));
  act(() => {
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
}
function openAllNotes() {
  fireEvent.click(screen.getByText("All my notes"));
  return screen.getByRole("dialog");
}

function mockHighlightRect() {
  const rect = {
    x: 10,
    y: 10,
    left: 10,
    right: 210,
    top: 10,
    bottom: 30,
    width: 200,
    height: 20,
    toJSON: () => ({}),
  } as DOMRect;
  Object.defineProperty(Range.prototype, "getClientRects", {
    configurable: true,
    value: () => ({
      0: rect,
      length: 1,
      item: (index: number) => (index === 0 ? rect : null),
      [Symbol.iterator]: function* () {
        yield rect;
      },
    }),
  });
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.setAttribute("open", "");
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.getSelection()?.removeAllRanges();
});

describe("reader notebook", () => {
  it("saves a selected passage, avoids duplicates, and restores it after remount", () => {
    const page = render(<TestArticle />);
    selectPassage();
    fireEvent.click(
      screen.getByRole("button", { name: "Highlight yellow now" }),
    );
    expect(readNotes(localStorage)[0].anchor?.quote).toBe(
      "An idea worth remembering.",
    );
    selectPassage();
    fireEvent.click(
      screen.getByRole("button", { name: "Highlight yellow now" }),
    );
    expect(readNotes(localStorage)).toHaveLength(1);
    page.unmount();
    render(<TestArticle />);
    const dialog = openAllNotes();
    expect(within(dialog).getByText("An idea worth remembering.")).toBeTruthy();
    expect(
      within(dialog)
        .getByRole("link", { name: "Back to passage" })
        .getAttribute("href"),
    ).toMatch(/^\/blog\/personal\/story#note-/);
  });
  it("creates, searches, edits and deletes a note with confirmation", () => {
    render(<TestArticle />);
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    fireEvent.change(screen.getByLabelText("Your note"), {
      target: { value: "My takeaway" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect(readNotes(localStorage)[0].body).toBe("My takeaway");
    expect(screen.getByRole("link", { name: "Read article" })).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "absent" },
    });
    expect(screen.getByText("No matching notes")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "takeaway" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Your note"), {
      target: { value: "Revised takeaway" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect(readNotes(localStorage)[0].body).toBe("Revised takeaway");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(readNotes(localStorage)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(readNotes(localStorage)).toEqual([]);
  });
  it("keeps a quote when adding a note and preserves an unsaved draft on Escape", () => {
    render(<TestArticle />);
    selectPassage();
    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Save selected passage" }),
      ).getByRole("button", { name: "Add note" }),
    );
    expect(
      within(screen.getByRole("dialog")).getByText(
        "An idea worth remembering.",
      ),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Your note (optional)"), {
      target: { value: "Still writing" },
    });
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true, bubbles: true }),
    );
    expect(screen.getByText("Discard your unsaved changes?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep writing" }));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
      "Still writing",
    );
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect(readNotes(localStorage)[0]).toMatchObject({
      body: "Still writing",
      anchor: { quote: "An idea worth remembering." },
    });
  });
  it("retains the draft and reports a failed save", () => {
    render(<TestArticle />);
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));
    fireEvent.change(screen.getByLabelText("Your note"), {
      target: { value: "Do not lose this" },
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
      "Do not lose this",
    );
    expect(
      within(screen.getByRole("dialog")).getByRole("alert").textContent,
    ).toContain("Changes could not be saved");
    expect(readNotes(localStorage)).toEqual([]);
  });
  it("refreshes saved notes when another tab changes storage", () => {
    render(<TestArticle />);
    const dialog = openAllNotes();
    act(() => {
      localStorage.setItem(
        NOTES_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          notes: [
            {
              id: "other-tab",
              postUrl: "/blog/technical/example",
              postTitle: "Another article",
              anchor: null,
              body: "From another tab",
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        }),
      );
      window.dispatchEvent(
        new StorageEvent("storage", { key: NOTES_STORAGE_KEY }),
      );
    });
    expect(within(dialog).getByText("From another tab")).toBeTruthy();
  });
  it("saves a chosen highlight color and removes the highlight in place", () => {
    render(<TestArticle />);
    selectPassage();
    expect(screen.queryByRole("button", { name: "Highlight" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Highlight blue now" }));
    expect(readNotes(localStorage)[0].color).toBe("blue");

    selectPassage();
    fireEvent.click(screen.getByRole("button", { name: "Remove highlight" }));
    expect(readNotes(localStorage)).toEqual([]);
    expect(screen.getByRole("status").textContent).toContain(
      "Highlight removed",
    );
  });
  it("removes the passage anchor without deleting its written note", () => {
    render(<TestArticle />);
    selectPassage();
    fireEvent.click(
      within(
        screen.getByRole("group", { name: "Save selected passage" }),
      ).getByRole("button", { name: "Add note" }),
    );
    fireEvent.change(screen.getByLabelText("Your note (optional)"), {
      target: { value: "Keep this thought" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    fireEvent.click(screen.getByRole("button", { name: "Close notes" }));

    selectPassage();
    fireEvent.click(screen.getByRole("button", { name: "Remove highlight" }));
    expect(readNotes(localStorage)[0]).toMatchObject({
      body: "Keep this thought",
      anchor: null,
    });
  });
  it("shows a remove button when hovering a saved highlight", () => {
    mockHighlightRect();
    render(<TestArticle />);
    selectPassage();
    fireEvent.click(screen.getByRole("button", { name: "Highlight blue now" }));

    fireEvent.pointerMove(screen.getByTestId("passage"), {
      clientX: 30,
      clientY: 18,
      pointerType: "mouse",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Remove blue highlight" }),
    );

    expect(readNotes(localStorage)).toEqual([]);
    expect(screen.getByRole("status").textContent).toContain(
      "Highlight removed",
    );
  });
  it("shows one promoted quick toolbar without the variant harness", () => {
    render(<TestArticle />);
    selectPassage();
    expect(
      screen.getByRole("group", { name: "Save selected passage" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("navigation", {
        name: "Highlight interaction variants",
      }),
    ).toBeNull();
  });
});

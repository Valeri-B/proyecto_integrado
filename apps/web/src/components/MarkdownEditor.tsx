"use client";
import { useState, useRef, useEffect } from "react";
import TagPickerModal from "@/components/TagPickerModal";
import MarkdownPreview from "@/components/MarkdownPreview";

type Tag = { id: number; name: string; color: string };
type Note = {
  id: number;
  title: string;
  folderId?: number | null;
  folder?: { id: number };
  tags?: Tag[];
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSave?: () => void;
  notes?: Note[];
  onOpenNote?: (note: Note) => void;
  noteId?: number;
  userId?: number;
  tags: Tag[];
  onEditTag: (id: number, name: string, color: string) => void;
  onDeleteTag: (id: number) => void;
  onCreateTag: (name: string, color: string) => void;
  noteTags: Tag[];
  setNoteTags: (tags: Tag[]) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api";

export default function MarkdownEditor({
  value,
  onChange,
  onSave,
  notes = [],
  onOpenNote,
  noteId,
  userId,
  tags,
  onEditTag,
  onDeleteTag,
  onCreateTag,
  noteTags,
  setNoteTags,
}: Props) {
  const [preview, setPreview] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState<Note[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [showTagModal, setShowTagModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when switching to edit mode
  useEffect(() => {
    if (!preview && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [preview]);

  // Custom link renderer for note links
  function LinkRenderer(props: any) {
    const { href, children } = props;
    if (!href) {
      const noteTitle = children?.[0] || "";
      const matchingNote = notes.find((n) =>
        n.title.trim().toLowerCase() === noteTitle.toLowerCase()
      );
      if (matchingNote) {
        return (
          <a
            href="#"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
            onClick={(e) => {
              e.preventDefault();
              onOpenNote && onOpenNote(matchingNote);
            }}
          >
            {children}
          </a>
        );
      }
      return <span>{children}</span>;
    }
    if (href.startsWith("#note/")) {
      const noteTitle = decodeURIComponent(href.replace("#note/", ""));
      const matchingNote = notes.find((n) =>
        n.title.trim().toLowerCase() === noteTitle.toLowerCase()
      );
      if (matchingNote) {
        return (
          <a
            href="#"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
            onClick={(e) => {
              e.preventDefault();
              onOpenNote && onOpenNote(matchingNote);
            }}
          >
            {children}
          </a>
        );
      }
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--accent)" }}
      >
        {children}
      </a>
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      setAutocompleteOptions(notes);
      setShowAutocomplete(true);
      setAutocompleteIndex(0);
    }
    if (showAutocomplete) {
      if (e.key === "ArrowDown") {
        setAutocompleteIndex((i) =>
          Math.min(i + 1, autocompleteOptions.length - 1)
        );
        e.preventDefault();
      }
      if (e.key === "ArrowUp") {
        setAutocompleteIndex((i) => Math.max(i - 1, 0));
        e.preventDefault();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        insertNoteLink(autocompleteOptions[autocompleteIndex]);
        setShowAutocomplete(false);
      }
      if (e.key === "Escape") {
        setShowAutocomplete(false);
      }
    }
  }

  function insertNoteLink(note: Note) {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const link = `[${note.title}](#note/${encodeURIComponent(note.title)})`;
    const newValue = before + link + after;
    onChange(newValue);
    setTimeout(() => {
      textareaRef.current!.focus();
      textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd =
        before.length + link.length;
    }, 0);
  }

  // --- Tag Picker ---
  const handleToggleTag = async (tagId: number) => {
    if (!noteId || !userId) return;
    const already = noteTags.some((t) => t.id === tagId);
    if (already) {
      await fetch(
        `${API_URL}/notes/${noteId}/tags/${tagId}?userId=${userId}`,
        { method: "DELETE" }
      );
    } else {
      await fetch(
        `${API_URL}/notes/${noteId}/tags/${tagId}?userId=${userId}`,
        { method: "POST" }
      );
    }
    // Always fetch the updated note from backend to get the correct tags
    const res = await fetch(`${API_URL}/notes/${noteId}?userId=${userId}`);
    if (res.ok) {
      const updatedNote = await res.json();
      setNoteTags(updatedNote.tags || []);
    }
  };

  // Show tags under the editor title
  const renderNoteTags = () => (
    <div className="flex gap-2 mt-2 flex-wrap">
      {noteTags.map((tag) => (
        <span
          key={tag.id}
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: tag.color, color: "#fff" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          {tag.name}
        </span>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 relative">
      <div className="flex gap-2 mb-2">
        <button
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors glass-border
      backdrop-blur-lg backdrop-saturate-200 border border-[var(--border)]
      ${!preview
              ? "bg-[var(--accent)] text-[var(--note-button-text)] rounded-full shadow-lg"
              : "bg-[var(--glass-bg)] text-[var(--note-button-text)] rounded-2xl hover:bg-[var(--accent)] hover:text-[var(--accent)]"
            } text-xs sm:text-base`}
          style={{
            background: !preview ? "var(--accent)" : "var(--glass-bg)",
            border: "1px solid var(--border)",
            boxShadow: !preview ? "0 4px 24px 0 rgba(0,0,0,0.10)" : "0 2px 8px 0 rgba(0,0,0,0.04)",
            backdropFilter: "blur(8px) saturate(180%)",
            WebkitBackdropFilter: "blur(8px) saturate(180%)",
          }}
          onClick={() => setPreview(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3 sm:size-4">
            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
            <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
          </svg>
          Edit
        </button>
        <button
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors glass-border
      backdrop-blur-lg backdrop-saturate-200 border border-[var(--border)]
      ${preview
              ? "bg-[var(--accent)] text-[var(--note-button-text)] rounded-full"
              : "bg-[var(--glass-bg)] text-[var(--note-button-text)] rounded-2xl hover:bg-[var(--accent)] hover:text-[var(--accent)]"
            } text-xs sm:text-base`}
          style={{
            background: preview ? "var(--accent)" : "var(--glass-bg)",
            border: "1px solid var(--border)",
            boxShadow: preview ? "0 4px 24px 0 rgba(0,0,0,0.10)" : "0 2px 8px 0 rgba(0,0,0,0.04)",
            backdropFilter: "blur(8px) saturate(180%)",
            WebkitBackdropFilter: "blur(8px) saturate(180%)",
          }}
          onClick={() => setPreview(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3 sm:size-4">
            <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
            <path fillRule="evenodd" d="M1.38 8.28a.87.87 0 0 1 0-.566 7.003 7.003 0 0 1 13.238.006.87.87 0 0 1 0 .566A7.003 7.003 0 0 1 1.379 8.28ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd" />
          </svg>
          Preview
        </button>
        {onSave && (
          <button
            className={`
      ml-auto flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors glass-border
      backdrop-blur-lg backdrop-saturate-200 border border-[var(--border)]
      bg-green-600 text-[var(--note-button-text)] rounded-2xl
      hover:bg-green-700
      shadow-lg
      hover:border-green-500
      hover:shadow-[0_0_0_2px_#22c55e,0_4px_24px_0_rgba(0,0,0,0.10)]
      focus-visible:border-green-500
      focus-visible:shadow-[0_0_0_2px_#22c55e,0_4px_24px_0_rgba(0,0,0,0.10)]
      text-xs sm:text-base
    `}
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border)",
              backdropFilter: "blur(8px) saturate(180%)",
              WebkitBackdropFilter: "blur(8px) saturate(180%)",
              transition: "all 0.18s cubic-bezier(.4,2,.6,1)",
            }}
            onClick={onSave}
            type="button"
          >
            Save
          </button>
        )}
        <button
          className={`
    ml-2 px-2 py-1.5 sm:py-2 rounded-full glass-border
    bg-[var(--glass-bg)] border border-[var(--border)]
    backdrop-blur-lg backdrop-saturate-200
    hover:bg-yellow-500 transition
    hover:border-yellow-400
    hover:shadow-[0_0_0_2px_#facc15,0_2px_8px_0_rgba(0,0,0,0.04)]
    focus-visible:border-yellow-400
    focus-visible:shadow-[0_0_0_2px_#facc15,0_2px_8px_0_rgba(0,0,0,0.04)]
    text-xs sm:text-base
  `}
          title="Etiquetas"
          onClick={() => setShowTagModal(true)}
          type="button"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(8px) saturate(180%)",
            WebkitBackdropFilter: "blur(8px) saturate(180%)",
            transition: "all 0.18s cubic-bezier(.4,2,.6,1)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="var(--note-tag-button)"
            className="w-4 h-4 sm:w-5 sm:h-5"
          >
            <path
              fillRule="evenodd"
              d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {renderNoteTags()}

      <div className="flex-1 min-h-0 relative">
        {!preview ? (
          <div className="relative w-full h-full">
            <textarea
              ref={textareaRef}
              className="w-full h-full p-5 resize-none outline-none border rounded-lg font-mono text-base leading-relaxed"
              style={{
                backgroundColor: "transparent",
                color: "var(--foreground)",
                  borderColor: "transparent",
                fontSize: "16px",
                lineHeight: "1.6",
                minHeight: "400px",
                opacity: 1,
              }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Start typing... (Ctrl+Space for note linking)"
              spellCheck={false}
              autoFocus
              onKeyDown={handleKeyDown}
              onBlur={() => setShowAutocomplete(false)}
            />
            {/* Autocomplete dropdown */}
            {showAutocomplete && (
              <div
                className="absolute left-4 top-16 z-50 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-auto"
                style={{ minWidth: 200 }}
              >
                {autocompleteOptions.length === 0 && (
                  <div className="p-2 text-gray-400">No hay notas</div>
                )}
                {autocompleteOptions.map((note, i) => (
                  <div
                    key={note.id}
                    className={`p-2 cursor-pointer ${i === autocompleteIndex ? "bg-[var(--accent)] text-white" : ""
                      }`}
                    onMouseDown={() => {
                      insertNoteLink(note);
                      setShowAutocomplete(false);
                    }}
                  >
                    {note.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <MarkdownPreview 
            value={value} 
            notes={notes}
            onOpenNote={onOpenNote}
          />
        )}
      </div>

      {showTagModal && (
        <TagPickerModal
          tags={tags}
          selectedTagIds={noteTags.map((t) => t.id)}
          onToggle={handleToggleTag}
          onClose={() => setShowTagModal(false)}
          onEdit={onEditTag}
          onDelete={onDeleteTag}
          onCreate={onCreateTag}
        />
      )}
    </div>
  );
}

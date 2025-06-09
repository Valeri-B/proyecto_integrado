"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TagPickerModal from "@/components/TagPickerModal";

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
          className="flex items-center gap-1 px-2 py-1 rounded"
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
          className={`px-4 py-2 rounded font-medium transition-colors ${
            !preview
              ? "bg-[var(--accent)] text-white"
              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
          }`}
          onClick={() => setPreview(false)}
        >
          Editar
        </button>
        <button
          className={`px-4 py-2 rounded font-medium transition-colors ${
            preview
              ? "bg-[var(--accent)] text-white"
              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
          }`}
          onClick={() => setPreview(true)}
        >
          Vista previa
        </button>
        {onSave && (
          <button
            className="ml-auto px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
            onClick={onSave}
          >
            Guardar
          </button>
        )}
        <button
          className="ml-2 px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600"
          title="Etiquetas"
          onClick={() => setShowTagModal(true)}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
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
              className="w-full h-full p-4 resize-none outline-none border rounded-lg font-mono text-base leading-relaxed"
              style={{
                backgroundColor: "var(--panel)",
                color: "var(--foreground)",
                borderColor: "var(--border)",
                fontSize: "16px",
                lineHeight: "1.6",
                minHeight: "400px",
              }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Empieza a escribir tu nota... (Ctrl+Space para vincular notas)"
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
                    className={`p-2 cursor-pointer ${
                      i === autocompleteIndex ? "bg-[var(--accent)] text-white" : ""
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
          <div
            className="w-full h-full p-4 overflow-auto prose max-w-none border rounded-lg"
            style={{
              backgroundColor: "var(--panel)",
              color: "var(--foreground)",
              borderColor: "var(--border)",
              minHeight: "400px",
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ a: LinkRenderer }}
            >
              {value}
            </ReactMarkdown>
          </div>
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

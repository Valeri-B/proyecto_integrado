import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

type Note = {
  id: number;
  title: string;
  folderId?: number | null;
  folder?: { id: number };
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSave?: () => void;
  notes?: Note[];
  onOpenNote?: (note: Note) => void;
};

export default function MarkdownEditor({
  value,
  onChange,
  onSave,
  notes = [],
  onOpenNote,
}: Props) {
  const [preview, setPreview] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState<Note[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Custom link renderer for note links
  function LinkRenderer(props: any) {
    const { href, children } = props;
    
    console.log("🔗 LinkRenderer called with:", { href, children, notesCount: notes.length });
    
    if (!href) {
      // Handle text-only links (fallback)
      const noteTitle = children?.[0] || "";
      const matchingNote = notes.find((n) => 
        n.title.trim().toLowerCase() === noteTitle.toLowerCase()
      );
      
      if (matchingNote) {
        console.log("✅ Found note by text match:", matchingNote.title);
        return (
          <a
            href="#"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
            onClick={(e) => {
              console.log("🖱️ Note link clicked:", matchingNote.title);
              e.preventDefault();
              e.stopPropagation();
              if (onOpenNote) onOpenNote(matchingNote);
            }}
          >
            {children}
          </a>
        );
      }
      
      return <span>{children}</span>;
    }
    
    // Handle #note/title format
    if (href.startsWith('#note/')) {
      const noteTitle = decodeURIComponent(href.replace('#note/', ''));
      const matchingNote = notes.find((n) => 
        n.title.trim().toLowerCase() === noteTitle.toLowerCase()
      );
      
      if (matchingNote) {
        console.log("✅ Found note by href match:", matchingNote.title);
        return (
          <a
            href="#"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
            onClick={(e) => {
              console.log("🖱️ Note link clicked:", matchingNote.title);
              e.preventDefault();
              e.stopPropagation();
              if (onOpenNote) onOpenNote(matchingNote);
            }}
          >
            {children}
          </a>
        );
      }
    }

    console.log("🌐 Rendering as external link");
    // External link
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

  // Handle Ctrl+Space for autocomplete
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
    
    // Use #note/title format instead of note://title
    const link = `[${note.title}](#note/${encodeURIComponent(note.title)})`;
    
    console.log("🔗 Inserting link:", link);
    
    const newValue = before + link + after;
    console.log("📝 New markdown value:", newValue);
    
    onChange(newValue);
    setTimeout(() => {
      textareaRef.current!.focus();
      textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd =
        before.length + link.length;
    }, 0);
  }

  // Position autocomplete dropdown near the cursor (simple version: always bottom left)
  return (
    <div className="flex flex-col gap-4 h-full min-h-0 relative">
      <div className="flex gap-2 mb-2">
        <button
          className={`px-2 py-1 rounded ${
            !preview ? "bg-red-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setPreview(false)}
        >
          Editar
        </button>
        <button
          className={`px-2 py-1 rounded ${
            preview ? "bg-red-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          onClick={() => setPreview(true)}
        >
          Vista previa
        </button>
        {onSave && (
          <button
            className="ml-auto px-2 py-1 bg-green-600 text-white rounded"
            onClick={onSave}
          >
            Guardar
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 relative">
        {!preview ? (
          <div className="relative w-full h-full min-h-0 flex-1 overflow-auto">
            {/* Remove pointer-events-none and opacity: 0 */}
            <div
              className="absolute inset-0 w-full h-full p-2"
              style={{
                whiteSpace: "pre-wrap",
                color: "inherit",
                fontSize: 16,
                zIndex: 0,
                pointerEvents: "none",
                userSelect: "none",
                opacity: 0.3,
              }}
            >
              {value || (
                <span className="text-gray-400">
                  Empieza a escribir tu nota...
                </span>
              )}
            </div>
            <textarea
              ref={textareaRef}
              className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{
                color: "inherit",
                fontSize: 16,
                border: "none",
                background: "transparent",
                zIndex: 1,
                opacity: 1,
                caretColor: "var(--accent)",
              }}
              spellCheck={false}
              autoFocus
              onKeyDown={handleKeyDown}
              onBlur={() => setShowAutocomplete(false)}
            />
            {showAutocomplete && (
              <div
                className="absolute left-2 top-10 z-50 bg-[var(--panel)] border border-[var(--accent)] rounded shadow-lg max-h-48 overflow-auto"
                style={{ minWidth: 200 }}
              >
                {autocompleteOptions.length === 0 && (
                  <div className="px-4 py-2 text-gray-400">No hay notas</div>
                )}
                {autocompleteOptions.map((note, i) => (
                  <div
                    key={note.id}
                    className={`px-4 py-2 cursor-pointer ${
                      i === autocompleteIndex ? "bg-[var(--accent)] text-white" : ""
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
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
          <div className="relative w-full h-full min-h-0 flex-1 overflow-auto prose prose-invert max-w-none p-2 markdown-preview">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ a: LinkRenderer }}
            >
              {value}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

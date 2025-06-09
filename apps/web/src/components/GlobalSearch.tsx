import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Tag = { id: number; name: string; color: string };
type Note = { id: number; title: string; content?: string; tags?: Tag[] };
type Folder = { id: number; name: string; };
type Task = { id: number; content: string; description?: string | null; tags?: Tag[] };

type Props = {
  notes: Note[];
  folders: Folder[];
  tasks: Task[];
  tags: Tag[];
  onOpenNote: (note: Note) => void;
  onOpenFolder: (folder: Folder) => void;
  onOpenTask: (task: Task) => void;
  onOpenTagResults: (tag: Tag) => void;
  showModal: boolean;
  setShowModal: (b: boolean) => void;
  setShiningTaskId?: (id: number | null) => void;
  autoFocus?: boolean;
};

function ciIncludes(str: string, query: string) {
  return str?.toLowerCase().includes(query.toLowerCase());
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-yellow-300 text-black rounded px-1">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function GlobalSearch({
  notes,
  folders,
  tasks,
  tags,
  onOpenNote,
  onOpenFolder,
  onOpenTask,
  onOpenTagResults,
  showModal,
  setShowModal,
  autoFocus = false,
}: Props & { showModal: boolean; setShowModal: (b: boolean) => void; autoFocus?: boolean }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Drag state and modal position
  const [drag, setDrag] = useState<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (showModal && autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [showModal, autoFocus]);

  // Drag handlers
  useEffect(() => {
    if (!drag) {
      document.body.classList.remove("no-select");
      return;
    }
    document.body.classList.add("no-select");
    const handleMouseMove = (e: MouseEvent) => {
      if (modalRef.current) {
        modalRef.current.style.left = `${e.clientX - drag.offsetX}px`;
        modalRef.current.style.top = `${e.clientY - drag.offsetY}px`;
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      setDrag(null);
      setModalPos({
        x: e.clientX - drag.offsetX,
        y: e.clientY - drag.offsetY,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("no-select");
    };
  }, [drag]);

  // When modal opens, reset position to center
  useEffect(() => {
    if (showModal) {
      setModalPos(null);
    }
  }, [showModal]);

  const searchResults = search.trim()
    ? [
      ...tags.filter(t => ciIncludes(t.name, search)).map(t => ({ type: "tag", tag: t })),
      ...notes.filter(n => ciIncludes(n.title, search)).map(n => ({ type: "note-title", note: n })),
      ...folders.filter(f => ciIncludes(f.name, search)).map(f => ({ type: "folder", folder: f })),
      ...notes.filter(n => n.content && ciIncludes(n.content, search) && !ciIncludes(n.title, search)).map(n => ({ type: "note-content", note: n })),
      ...tasks.filter(t => ciIncludes(t.content, search)).map(t => ({ type: "task-title", task: t })),
      ...tasks.filter(t => t.description && ciIncludes(t.description, search)).map(t => ({ type: "task-desc", task: t })),
    ]
    : [];

  const searchBar = (
    <div className="mb-2 relative">
      <div className="flex items-center w-full bg-[var(--glass-bg)]/80 border border-[var(--border)] rounded-full shadow-lg backdrop-blur-lg px-4 py-2 gap-2 transition">
        {/* Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--search-icon)" className="w-5 h-5 opacity-80 text-[var(--foreground)]">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
        </svg>
        {/* Show "Search" and badge only when input is empty */}
        {(!search || search.length === 0) && (
          <>
            <span className="text-[var(--search-text)] text-base font-medium opacity-80 select-none">Search</span>
            <span className="shortcut-badge select-none ml-2">
              Ctrl + Q
            </span>
          </>
        )}
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none border-none text-[var(--foreground)] text-base px-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus={autoFocus}
          aria-label="Buscar"
          style={{ minWidth: 0 }}
        />
      </div>
      {search && (
        <div
          className="mt-2 max-h-64 overflow-auto z-30"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            backdropFilter: "blur(0.5px)",
            WebkitBackdropFilter: "blur(0.5px)",
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          {searchResults.length === 0 && (
            <div className="p-4 text-gray-400">No Results</div>
          )}
          {searchResults.map((result, i) => {
            if (result.type === "tag")
              return (
                <div
                  key={`tag-${result.tag.id}`}
                  className="p-3 cursor-pointer border-b border-gray-700 last:border-b-0 flex items-center transition"
                  style={{
                    borderRadius: 10,
                    transition: "background 0.18s, box-shadow 0.18s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(245, 61, 79, 0.13)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px 0 rgba(31,38,135,0.10)";
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--accent)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--border)";
                  }}
                  onClick={() => {
                    onOpenTagResults(result.tag);
                    setShowModal(false);
                  }}
                >
                  {/* Tag SVG with tag color */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill={result.tag.color}
                    stroke={result.tag.color}
                    strokeWidth={1.5}
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      fill={result.tag.color}
                      stroke={result.tag.color}
                      strokeWidth="1.5"
                      d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5Z"
                    />
                    <circle fill={result.tag.color} cx="5" cy="6" r="1" />
                  </svg>
                  <span className="text-sm" style={{ color: "var(--search-result-text)" }}>Tag</span>
                  <span className="font-medium ml-1" style={{ color: "var(--search-result-text)" }}>{highlightMatch(result.tag.name, search)}</span>
                </div>
              );
            if (result.type === "note-title" || result.type === "note-content")
              return (
                <div
                  key={`note-${result.type}-${result.note.id}`}
                  className="p-3 cursor-pointer border-b border-gray-700 last:border-b-0 flex items-center transition"
                  style={{
                    borderRadius: 10,
                    transition: "background 0.18s, box-shadow 0.18s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(245, 61, 79, 0.13)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px 0 rgba(31,38,135,0.10)";
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--accent)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--border)";
                  }}
                  onClick={() => {
                    onOpenNote(result.note);
                    setShowModal(false);
                  }}
                >
                  {/* Note SVG  */}
                  <svg
                    width="1em"
                    height="1em"
                    viewBox="0 0 1024 1024"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 mr-2"
                    fill="var(--note-icon-search-result)"
                  >
                    <rect x="192" y="192" width="640" height="640" rx="120" ry="120" />
                  </svg>
                  <div className="text-sm mr-2" style={{ color: "var(--search-result-text)" }}>
                    {result.type === "note-title" ? "Note" : "Contenido de nota"}
                  </div>
                  <div className="font-medium" style={{ color: "var(--search-result-text)" }}>
                    {result.type === "note-title"
                      ? highlightMatch(result.note.title, search)
                      : result.note.title}
                  </div>
                  {result.type === "note-content" && (
                    <div className="text-gray-400 text-sm truncate ml-2">
                      ...{highlightMatch(result.note.content?.substring(0, 100) || "", search)}...
                    </div>
                  )}
                </div>
              );
            if (result.type === "folder")
              return (
                <div
                  key={`folder-${result.folder.id}`}
                  className="p-3 cursor-pointer border-b border-gray-700 last:border-b-0 flex items-center transition"
                  style={{
                    borderRadius: 10,
                    transition: "background 0.18s, box-shadow 0.18s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(245, 61, 79, 0.13)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px 0 rgba(31,38,135,0.10)";
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--accent)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--border)";
                  }}
                  onClick={() => {
                    onOpenFolder(result.folder);
                    setShowModal(false);
                  }}
                >
                  {/* Folder SVG with folder color */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 48 48"
                    fill={result.folder.color || "currentColor"}
                    className="w-5 h-5 mr-2"
                  >
                    <path d="M40,12H22l-4-4H8c-2.2,0-4,1.8-4,4v24c0,2.2,1.8,4,4,4h29.7L44,29V16C44,13.8,42.2,12,40,12z"></path>
                    <path d="M40,12H8c-2.2,0-4,1.8-4,4v20c0,2.2,1.8,4,4,4h32c2.2,0,4-1.8,4-4V16C44,13.8,42.2,12,40,12z"></path>
                  </svg>
                  <div className="text-sm mr-2" style={{ color: "var(--search-result-text)" }}>Folder</div>
                  <div className="font-medium" style={{ color: "var(--search-result-text)" }}>
                    {highlightMatch(result.folder.name, search)}
                  </div>
                </div>
              );
            if (result.type === "task-title" || result.type === "task-desc")
              return (
                <div
                  key={`task-${result.type}-${result.task.id}`}
                  className="p-3 cursor-pointer border-b border-gray-700 last:border-b-0 flex items-center transition"
                  style={{
                    borderRadius: 10,
                    transition: "background 0.18s, box-shadow 0.18s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(245, 61, 79, 0.13)"; 
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px 0 rgba(31,38,135,0.10)";
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--accent)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLDivElement).style.border = "1px solid var(--border)";
                  }}
                  onClick={() => {
                    onOpenTask(result.task);
                    setShowModal(false);
                  }}
                >
                  {/* Task SVG with */}
                  <svg
                    fill="var(--task-icon-search-result)"
                    width="1em"
                    height="1em"
                    viewBox="-2 -2 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 mr-2"
                  >
                    <path d="M6 0h8a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6zm6 9a1 1 0 0 0 0 2h3a1 1 0 1 0 0-2h-3zm-2 4a1 1 0 0 0 0 2h5a1 1 0 1 0 0-2h-5zm0-8a1 1 0 1 0 0 2h5a1 1 0 0 0 0-2h-5zm-4.172 5.243l-.707-.707a1 1 0 1 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.415 0l2.828-2.828A1 1 0 0 0 7.95 8.12l-2.122 2.122z" />
                  </svg>
                  <div className="text-sm mr-2" style={{ color: "var(--search-result-text)" }}>
                    Task {result.type === "task-desc" ? "(descripción)" : ""}
                  </div>
                  <div className="font-medium" style={{ color: "var(--search-result-text)" }}>
                    {result.type === "task-title"
                      ? highlightMatch(result.task.content, search)
                      : result.task.content}
                  </div>
                  {result.type === "task-desc" && (
                    <div className="text-gray-400 text-sm truncate ml-2">
                      {highlightMatch(result.task.description || "", search)}
                    </div>
                  )}
                </div>
              );
            return null;
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={modalRef}
        className={`
          flex flex-col gap-4 w-full max-w-lg absolute animate-fade-in pointer-events-auto cursor-move
          border border-[var(--border)]
        `}
        style={{
          minWidth: 320,
          left: drag
            ? drag.x
            : modalPos
            ? modalPos.x
            : "50%",
          top: drag
            ? drag.y
            : modalPos
            ? modalPos.y
            : "25%",
          transform:
            drag || modalPos
              ? "none"
              : "translate(-50%, 0)",
          background: "rgba(255, 255, 255, 0.05)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          backdropFilter: "blur(2.5px)",
          WebkitBackdropFilter: "blur(2.5px)",
          borderRadius: 10,
          padding: 24,
        }}
        onMouseDown={e => {
          if (e.target === modalRef.current) {
            const rect = modalRef.current.getBoundingClientRect();
            setDrag({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
              offsetX: e.clientX - rect.left,
              offsetY: e.clientY - rect.top,
            });
          }
        }}
      >
        <div
          className="w-full h-6 cursor-move flex items-center justify-between"
          style={{ marginBottom: 8 }}
          onMouseDown={e => {
            const rect = modalRef.current!.getBoundingClientRect();
            setDrag({
              x: rect.left,
              y: rect.top,
              offsetX: e.clientX - rect.left,
              offsetY: e.clientY - rect.top,
            });
          }}
        >
          <span className="text-sm font-medium text-[var(--accent-muted)]">
            Global Search
          </span>
          <button
            className="text-[var(--accent-muted)] hover:text-[var(--foreground)] transition-colors"
            onClick={() => setShowModal(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        {searchBar}
      </div>
    </div>
  );
}
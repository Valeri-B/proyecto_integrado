import { useState } from "react";

export default function TagPickerModal({
  tags,
  selectedTagIds,
  onToggle,
  onClose,
  onEdit,
  onDelete,
  onCreate,
}: {
  tags: { id: number; name: string; color: string }[];
  selectedTagIds: number[];
  onToggle: (tagId: number) => void;
  onClose: () => void;
  onEdit: (id: number, name: string, color: string) => void;
  onDelete: (id: number) => void;
  onCreate: (name: string, color: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#8b232d");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#8b232d");

  const filtered = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const handleToggleTag = (tagId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(tagId);
    // Don't close modal - let user select multiple tags
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div
        className="rounded-4xl p-8 max-w-2xl relative border glass-border shadow-2xl flex flex-col bg-clip-padding animate-scale-in"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px) saturate(200%)",
          WebkitBackdropFilter: "blur(16px) saturate(200%)",
          border: "1px solid var(--border)",
          position: "static",
          minWidth: 420,
          maxWidth: 600,
          boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
        }}
      >
        <button
          className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-red-600"
          onClick={onClose}
          aria-label="close"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">Tags</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 p-2 rounded-full glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
            placeholder="Search tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-3 py-1 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
            onClick={() => setShowNew(true)}
          >
            New tag
          </button>
        </div>
        {showNew && (
          <div className="flex gap-2 mb-4 items-center">
            <input
              className="flex-1 p-2 rounded-full glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
              placeholder="Tag name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              className="w-10 h-10 border-none rounded-full glass-border bg-[var(--glass-bg)] backdrop-blur-lg transition"
            />
            <button
              className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-3 py-1 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
              onClick={() => {
                onCreate(newName, newColor);
                setNewName("");
                setNewColor("#8b232d");
                setShowNew(false);
              }}
            >
              Create
            </button>
          </div>
        )}
        <ul>
          {filtered.map(tag => (
            <li key={tag.id} className="flex items-center gap-2 py-2">
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  if (confirm("Delete this tag?")) onDelete(tag.id);
                }}
                title="Delete tag"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                </svg>
              </button>
              {editingId === tag.id ? (
                <>
                  <input
                    className="flex-1 p-1 rounded-full glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="w-8 h-8 border-none rounded-full glass-border bg-[var(--glass-bg)] backdrop-blur-lg transition"
                  />
                  <button
                    className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-2 py-1 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
                    onClick={() => {
                      onEdit(tag.id, editName, editColor);
                      setEditingId(null);
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-2 py-1 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`
    flex-1 flex items-center gap-2 px-2 py-1 transition
    glass-border
    ${selectedTagIds.includes(tag.id)
      ? "rounded-xl bg-yellow-100 dark:bg-yellow-900 border-2 border-[var(--accent)] shadow-lg"
      : "rounded-full bg-[var(--glass-bg)] border border-[var(--border)] opacity-80 hover:opacity-100"}
  `}
                    style={{
                      border: `2px solid ${tag.color || "#8b232d"}`,
                      background: "var(--glass-bg)",
                      backdropFilter: "blur(6px) saturate(160%)",
                      WebkitBackdropFilter: "blur(6px) saturate(160%)",
                      color: "var(--tasks-tag-text-color)",
                      boxShadow: selectedTagIds.includes(tag.id)
                        ? "0 4px 24px 0 rgba(0,0,0,0.10)"
                        : "0 2px 8px 0 rgba(0,0,0,0.04)",
                      transition: undefined, // Remove transition for border-radius
                    }}
                    onClick={(e) => handleToggleTag(tag.id, e)}
                  >
                    {selectedTagIds.includes(tag.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={tag.color || "currentColor"} className="w-5 h-5">
                        <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span style={{ color: tag.color || "#8b232d" }}>{tag.name}</span>
                  </button>
                  <button
                    className="text-gray-400 hover:text-blue-600"
                    onClick={() => {
                      setEditingId(tag.id);
                      setEditName(tag.name);
                      setEditColor(tag.color || "#8b232d");
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                      <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                    </svg>

                  </button>
                  {selectedTagIds.includes(tag.id) && (
                    <button
                      className="ml-1"
                      title="Remove tag"
                      onClick={(e) => handleToggleTag(tag.id, e)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
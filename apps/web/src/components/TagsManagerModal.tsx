import { useState, useRef, useEffect } from "react";

export default function TagsManagerModal({
  tags,
  onClose,
  onCreate,
  onEdit,
  onDelete,
  userId,
}: {
  tags: { id: number; name: string; color: string }[];
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
  onEdit: (id: number, name: string, color: string) => void;
  onDelete: (id: number) => void;
  userId: number;
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#8b232d");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#8b232d");
  const editRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);

  // --- Track if color picker is open ---
  const colorPickerOpen = useRef(false);
  function handleColorMouseDown() {
    colorPickerOpen.current = true;
  }
  function handleColorBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTimeout(() => {
      colorPickerOpen.current = false;
    }, 200);
    if (
      e.relatedTarget &&
      (e.relatedTarget as HTMLElement).getAttribute("data-edit-input") === "true"
    ) {
      return;
    }
    if (colorPickerOpen.current) return;
    if (editingId !== null) {
      onEdit(editingId, editName, editColor);
      setEditingId(null);
    }
  }
  function handleEditBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (
      e.relatedTarget &&
      (e.relatedTarget as HTMLElement).getAttribute("data-color-input") === "true"
    ) {
      return;
    }
    if (colorPickerOpen.current) return;
    if (editingId !== null) {
      onEdit(editingId, editName, editColor);
      setEditingId(null);
    }
  }
  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const filtered = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div
        className="
          rounded-4xl
          p-8
          max-w-2xl
          relative
          border
          glass-border
          shadow-2xl
          flex flex-col
          bg-clip-padding
          animate-scale-in
        "
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px) saturate(200%)",
          WebkitBackdropFilter: "blur(16px) saturate(200%)",
          border: "1px solid var(--border)",
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          minWidth: 420,
          maxWidth: 600,
        }}
      >
        <button className="absolute top-3 right-3 text-2xl" onClick={onClose}>×</button>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 p-2 rounded border border-gray-700"
            placeholder="Buscar tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="bg-[var(--accent)] text-white px-3 py-1 rounded" onClick={() => setShowNew(true)}>
            Nuevo tag
          </button>
        </div>
        {showNew && (
          <div className="flex gap-2 mb-4 items-center">
            <input
              className="flex-1 p-2 rounded border border-gray-700"
              placeholder="Nombre"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              className="w-8 h-8 border-none"
            />
            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={() => {
                onCreate(newName, newColor);
                setNewName(""); setNewColor("#8b232d"); setShowNew(false);
              }}
            >Crear</button>
          </div>
        )}
        <ul>
          {filtered.map(tag => (
            <li key={tag.id} className="flex items-center gap-2 py-2">
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  if (confirm("¿Eliminar este tag?")) onDelete(tag.id);
                }}
                title="Eliminar tag"
              >🗑</button>
              {editingId === tag.id ? (
                <>
                  <input
                    ref={editRef}
                    className="flex-1 p-1 rounded border border-gray-700"
                    value={editName}
                    data-edit-input="true"
                    onChange={e => setEditName(e.target.value)}
                    onBlur={handleEditBlur}
                  />
                  <input
                    ref={colorRef}
                    type="color"
                    value={editColor}
                    data-color-input="true"
                    onChange={e => setEditColor(e.target.value)}
                    onMouseDown={handleColorMouseDown}
                    onBlur={handleColorBlur}
                    className="w-8 h-8 border-none"
                  />
                  <span className="w-8 h-8" />
                </>
              ) : (
                <>
                  <span
                    className="flex-1 cursor-pointer"
                    style={{ color: tag.color || "#8b232d" }}
                    onClick={() => { setEditingId(tag.id); setEditName(tag.name); setEditColor(tag.color || "#8b232d"); }}
                  >{tag.name}</span>
                  <button
                    className="text-gray-400 hover:text-blue-600"
                    onClick={() => { setEditingId(tag.id); setEditName(tag.name); setEditColor(tag.color || "#8b232d"); }}
                  >
                    ✏️
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
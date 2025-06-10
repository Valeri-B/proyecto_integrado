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
  const [drag, setDrag] = useState<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setDrag({
        x: rect.left,
        y: rect.top,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    if (!drag) return;

    const handleMouseMove = (e: MouseEvent) => {
      setModalPos({
        x: e.clientX - drag.offsetX,
        y: e.clientY - drag.offsetY,
      });
    };
    const handleMouseUp = () => setDrag(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.classList.add("no-select");

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("no-select");
    };
  }, [drag]);

  // Reset to center when opened
  useEffect(() => {
    if (!modalPos && !drag) {
      // Center modal by default
      setModalPos(null);
    }
  }, [drag, modalPos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div
        ref={modalRef}
        className="rounded-4xl p-8 max-w-2xl relative border glass-border shadow-2xl flex flex-col bg-clip-padding animate-scale-in"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px) saturate(200%)",
          WebkitBackdropFilter: "blur(16px) saturate(200%)",
          border: "1px solid var(--border)",
          position: "fixed",
          left: modalPos ? modalPos.x : "50%",
          top: modalPos ? modalPos.y : "50%",
          transform: modalPos ? "none" : "translate(-50%, -50%)",
          minWidth: 420,
          maxWidth: 600,
          cursor: drag ? "move" : "default",
          zIndex: 100,
        }}
      >
        {/* Drag handle */}
        <div
          className="w-full h-6 cursor-move flex items-center justify-between"
          style={{ marginBottom: 8 }}
          onMouseDown={handleMouseDown}
        >
          <span className="font-bold text-lg">Tags Manager</span>
          <button className="text-2xl" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 p-2 rounded-xl border border-gray-700"
            placeholder="Search tags"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ color: "var(--search-tag-text)" }}
          />
          <button className="bg-[var(--accent)] text-white px-3 py-1 rounded-xl" onClick={() => setShowNew(true)}>
            New tag
          </button>
        </div>
        {showNew && (
          <div className="flex gap-2 mb-4 items-center">
            <input
              className="flex-1 p-2 rounded-xl border border-gray-700"
              placeholder="Nombre"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ color: "var(--search-tag-text)" }}
            />
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              className="w-10 h-10 border-none rounded-full glass-border bg-[var(--glass-bg)] backdrop-blur-lg backdrop-saturate-200 transition"
            />
            <button
              className="bg-green-600 text-white px-6 py-2 font-semibold rounded-full glass-border backdrop-blur-lg backdrop-saturate-200 fab-modal-create-btn"
              onClick={() => {
                onCreate(newName, newColor);
                setNewName(""); setNewColor("#8b232d"); setShowNew(false);
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
                  if (confirm("¿Eliminar este tag?")) onDelete(tag.id);
                }}
                title="Eliminar tag"
              ><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
                  <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
                </svg>
              </button>
              {editingId === tag.id ? (
                <>
                  <input
                    ref={editRef}
                    className="flex-1 p-1 rounded-2xl border border-gray-700"
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
                    className="w-8 h-8 border-none rounded-full glass-border"
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
                      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                    </svg>

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
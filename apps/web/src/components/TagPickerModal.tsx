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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-[var(--panel)] rounded-2xl p-6 w-full max-w-lg relative">
        <button className="absolute top-3 right-3 text-2xl" onClick={onClose}>×</button>
        <h2 className="text-lg font-bold mb-4">Tags</h2>
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
                setNewName(""); 
                setNewColor("#8b232d"); 
                setShowNew(false);
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
                    className="flex-1 p-1 rounded border border-gray-700"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="w-8 h-8 border-none"
                  />
                  <button
                    className="bg-green-600 text-white px-2 py-1 rounded"
                    onClick={() => {
                      onEdit(tag.id, editName, editColor);
                      setEditingId(null);
                    }}
                  >Guardar</button>
                  <button
                    className="bg-gray-400 text-white px-2 py-1 rounded"
                    onClick={() => setEditingId(null)}
                  >Cancelar</button>
                </>
              ) : (
                <>
                  <button
                    className={`flex-1 flex items-center gap-2 rounded px-2 py-1 transition ${selectedTagIds.includes(tag.id) ? "bg-yellow-100 dark:bg-yellow-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                    style={{ border: `2px solid ${tag.color || "#8b232d"}` }}
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
                    ✏️
                  </button>
                  {selectedTagIds.includes(tag.id) && (
                    <button
                      className="ml-1"
                      title="Quitar tag"
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
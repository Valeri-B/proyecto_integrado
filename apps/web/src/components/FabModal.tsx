import { useEffect } from "react";

export default function FabModal({
  fabMode,
  setFabMode,
  setShowFabModal,
  handleCreateNote,
  handleCreateFolder,
  newNoteTitle,
  setNewNoteTitle,
  newFolderName,
  setNewFolderName,
  newFolderColor,
  setNewFolderColor,
  creating,
  folders,
  parentFolderId,
  setParentFolderId,
}: {
  fabMode: "note" | "folder" | null;
  setFabMode: (mode: "note" | "folder" | null) => void;
  setShowFabModal: (b: boolean) => void;
  handleCreateNote: (e: React.FormEvent) => void;
  handleCreateFolder: (e: React.FormEvent) => void;
  newNoteTitle: string;
  setNewNoteTitle: (s: string) => void;
  newFolderName: string;
  setNewFolderName: (s: string) => void;
  newFolderColor: string;
  setNewFolderColor: (s: string) => void;
  creating: boolean;
  folders: { id: number; name: string }[];
  parentFolderId: number | null;
  setParentFolderId: (id: number | null) => void;
}) {
  // Reset parent folder when modal closes
  useEffect(() => {
    if (!fabMode) setParentFolderId(null);
  }, [fabMode, setParentFolderId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div
        className="
          backdrop-blur-lg
          backdrop-saturate-200
          border
          border-[var(--border)]
          rounded-4xl
          shadow-2xl
          w-full max-w-sm
          flex flex-col
          gap-4
          p-8
          glass-border
          animate-scale-in
          relative
        "
        style={{
          background: "var(--glass-bg)",
        }}
      >
        {fabMode === "note" && (
          <form className="flex flex-col gap-4 mt-2" onSubmit={handleCreateNote}>
            <h2 className="text-lg font-bold">New note</h2>
            <input
              className="p-2 rounded border border-gray-700"
              placeholder="Note Title"
              value={newNoteTitle}
              onChange={e => setNewNoteTitle(e.target.value)}
              required
              autoFocus
            />
            <select
              className="p-2 rounded border border-gray-700"
              value={parentFolderId ?? ""}
              onChange={e => setParentFolderId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No Folder selected(optional)</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button
              className="bg-[var(--accent)] text-white px-4 py-2 rounded font-semibold"
              type="submit"
              disabled={creating}
            >
              Create
            </button>
          </form>
        )}
        {fabMode === "folder" && (
          <form className="flex flex-col gap-4 mt-2" onSubmit={handleCreateFolder}>
            <h2 className="text-lg font-bold">New Folder</h2>
            <input
              className="p-2 rounded border border-gray-700"
              placeholder="Folder Name"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              required
              autoFocus
            />
            <select
              className="p-2 rounded border border-gray-700"
              value={parentFolderId ?? ""}
              onChange={e => setParentFolderId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No Folder selected(optional)</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <input
              type="color"
              value={newFolderColor}
              onChange={e => setNewFolderColor(e.target.value)}
              className="w-8 h-8 border-none"
            />
            <button
              className="bg-[var(--accent)] text-white px-4 py-2 rounded font-semibold"
              type="submit"
              disabled={creating}
            >
              Create
            </button>
          </form>
        )}
        <button
          className="absolute top-3 right-3 text-2xl"
          onClick={() => setShowFabModal(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";

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
  const [drag, setDrag] = useState<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset parent folder when modal closes
  useEffect(() => {
    if (!fabMode) setParentFolderId(null);
  }, [fabMode, setParentFolderId]);

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
      setModalPos(null);
    }
  }, [drag, modalPos]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div
        ref={modalRef}
        className="
          fab-modal-glass
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
          position: "fixed",
          left: modalPos ? modalPos.x : "50%",
          top: modalPos ? modalPos.y : "50%",
          transform: modalPos ? "none" : "translate(-50%, -50%)",
          cursor: drag ? "move" : "default",
          zIndex: 100,
        }}
      >
        <div
          className="w-full h-6 cursor-move flex items-center justify-between"
          style={{ marginBottom: 8 }}
          onMouseDown={handleMouseDown}
        >
          <span className="font-bold text-lg">
            {fabMode === "note" ? "New Note" : fabMode === "folder" ? "New Folder" : ""}
          </span>
          <button className="text-2xl" onClick={() => setShowFabModal(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        {fabMode === "note" && (
          <form className="flex flex-col gap-4 mt-2" onSubmit={handleCreateNote}>
            <input
              className="p-2 rounded-xl border border-gray-700 new-note-modal-text"
              placeholder="Note Title"
              value={newNoteTitle}
              onChange={e => setNewNoteTitle(e.target.value)}
              required
              autoFocus
            />
            <select
              className="p-2 rounded-xl border border-gray-700 new-note-modal-text"
              style={{ backgroundColor: "var(--new-note-modal-select-bg)" }}
              value={parentFolderId ?? ""}
              onChange={e => setParentFolderId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No Folder selected(optional)</option>
              {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button
              className="fab-modal-create-btn px-6 py-1 font-semibold rounded-full"
              type="submit"
              disabled={creating}
            >
              Create
            </button>
          </form>
        )}
        {fabMode === "folder" && (
          <form className="flex flex-col gap-4 mt-2" onSubmit={handleCreateFolder}>
            <input
              className="p-2 rounded-xl border border-gray-700"
              placeholder="Folder Name"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              required
              autoFocus
              style={{ color: "var(--new-folder-modal-text)" }}
            />
            <select
              className="p-2 rounded-xl border border-gray-700"
              value={parentFolderId ?? ""}
              onChange={e => setParentFolderId(e.target.value ? Number(e.target.value) : null)}
              style={{ backgroundColor: "var(--new-folder-modal-select-bg)", color: "var(--new-folder-modal-text)" }}
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
              className="w-80 h-8 border-none rounded-full glass-border"
            />
            <button
              className="fab-modal-create-btn px-6 py-1 font-semibold rounded-full"
              type="submit"
              disabled={creating}
            >
              Create
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
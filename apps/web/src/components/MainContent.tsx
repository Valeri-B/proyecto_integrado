import TasksBoard from "@/components/TasksBoard";
import MarkdownEditor from "@/components/MarkdownEditor";
import Heatmap from "@/components/Heatmap";
import React from "react";

export default function MainContent({
  activeView,
  notes,
  folders,
  tasks,
  selectedNote,
  setSelectedNote,
  noteDraft,
  setNoteDraft,
  userId,
  tasksBoardKey,
  shiningTaskId,
  onShineEnd,
  onOpenNote,
  onMove,
  selectedFolderSidebarId,
  setSelectedFolderSidebarId,
  notesView,
  setNotesView,
  foldersSidebarCollapsed,
  onSaveNote,
  onCloseNote,
  tags,
  handleEditTag,
  handleDeleteTag,
  handleCreateTag,
  updateNoteTags,
}: {
  activeView: "notes" | "folders" | "heatmap";
  notes: any[];
  folders: any[];
  tasks: any[];
  selectedNote: any;
  setSelectedNote: (note: any) => void;
  noteDraft: string;
  setNoteDraft: (val: string) => void;
  userId: number;
  tasksBoardKey?: number;
  shiningTaskId?: number | null;
  onShineEnd?: () => void;
  onOpenNote?: (note: any) => void;
  onMove?: () => void;
  selectedFolderSidebarId?: number | null;
  setSelectedFolderSidebarId?: (id: number | null) => void;
  notesView?: "list" | "grid";
  setNotesView?: (v: "list" | "grid") => void;
  foldersSidebarCollapsed?: boolean;
  onSaveNote?: () => void;
  onCloseNote?: () => void;
  tags: any[];
  handleEditTag: (id: number, name: string, color: string) => void;
  handleDeleteTag: (id: number) => void;
  handleCreateTag: (name: string, color: string) => void;
  updateNoteTags: (noteId: number, tags: any[]) => void;
}) {
  if (activeView === "folders") {
    if (!userId) return <div className="text-white">Cargando usuario...</div>;
    return (
      <TasksBoard
        key={tasksBoardKey}
        userId={userId}
        shiningTaskId={shiningTaskId}
        onShineEnd={onShineEnd}
        tags={tags}
        onEditTag={handleEditTag}
        onDeleteTag={handleDeleteTag}
        onCreateTag={handleCreateTag}
      />
    );
  }
  if (activeView === "heatmap") {
    return <Heatmap />;
  }

  function getNoteFolderId(note: any): number | null {
    if (typeof note.folderId === "number") return note.folderId;
    if (note.folder && typeof note.folder.id === "number") return note.folder.id;
    return null;
  }
  function getChildFolders(parentId: number | null, folders: any[]) {
    return folders.filter(f =>
      (f.parentId ?? (f.parent?.id ?? null)) === parentId
    );
  }

  return (
    <div className="p-4">
      {selectedNote ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-4">
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 mr-4"
              onClick={onCloseNote}
            >
              ← Cerrar
            </button>
            <div className="font-bold text-2xl truncate">{selectedNote.title}</div>
          </div>
          <div className="flex-1 min-h-0">
            <MarkdownEditor
              value={noteDraft}
              onChange={setNoteDraft}
              onSave={onSaveNote}
              notes={notes}
              onOpenNote={onOpenNote}
              noteId={selectedNote?.id}
              userId={userId}
              tags={tags}
              noteTags={selectedNote?.tags || []}
              setNoteTags={tags => {
                updateNoteTags(selectedNote.id, tags);
              }}
              onEditTag={handleEditTag}
              onDeleteTag={handleDeleteTag}
              onCreateTag={handleCreateTag}
            />
          </div>
        </div>
      ) : (
        <div>
          {/* View toggle */}
          <div className="mb-4 flex items-center gap-2">
            <button
              className={`flex items-center justify-center w-10 h-10 rounded ${notesView === "grid" ? "bg-red-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
              onClick={() => setNotesView && setNotesView("grid")}
              title="Vista de cuadrícula"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor"/>
                <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor"/>
                <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor"/>
                <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor"/>
              </svg>
            </button>
            <button
              className={`flex items-center justify-center w-10 h-10 rounded ${notesView === "list" ? "bg-red-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
              onClick={() => setNotesView && setNotesView("list")}
              title="Vista de lista"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                <rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor"/>
                <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor"/>
                <rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
          {/* Notes and folders */}
          {notesView === "grid" ? (
            <div className="flex flex-wrap gap-6"
              onDrop={async e => {
                const type = e.dataTransfer.getData("type");
                const id = Number(e.dataTransfer.getData("id"));
                if (type === "note") {
                  const token = localStorage.getItem("token");
                  const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
                  const userId = payload.sub;
                  await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/notes/${id}/move`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ folderId: null, userId }),
                    }
                  );
                  if (onMove) onMove();
                }
                if (type === "folder") {
                  const token = localStorage.getItem("token");
                  const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
                  const userId = payload.sub;
                  await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/folders/${id}/move`,
                    {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ parentId: null, userId }),
                    }
                  );
                  if (onMove) onMove();
                }
              }}
              onDragOver={e => e.preventDefault()}
            >
              {/* Folders */}
              {getChildFolders(selectedFolderSidebarId ?? null, folders).map(folder => (
                <div
                  key={"folder-" + folder.id}
                  className="relative cursor-pointer transition-all duration-200 hover:scale-105 flex items-center justify-center"
                  style={{
                    width: 155,
                    height: 155,
                  }}
                  onClick={() => setSelectedFolderSidebarId && setSelectedFolderSidebarId(folder.id)}
                  title={folder.name}
                  draggable
                  onDragStart={e => {
                    e.stopPropagation();
                    e.dataTransfer.setData("type", "folder");
                    e.dataTransfer.setData("id", folder.id);
                  }}
                  onDrop={async e => {
                    e.stopPropagation();
                    const type = e.dataTransfer.getData("type");
                    const id = Number(e.dataTransfer.getData("id"));
                    if (type === "folder" && id !== folder.id) {
                      const token = localStorage.getItem("token");
                      const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
                      const userId = payload.sub;
                      await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/folders/${id}/move`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ parentId: folder.id, userId }),
                        }
                      );
                      if (onMove) onMove();
                    }
                    if (type === "note") {
                      const token = localStorage.getItem("token");
                      const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
                      const userId = payload.sub;
                      await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/notes/${id}/move`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ folderId: folder.id, userId }),
                        }
                      );
                      if (onMove) onMove();
                    }
                  }}
                  onDragOver={e => e.preventDefault()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-20 h-20"
                    style={{ color: folder.color || "#8b232d" }}
                    fill="currentColor"
                    draggable={false}
                  >
                    <path d="M40,12H22l-4-4H8c-2.2,0-4,1.8-4,4v24c0,2.2,1.8,4,4,4h29.7L44,29V16C44,13.8,42.2,12,40,12z"></path>
                    <path d="M40,12H8c-2.2,0-4,1.8-4,4v20c0,2.2,1.8,4,4,4h32c2.2,0,4-1.8,4-4V16C44,13.8,42.2,12,40,12z"></path>
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center font-bold text-base text-white text-center px-2 pointer-events-none"
                    style={{
                      textShadow: "0 2px 8px rgba(0,0,0,0.35), 0 1px 0 #000",
                    }}
                  >
                    {folder.name}
                  </span>
                </div>
              ))}
              {/* Notes */}
              {notes
                .filter(note =>
                  selectedFolderSidebarId === null
                    ? getNoteFolderId(note) === null
                    : getNoteFolderId(note) === selectedFolderSidebarId
                )
                .map(note => (
                  <div
                    key={note.id}
                    className={`rounded-2xl shadow bg-[var(--panel)] cursor-pointer border border-[var(--border)] transition-all duration-200 hover:shadow-lg hover:border-[var(--accent)] flex items-center justify-center
                      ${selectedNote?.id === note.id ? "ring-2 ring-[var(--accent)] scale-105" : ""}
                    `}
                    style={{
                      width: 110,
                      height: 110,
                      padding: 12,
                      overflow: "hidden",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onClick={() => onOpenNote && onOpenNote(note)}
                    draggable
                    onDragStart={e => {
                      e.stopPropagation();
                      e.dataTransfer.setData("type", "note");
                      e.dataTransfer.setData("id", note.id);
                    }}
                  >
                    <div className="font-bold text-lg text-center truncate w-full">{note.title}</div>
                  </div>
                ))}
              {/* Empty state */}
              {getChildFolders(selectedFolderSidebarId ?? null, folders).length === 0 &&
                notes.filter(note =>
                  selectedFolderSidebarId === null
                    ? getNoteFolderId(note) === null
                    : getNoteFolderId(note) === selectedFolderSidebarId
                ).length === 0 && (
                  <div className="text-gray-400">No hay carpetas ni notas en esta carpeta.</div>
                )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Folders */}
              {getChildFolders(selectedFolderSidebarId ?? null, folders).map(folder => (
                <div
                  key={"folder-" + folder.id}
                  className="rounded-xl shadow cursor-pointer border border-[var(--border)] transition-all duration-200 hover:shadow-lg hover:border-[var(--accent)] flex items-center px-4 py-3"
                  style={{
                    background: folder.color || "var(--panel)",
                    color: "#fff",
                  }}
                  onClick={() => setSelectedFolderSidebarId && setSelectedFolderSidebarId(folder.id)}
                  title={folder.name}
                >
                  <svg className="w-6 h-6 mr-3" fill={folder.color || "#fff"} viewBox="0 0 24 24">
                    <path d="M10 4H2v16h20V6H12l-2-2z" />
                  </svg>
                  <div className="font-bold text-base truncate flex-1">{folder.name}</div>
                </div>
              ))}
              {/* Notes */}
              {notes
                .filter(note =>
                  selectedFolderSidebarId === null
                    ? getNoteFolderId(note) === null
                    : getNoteFolderId(note) === selectedFolderSidebarId
                )
                .map(note => (
                  <div
                    key={note.id}
                    className={`rounded-xl shadow bg-[var(--panel)] cursor-pointer border border-[var(--border)] transition-all duration-200 hover:shadow-lg hover:border-[var(--accent)] flex items-center px-4 py-3
                      ${selectedNote?.id === note.id ? "ring-2 ring-[var(--accent)] scale-105" : ""}
                    `}
                    onClick={() => onOpenNote && onOpenNote(note)}
                  >
                    <img src="/icons_svg/note_icon_fill_when_clicked.svg" className="w-6 h-6 mr-3" alt="Nota" />
                    <div className="font-bold text-base truncate flex-1">{note.title}</div>
                  </div>
                ))}
              {getChildFolders(selectedFolderSidebarId ?? null, folders).length === 0 &&
                notes.filter(note =>
                  selectedFolderSidebarId === null
                    ? getNoteFolderId(note) === null
                    : getNoteFolderId(note) === selectedFolderSidebarId
                ).length === 0 && (
                  <div className="text-gray-400">No hay carpetas ni notas en esta carpeta.</div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
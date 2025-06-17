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
    if (!userId) return <div className="text-white">Loading...</div>;
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
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--glass-bg)] border border-[var(--border)] text-[var(--foreground)] shadow-lg backdrop-blur-lg backdrop-saturate-200 transition hover:bg-[var(--accent)] hover:text-white mr-4"
              style={{
                backdropFilter: "blur(8px) saturate(180%)",
                WebkitBackdropFilter: "blur(8px) saturate(180%)",
                background: "var(--glass-bg)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
                transition: "all 0.18s cubic-bezier(.4,2,.6,1)",
              }}
              onClick={onCloseNote}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M14 4.75A2.75 2.75 0 0 0 11.25 2h-3A2.75 2.75 0 0 0 5.5 4.75v.5a.75.75 0 0 0 1.5 0v-.5c0-.69.56-1.25 1.25-1.25h3c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25h-3c-.69 0-1.25-.56-1.25-1.25v-.5a.75.75 0 0 0-1.5 0v.5A2.75 2.75 0 0 0 8.25 14h3A2.75 2.75 0 0 0 14 11.25v-6.5Zm-9.47.47a.75.75 0 0 0-1.06 0L1.22 7.47a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 1 0 1.06-1.06l-.97-.97h7.19a.75.75 0 0 0 0-1.5H3.56l.97-.97a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" />
              </svg>
              Close
            </button>
            <div className="font-bold text-2xl truncate text-[var(--note-name-color)]">{selectedNote.title}</div>
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
              className={`
      flex items-center justify-center w-10 h-10 rounded-full
      glass-border
      backdrop-blur-lg backdrop-saturate-200
      transition
      ${notesView === "grid"
                  ? "bg-red-600 text-white border-[var(--accent)] shadow-lg"
                  : "bg-[var(--glass-bg)] border border-[var(--border)] text-gray-700 dark:text-gray-200 opacity-80 hover:opacity-100"}
    `}
              style={{
                border: notesView === "grid" ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                background: notesView === "grid" ? "var(--accent)" : "var(--glass-bg)",
                boxShadow: notesView === "grid"
                  ? "0 4px 24px 0 rgba(0,0,0,0.10)"
                  : "0 2px 8px 0 rgba(0,0,0,0.04)",
                backdropFilter: "blur(8px) saturate(180%)",
                WebkitBackdropFilter: "blur(8px) saturate(180%)",
                transition: "all 0.18s cubic-bezier(.4,2,.6,1)",
              }}
              onClick={() => setNotesView && setNotesView("grid")}
              title="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              className={`
      flex items-center justify-center w-10 h-10 rounded-full
      glass-border
      backdrop-blur-lg backdrop-saturate-200
      transition
      ${notesView === "list"
                  ? "bg-red-600 text-white border-[var(--accent)] shadow-lg"
                  : "bg-[var(--glass-bg)] border border-[var(--border)] text-gray-700 dark:text-gray-200 opacity-80 hover:opacity-100"}
    `}
              style={{
                border: notesView === "list" ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                background: notesView === "list" ? "var(--accent)" : "var(--glass-bg)",
                boxShadow: notesView === "list"
                  ? "0 4px 24px 0 rgba(0,0,0,0.10)"
                  : "0 2px 8px 0 rgba(0,0,0,0.04)",
                backdropFilter: "blur(8px) saturate(180%)",
                WebkitBackdropFilter: "blur(8px) saturate(180%)",
                transition: "all 0.18s cubic-bezier(.4,2,.6,1)",
              }}
              onClick={() => setNotesView && setNotesView("list")}
              title="List view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h11a2.5 2.5 0 0 1 0 5h-11A2.5 2.5 0 0 1 2 4.5ZM2.75 9.083a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H2.75ZM2.75 12.663a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H2.75ZM2.75 16.25a.75.75 0 0 0 0 1.5h14.5a.75.75 0 1 0 0-1.5H2.75Z" />
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
                    style={{
                      color: folder.color || "#8b232d",
                      filter:
                        typeof window !== "undefined" && window.matchMedia &&
                          window.matchMedia('(prefers-color-scheme: light)').matches
                          ? "brightness(0.75)"
                          : undefined,
                    }}
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
                  <div className="text-gray-400">There are no folders nor notes here.</div>
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
                  <div className="text-gray-400">There are no folders nor notes here.</div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
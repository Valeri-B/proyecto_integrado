import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

type Note = {
  id: number;
  title: string;
  folderId?: number | null;
  folder?: { id: number };
};

type Folder = {
  id: number;
  name: string;
  color?: string;
  parentId?: number | null;
  parent?: { id: number };
};

type Props = {
  folders: Folder[];
  notes: Note[];
  onSelectFolder?: (id: number | null) => void;
  selectedFolderId?: number | null;
  collapsed?: boolean;
  onCollapse?: () => void;
  onMove?: () => void; // callback to refetch after move
  onSelectNote?: (note: Note) => void;
};

const getNoteFolderId = (note: any) =>
  typeof note.folderId === "number"
    ? note.folderId
    : note.folder && typeof note.folder.id === "number"
      ? note.folder.id
      : null;

function buildFolderTree(folders: any[]) {
  const map = new Map();
  folders.forEach(f => map.set(f.id, { ...f, children: [] }));
  const tree = [];
  map.forEach(folder => {
    if (folder.parent?.id) {
      const parent = map.get(folder.parent.id);
      if (parent) parent.children.push(folder);
    } else if (folder.parentId) {
      const parent = map.get(folder.parentId);
      if (parent) parent.children.push(folder);
    } else {
      tree.push(folder);
    }
  });
  return tree;
}

function FolderNode({
  folder,
  notes,
  selectedFolderId,
  onSelectFolder,
  level = 0,
  collapsedFolders,
  setCollapsedFolders,
  onMove,
  onSelectNote,
}: any) {
  const isCollapsed = collapsedFolders.has(folder.id);
  const hasChildren = (folder.children && folder.children.length > 0)
  || notes.some(note => getNoteFolderId(note) === folder.id);

  // --- Context menu state ---
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; note: any } | null>(null);
  const contextMenuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on click outside
  React.useEffect(() => {
    if (!contextMenu) return;
    function handleClick(e: MouseEvent) {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);
  // --- End context menu state ---

  // Drag and drop handlers for folders
  return (
    <li
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
          // Move folder
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
          // Move note
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
      <div
        className={`mb-2 cursor-pointer rounded-xl px-2 py-1 flex items-center transition-colors duration-150 ${
          selectedFolderId === folder.id ? "bg-gray-700" : ""
        } hover:bg-[var(--glass-bg)] hover:backdrop-blur-lg hover:backdrop-saturate-200 hover:shadow-lg hover:border hover:border-[var(--border)]`}
        style={{
          marginLeft: level * 16,
          color: "var(--folders-sidebar-text)",
          ...(selectedFolderId === folder.id
            ? {
                background: "var(--glass-bg)",
                backdropFilter: "blur(8px) saturate(180%)",
                WebkitBackdropFilter: "blur(8px) saturate(180%)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
              }
            : {}),
        }}
        onClick={() => onSelectFolder?.(folder.id)}
      >
        {hasChildren && (
          <span
            onClick={e => {
              e.stopPropagation();
              if (!hasChildren) return;
              setCollapsedFolders((prev: Set<number>) => {
                const next = new Set(prev);
                if (next.has(folder.id)) next.delete(folder.id);
                else next.add(folder.id);
                return next;
              });
            }}
            className={`mr-2 cursor-pointer select-none flex items-center ${!hasChildren ? "opacity-40 pointer-events-none" : ""}`}
            title={hasChildren ? (isCollapsed ? "Expand" : "Collapse") : "No subfolders"}
            style={{ color: "var(--folders-sidebar-text)" }}
          >
            {isCollapsed ? (
              // Closed: right arrow
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>

            ) : (
              // Open: down arrow
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>

            )}
          </span>
        )}
        {/* Folder SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="w-5 h-5 mr-2"
          style={{ color: folder.color || "#8b232d" }}
          fill="currentColor"
        >
          <path d="M40,12H22l-4-4H8c-2.2,0-4,1.8-4,4v24c0,2.2,1.8,4,4,4h29.7L44,29V16C44,13.8,42.2,12,40,12z"></path>
          <path d="M40,12H8c-2.2,0-4,1.8-4,4v20c0,2.2,1.8,4,4,4h32c2.2,0,4-1.8,4-4V16C44,13.8,42.2,12,40,12z"></path>
        </svg>
        <span style={{ color: "var(--folders-sidebar-text)" }}>{folder.name}</span>
        <button
          className="ml-auto p-1 hover:bg-gray-700 rounded"
          title="Delete folder"
          onClick={async (e) => {
            e.stopPropagation();
            if (!confirm("Delete this folder?")) return;
            const token = localStorage.getItem("token");
            if (!token) return;
            const payload = JSON.parse(atob(token.split(".")[1]));
            const userId = payload.sub;
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/folders/${folder.id}?userId=${userId}`,
              { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            if (onMove) onMove();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
          </svg>

        </button>
      </div>
      {!isCollapsed && (
        <ul className="list-none">
          {notes
            .filter(note => getNoteFolderId(note) === folder.id)
            .map(note => (
              <li
                key={note.id}
                draggable
                onDragStart={e => {
                  e.stopPropagation();
                  e.dataTransfer.setData("type", "note");
                  e.dataTransfer.setData("id", note.id);
                }}
                className="flex items-center gap-2 py-1 cursor-pointer hover:underline relative"
                style={{ marginLeft: (level + 1) * 16, color: "var(--folders-sidebar-text)" }}
                onClick={() => onSelectNote && onSelectNote(note)}
                onContextMenu={e => {
                  e.preventDefault();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    note,
                  });
                }}
              >
                <svg
                  width="1em"
                  height="1em"
                  viewBox="0 0 1024 1024"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="currentColor"
                  style={{ color: "var(--folders-sidebar-note-icon)" }}
                >
                  <rect x="192" y="192" width="640" height="640" rx="120" ry="120" />
                </svg>
                <span style={{ color: "var(--folders-sidebar-text)" }}>{note.title}</span>
                {/* Right click menu via portal */}
                {contextMenu && contextMenu.note.id === note.id &&
                  createPortal(
                    <div
                      ref={contextMenuRef}
                      className="fixed z-50 bg-[var(--glass-bg)] border border-[var(--border)] rounded-xl shadow-lg flex flex-col min-w-[140px] py-1"
                      style={{
                        left: contextMenu.x,
                        top: contextMenu.y,
                        backdropFilter: "blur(8px) saturate(180%)",
                        WebkitBackdropFilter: "blur(8px) saturate(180%)",
                      }}
                    >
                      <button
                        className="text-left px-4 py-1 hover:bg-[var(--accent)] hover:text-white rounded-xl transition"
                        onClick={ev => {
                          ev.stopPropagation();
                          setContextMenu(null);
                          onSelectNote && onSelectNote(note);
                        }}
                      >
                        Open note
                      </button>
                      <button
                        className="text-left px-4 py-1 hover:bg-red-600 hover:text-white rounded-xl transition"
                        onClick={async ev => {
                          ev.stopPropagation();
                          setContextMenu(null);
                          if (!confirm("¿Eliminar esta nota?")) return;
                          const token = localStorage.getItem("token");
                          const payload = token ? JSON.parse(atob(token.split(".")[1])) : {};
                          const userId = payload.sub;
                          await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/notes/${note.id}?userId=${userId}`,
                            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
                          );
                          if (onMove) onMove();
                        }}
                      >
                        Delete note
                      </button>
                    </div>,
                    document.body
                  )
                }
              </li>
            ))}
          {folder.children &&
            folder.children.map((child: any) => (
              <FolderNode
                key={child.id}
                folder={child}
                notes={notes}
                selectedFolderId={selectedFolderId}
                onSelectFolder={onSelectFolder}
                level={level + 1}
                collapsedFolders={collapsedFolders}
                setCollapsedFolders={setCollapsedFolders}
                onMove={onMove}
                onSelectNote={onSelectNote}
              />
            ))}
        </ul>
      )}
    </li>
  );
}

export default function FoldersSidebar({
  folders,
  notes,
  onSelectFolder,
  selectedFolderId,
  collapsed = false,
  onCollapse,
  onMove,
  onSelectNote,
}: Props) {
  const folderTree = buildFolderTree(folders);
  const [collapsedFolders, setCollapsedFolders] = React.useState<Set<number>>(new Set());

  return (
    <aside
      className={`
    flex flex-col h-full
    border-r border-[var(--border)]
    shadow-lg
    transition-all duration-300
    backdrop-blur-lg
    backdrop-saturate-200
    glass-border
    ${collapsed ? "w-12 p-2" : "w-64 p-6"}
    bg-clip-padding
  `}
      style={{
        height: "100%",
        minHeight: 0,
        background: "var(--glass-bg)",
        backdropFilter: "blur(1.5px)",
        WebkitBackdropFilter: "blur(1.5px)",
        borderRadius: 0,
        borderRight: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        {!collapsed && <h2 className="text-lg font-bold" style={{ color: "var(--folders-sidebar-text)" }}>Folders</h2>}
        <button
          className={`
    flex items-center justify-center
    border border-transparent hover:border-[var(--border)] transition
    rounded-xl
    w-10 h-10
    bg-transparent
  `}
          onClick={onCollapse}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 sidebar-toggle-icon"
          >
            <path
              d="M11 5V19M6 8H8M6 11H8M6 14H8M6.2 19H17.8C18.9201 19 19.4802 19 19.908 18.782C20.2843 18.5903 20.5903 18.2843 20.782 17.908C21 17.4802 21 16.9201 21 15.8V8.2C21 7.0799 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V15.8C3 16.9201 3 17.4802 3.21799 17.908C3.40973 18.2843 3.71569 18.5903 4.09202 18.782C4.51984 19 5.07989 19 6.2 19Z"
              stroke="var(--sidebar-toggle-icon)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
          <ul className="list-none">
            <li
              className={`mb-2 cursor-pointer rounded-xl px-2 py-1 flex items-center transition-colors duration-150 ${
                selectedFolderId === null ? "bg-gray-700" : ""
              } hover:bg-[var(--glass-bg)] hover:backdrop-blur-lg hover:backdrop-saturate-200 hover:shadow-lg hover:border hover:border-[var(--border)]`}
              style={{
                color: "var(--folders-sidebar-text)",
                ...(selectedFolderId === null
                  ? {
                      background: "var(--glass-bg)",
                      backdropFilter: "blur(8px) saturate(180%)",
                      WebkitBackdropFilter: "blur(8px) saturate(180%)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
                    }
                  : {}),
              }}
              onClick={() => onSelectFolder?.(null)}
              onDrop={async e => {
                e.stopPropagation();
                const type = e.dataTransfer.getData("type");
                const id = Number(e.dataTransfer.getData("id"));
                if (type === "note") {
                  // Move note to root
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
                  // Move folder to root
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
              <span style={{ color: "var(--folders-sidebar-text)" }}>Free zone</span>
              <ul className="ml-4 list-none">
                {notes.filter(note => getNoteFolderId(note) === null).map(note => (
                  <li
                    key={note.id}
                    draggable
                    onDragStart={e => {
                      e.stopPropagation();
                      e.dataTransfer.setData("type", "note");
                      e.dataTransfer.setData("id", note.id);
                    }}
                    className="flex items-center gap-2 py-1 cursor-pointer hover:underline"
                    style={{ color: "var(--folders-sidebar-text)" }}
                    onClick={e => {
                      e.stopPropagation();
                      onSelectNote && onSelectNote(note);
                    }}
                  >
                    <svg
                      width="1em"
                      height="1em"
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="currentColor"
                      style={{ color: "var(--folders-sidebar-note-icon)" }}
                    >
                      <rect x="192" y="192" width="640" height="640" rx="120" ry="120" />
                    </svg>
                    <span style={{ color: "var(--folders-sidebar-text)" }}>{note.title}</span>
                  </li>
                ))}
              </ul>
            </li>
            {folderTree.map(folder => (
              <FolderNode
                key={folder.id}
                folder={folder}
                notes={notes}
                selectedFolderId={selectedFolderId}
                onSelectFolder={onSelectFolder}
                collapsedFolders={collapsedFolders}
                setCollapsedFolders={setCollapsedFolders}
                onMove={onMove}
                onSelectNote={onSelectNote}
              />
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
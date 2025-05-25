import React from "react";

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
  onSelectNote?: (note: Note) => void; // NEW
};

// For a note, folderId might be note.folderId or note.folder?.id
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
  onSelectNote, // NEW
}: any) {
  const isCollapsed = collapsedFolders.has(folder.id);
  const hasChildren = folder.children && folder.children.length > 0;

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
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/folders/${id}/move`,
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
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/notes/${id}/move`,
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
        className={`mb-2 cursor-pointer hover:bg-gray-700 rounded px-2 py-1 flex items-center ${selectedFolderId === folder.id ? "bg-gray-700" : ""}`}
        style={{ marginLeft: level * 16 }}
        onClick={() => onSelectFolder?.(folder.id)}
      >
        {hasChildren && (
          <span
            onClick={e => {
              e.stopPropagation();
              setCollapsedFolders((prev: Set<number>) => {
                const next = new Set(prev);
                if (next.has(folder.id)) next.delete(folder.id);
                else next.add(folder.id);
                return next;
              });
            }}
            className="mr-2 cursor-pointer select-none"
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            {isCollapsed ? "▶" : "▼"}
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
        {folder.name}
        <button
          className="ml-auto p-1 hover:bg-gray-700 rounded"
          title="Eliminar carpeta"
          onClick={async (e) => {
            e.stopPropagation();
            if (!confirm("¿Eliminar esta carpeta?")) return;
            const token = localStorage.getItem("token");
            if (!token) return;
            const payload = JSON.parse(atob(token.split(".")[1]));
            const userId = payload.sub;
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/folders/${folder.id}?userId=${userId}`,
              { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            if (onMove) onMove();
          }}
        >
          <img src="/icons_svg/trash_can.svg" alt="Eliminar" className="w-4 h-4" />
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
                className="flex items-center gap-2 py-1 cursor-pointer hover:underline"
                style={{ marginLeft: (level + 1) * 16 }}
                onClick={() => onSelectNote && onSelectNote(note)} // NEW
              >
                <img src="/icons_svg/note_icon_fill_when_clicked.svg" alt="Nota" className="w-4 h-4" />
                {note.title}
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
                onSelectNote={onSelectNote} // NEW
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
  onSelectNote, // NEW
}: Props) {
  const folderTree = buildFolderTree(folders);
  const [collapsedFolders, setCollapsedFolders] = React.useState<Set<number>>(new Set());

  // Drag and drop for "Notas sin carpeta"
  return (
    <aside className={`transition-all duration-300 bg-gray-800 text-white border-r border-gray-700 p-4 ${collapsed ? "w-12" : "w-48"}`} style={{ overflow: "hidden" }}>
      <div className="flex items-center justify-between mb-4">
        {!collapsed && <h2 className="text-lg font-bold">Folders</h2>}
        <button className="p-1 rounded hover:bg-gray-700" onClick={onCollapse} title={collapsed ? "Expandir" : "Colapsar"}>
          <span className="text-xl">{collapsed ? "»" : "«"}</span>
        </button>
      </div>
      {!collapsed && (
        <ul className="list-none">
          <li
            className={`mb-2 cursor-pointer hover:bg-gray-700 rounded px-2 py-1 ${selectedFolderId === null ? "bg-gray-700" : ""}`}
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
                  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/notes/${id}/move`,
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
                  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/folders/${id}/move`,
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
            Zona Libre
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
                  onClick={() => onSelectNote && onSelectNote(note)} // NEW
                >
                  <img src="/icons_svg/note_icon_fill_when_clicked.svg" alt="Nota" className="w-4 h-4" />
                  {note.title}
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
              onSelectNote={onSelectNote} // NEW
            />
          ))}
        </ul>
      )}
    </aside>
  );
}
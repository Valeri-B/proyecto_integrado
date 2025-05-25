"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SmallSidebar from "@/components/SmallSidebar";
import Heatmap from "@/components/Heatmap";
import FoldersSidebar from "@/components/FoldersSidebar";
import TasksBoard from "@/components/TasksBoard";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import MarkdownEditor from "@/components/MarkdownEditor";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";

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

const EMPTY_MARKDOWN = "";

type Notification = {
  id: number;
  taskId: number;
  content: string;
  remindAt: string;
};

export default function Home() {
  const router = useRouter();
  const [folders, setFolders] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<"notes" | "folders" | "heatmap">("notes");
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedFolderSidebarId, setSelectedFolderSidebarId] = useState<number | null>(null);
  const [notesView, setNotesView] = useState<"list" | "grid">("grid");
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [noteMaximized, setNoteMaximized] = useState(false);

  const [noteDraft, setNoteDraft] = useState<string>(EMPTY_MARKDOWN);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const [fabExpanded, setFabExpanded] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);

  // FAB state (fix)
  const [showFabModal, setShowFabModal] = useState(false);
  const [fabMode, setFabMode] = useState<"note" | "folder" | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<number | null>(null);

  // Calendar modal state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // For refreshing TasksBoard after creating a task
  const [tasksBoardKey, setTasksBoardKey] = useState(0);

  // Reminder notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Collapsible productivity panel
  const [productivityCollapsed, setProductivityCollapsed] = useState(false);

  // Track unsaved changes
  const hasUnsavedChanges =
    selectedNote && noteDraft !== (selectedNote.content ?? "");

  // Ref for modal to detect outside click
  const modalRef = useRef<HTMLDivElement>(null);

  // --- Remember last selected folder ---
  useEffect(() => {
    const stored = localStorage.getItem("selectedFolderSidebarId");
    if (stored !== null) {
      setSelectedFolderSidebarId(stored === "null" ? null : Number(stored));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("selectedFolderSidebarId", String(selectedFolderSidebarId));
  }, [selectedFolderSidebarId]);
  // -------------------------------------

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.sub;
    setUserId(userId);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/folders?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setFolders(data));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/notes?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setNotes(data));
  }, [router]);

  // --- Reminders polling and sync ---
  const fetchReminders = useCallback(async (uid = userId) => {
    if (!uid) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/reminders/user/${uid}/active`);
    if (res.ok) {
      const reminders = await res.json();
      const now = new Date();
      const dueReminders = reminders.filter((r: any) => new Date(r.remindAt) <= now);
      setNotifications(dueReminders);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchReminders(userId);
    const interval = setInterval(() => fetchReminders(userId), 30000);
    return () => clearInterval(interval);
  }, [userId, fetchReminders]);
  // -----------------------------------

  // --- Dismiss notification and refetch reminders immediately ---
  const dismissNotification = async (id: number) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/reminders/${id}/dismiss`,
      { method: "PATCH", headers: { "Content-Type": "application/json" } }
    );
    setNotifications(notifications => notifications.filter(n => n.id !== id));
    fetchReminders(); // Refetch to update immediately
  };

  // --- Mark task as done from notification and sync everywhere ---
  const handleTaskDoneFromNotification = async (notification: Notification) => {
    // Mark the task as done
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/tasks/${notification.taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: true }),
      }
    );
    // Dismiss the reminder
    await dismissNotification(notification.id);
    setTasksBoardKey(k => k + 1); // Refresh TasksBoard
    fetchReminders(); // Refetch reminders immediately
  };

  // Task toggle handler (for notifications)
  const handleTaskToggleFromNotification = async (notification: Notification, isDone: boolean) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/tasks/${notification.taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !isDone }),
      }
    );
    // Optionally dismiss the reminder if marking as done
    if (!isDone) await dismissNotification(notification.id);
    setTasksBoardKey(k => k + 1);
    fetchReminders();
  };

  // Handler for creating a task for a specific date
  const handleCreateTaskForDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedDate || !newTaskContent.trim()) return;
    setCreatingTask(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        content: newTaskContent,
        dueDate: selectedDate,
      }),
    });
    setCreatingTask(false);
    setShowTaskModal(false);
    setNewTaskContent("");
    setTasksBoardKey(k => k + 1); // Refresh TasksBoard
  };

  const refetchNotesAndFolders = () => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/folders?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setFolders(data));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/notes?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setNotes(data));
  };

  // Fullscreen handler for note
  const handleMaximize = () => setNoteMaximized(true);
  const handleMinimize = () => setNoteMaximized(false);

  // Save note content
  const handleSaveNote = async () => {
    if (!selectedNote) return;
    
    // DEBUG: Check what we're saving
    console.log("💾 Saving content:", noteDraft);
    
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/notes/${selectedNote.id}/content`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteDraft }),
      }
    );
    // Update notes in state
    setNotes(notes =>
      notes.map(n =>
        n.id === selectedNote.id ? { ...n, content: noteDraft } : n
      )
    );
    setSelectedNote({ ...selectedNote, content: noteDraft });
  };

  // Close note with unsaved changes check
  const handleCloseNote = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      setPendingClose(true);
    } else {
      setSelectedNote(null);
      setNoteDraft(EMPTY_MARKDOWN);
      setNoteMaximized(false);
    }
  };

  // Handle click outside modal
  useEffect(() => {
    if (!selectedNote) return;
    function handleClick(e: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        handleCloseNote();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    // eslint-disable-next-line
  }, [selectedNote, noteDraft, hasUnsavedChanges]);

  // Handle unsaved modal actions
  const handleUnsavedSave = async () => {
    await handleSaveNote();
    setShowUnsavedModal(false);
    setPendingClose(false);
    setSelectedNote(null);
    setNoteDraft(EMPTY_MARKDOWN);
    setNoteMaximized(false);
  };
  const handleUnsavedDiscard = () => {
    setShowUnsavedModal(false);
    setPendingClose(false);
    setSelectedNote(null);
    setNoteDraft(EMPTY_MARKDOWN);
    setNoteMaximized(false);
  };
  const handleUnsavedCancel = () => {
    setShowUnsavedModal(false);
    setPendingClose(false);
  };

  // --- Open note, fetch content, update note in notes array and selectedNote ---
  const handleOpenNote = async (note: any) => {
    setSelectedNote(note);
    setNoteMaximized(false);
    
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/notes/${note.id}/content`
    );
    if (res.ok) {
      const data = await res.json();
      
      // DEBUG: Check what we're loading
      console.log("📖 Loaded content:", data.content);
      
      setNoteDraft(data.content ?? "");
      setNotes(notes =>
        notes.map(n =>
          n.id === note.id ? { ...n, content: data.content ?? "" } : n
        )
      );
      setSelectedNote((prev: any) =>
        prev ? { ...prev, content: data.content ?? "" } : prev
      );
    } else {
      setNoteDraft("");
      setNotes(notes =>
        notes.map(n =>
          n.id === note.id ? { ...n, content: "" } : n
        )
      );
      setSelectedNote((prev: any) =>
        prev ? { ...prev, content: "" } : prev
      );
    }
  };
  // ----------------------------------------------------------------------

  // Helper: Build folder options for select
  function getFolderOptions(folders: any[], prefix = ""): any[] {
    let result: any[] = [];
    folders.forEach(folder => {
      result.push({ id: folder.id, name: prefix + folder.name });
      if (folder.children && folder.children.length > 0) {
        result = result.concat(getFolderOptions(folder.children, prefix + "— "));
      }
    });
    return result;
  }
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
  const folderTree = buildFolderTree(folders);
  const folderOptions = [{ id: null, name: "Sin carpeta" }, ...getFolderOptions(folderTree)];

  // Create Note
  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !newNoteTitle.trim()) return;
    setCreating(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: newNoteTitle,
        content: "",
        folderId: parentFolderId,
      }),
    });
    setCreating(false);
    setShowFabModal(false);
    setFabMode(null);
    setNewNoteTitle("");
    setParentFolderId(null);
    refetchNotesAndFolders();
  }

  // Create Folder
  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !newFolderName.trim()) return;
    setCreating(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name: newFolderName,
        parentId: parentFolderId,
        color: newFolderColor,
      }),
    });
    setCreating(false);
    setShowFabModal(false);
    setFabMode(null);
    setNewFolderName("");
    setParentFolderId(null);
    refetchNotesAndFolders();
  }

  const [newFolderColor, setNewFolderColor] = useState("#8b232d");

  // Add this state for calendar visibility
  const [calendarVisible, setCalendarVisible] = useState(true);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <SmallSidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelect={setActiveView}
        activeView={activeView}
      />
      {/* Folders Sidebar */}
      {activeView === "notes" && (
        <FoldersSidebar
          folders={folders}
          notes={notes}
          onSelectFolder={setSelectedFolderSidebarId}
          selectedFolderId={selectedFolderSidebarId}
          collapsed={sidebarCollapsed}
          onCollapse={() => setSidebarCollapsed(c => !c)}
          onMove={refetchNotesAndFolders}
          onSelectNote={handleOpenNote}
        />
      )}
      {/* Main Content */}
      <main className="flex-1 bg-[var(--background)] p-8 relative overflow-hidden">
        {activeView === "notes" && (
          selectedNote ? (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  onClick={handleCloseNote}
                >
                  ← Volver
                </button>
                <div className="font-bold text-2xl truncate">{selectedNote.title}</div>
                <div />
              </div>
              <div className="flex-1 overflow-auto">
                <MarkdownEditor
                  value={noteDraft}
                  onChange={setNoteDraft}
                  onSave={handleSaveNote}
                  notes={notes}
                  onOpenNote={handleOpenNote}
                />
              </div>
              {/* Unsaved changes modal */}
              {showUnsavedModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60">
                  <div className="bg-[var(--panel)] rounded-2xl shadow-2xl border border-[var(--border)] p-8 max-w-md w-full flex flex-col items-center">
                    <div className="flex gap-4">
                      <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleUnsavedSave}>Guardar y salir</button>
                      <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleUnsavedDiscard}>Descartar cambios</button>
                      <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={handleUnsavedCancel}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Notes Grid
            <div>
              {/* View toggle */}
              <div className="mb-4 flex items-center gap-2">
                <button
                  className={`flex items-center justify-center w-10 h-10 rounded ${notesView === "grid" ? "bg-red-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
                  onClick={() => setNotesView("grid")}
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
                  onClick={() => setNotesView("list")}
                  title="Vista de lista"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor"/>
                    <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor"/>
                    <rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              {/* Notes */}
              {notesView === "grid" ? (
                <div className="flex flex-wrap gap-6"
                  onDrop={async e => {
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
                    }
                    refetchNotesAndFolders();
                  }}
                  onDragOver={e => e.preventDefault()}
                >
                  {/* Folders */}
                  {getChildFolders(selectedFolderSidebarId, folders).map(folder => (
                    <div
                      key={"folder-" + folder.id}
                      className="relative cursor-pointer transition-all duration-200 hover:scale-105 flex items-center justify-center"
                      style={{
                        width: 155,
                        height: 155,
                      }}
                      onClick={() => setSelectedFolderSidebarId(folder.id)}
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
                          refetchNotesAndFolders();
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
                          refetchNotesAndFolders();
                        }
                      }}
                      onDragOver={e => e.preventDefault()}
                    >
                      {/* Folder SVG */}
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
                      {/* Folder name */}
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
                          ${selectedNote?.id === note.id && !noteMaximized ? "ring-2 ring-[var(--accent)] scale-105" : ""}
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
                        onClick={() => handleOpenNote(note)}
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
                  {getChildFolders(selectedFolderSidebarId, folders).length === 0 &&
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
                  {getChildFolders(selectedFolderSidebarId, folders).map(folder => (
                    <div
                      key={"folder-" + folder.id}
                      className="rounded-xl shadow cursor-pointer border border-[var(--border)] transition-all duration-200 hover:shadow-lg hover:border-[var(--accent)] flex items-center px-4 py-3"
                      style={{
                        background: folder.color || "var(--panel)",
                        color: "#fff",
                      }}
                      onClick={() => setSelectedFolderSidebarId(folder.id)}
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
                          ${selectedNote?.id === note.id && !noteMaximized ? "ring-2 ring-[var(--accent)] scale-105" : ""}
                        `}
                        onClick={() => handleOpenNote(note)}
                      >
                        <img src="/icons_svg/note_icon_fill_when_clicked.svg" className="w-6 h-6 mr-3" alt="Nota" />
                        <div className="font-bold text-base truncate flex-1">{note.title}</div>
                      </div>
                    ))}
                  {getChildFolders(selectedFolderSidebarId, folders).length === 0 &&
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
          )
        )}
        {activeView === "folders" && userId && (
          <TasksBoard key={tasksBoardKey} userId={userId} />
        )}
        {activeView === "heatmap" && <Heatmap />}
      </main>
      {/* Productivity Panel */}
      <aside
        className={`flex flex-col bg-[var(--panel)] text-[var(--foreground)] border-l border-[var(--border)] shadow-2xl transition-all duration-300 rounded-l-2xl ${
          productivityCollapsed ? "w-14 p-2" : "w-80 p-8"
        }`}
        style={{ minWidth: productivityCollapsed ? 56 : 320 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          {!productivityCollapsed && (
            <h2 className="text-xl font-bold mb-0">Panel de productividad</h2>
          )}
          <button
            className="p-2 rounded hover:bg-[var(--accent-hover)]"
            onClick={() => setProductivityCollapsed((c) => !c)}
            title={productivityCollapsed ? "Expandir panel" : "Colapsar panel"}
          >
            <span className="text-xl">⫶</span>
          </button>
        </div>

        {/* Calendar */}
        {calendarVisible && !productivityCollapsed && (
          <div className="bg-[var(--background)] rounded-xl p-4 mb-4 shadow">
            <Calendar
              onClickDay={date => {
                setSelectedDate(date);
                setShowTaskModal(true);
              }}
              className="rounded-xl"
            />
          </div>
        )}

        {/* Show calendar button if hidden */}
        {!calendarVisible && !productivityCollapsed && (
          <button
            className="flex items-center justify-center bg-[var(--background)] rounded-xl p-4 mb-4 shadow hover:bg-[var(--accent-hover)] transition"
            onClick={() => setCalendarVisible(true)}
            title="Mostrar calendario"
          >
            {/* Calendar SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-8 h-8" viewBox="0 0 24 24">
              <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
              <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Notifications */}
        {!productivityCollapsed && notifications.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {notifications.map(n => (
              <div
                key={n.id}
                className="bg-[var(--panel)] border border-[var(--accent)] shadow-lg rounded-xl px-4 py-3 flex items-center gap-4 animate-fade-in"
                style={{ minWidth: 240 }}
              >
                <div>
                  <div className="font-bold text-[var(--accent)] mb-1">Recordatorio</div>
                  <div className="text-xs text-[var(--accent-muted)] mt-1">
                    {new Date(n.remindAt).toLocaleString()}
                  </div>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!n.isDone}
                      onChange={() => handleTaskToggleFromNotification(n, n.isDone)}
                    />
                    <span className="text-sm text-[var(--foreground)]">{n.content}</span>
                  </label>
                </div>
                <button
                  className="ml-auto text-[var(--accent-muted)] hover:text-[var(--accent-hover)] text-2xl font-bold"
                  onClick={() => dismissNotification(n.id)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {!productivityCollapsed && notifications.length === 0 && (
          <div className="text-gray-400 mb-4">Sin notificaciones</div>
        )}

        {/* Flexible space */}
        <div className="flex-1" />

        {/* Button grid at the bottom */}
        {!productivityCollapsed && (
          <div className="grid grid-cols-3 grid-rows-2 gap-2 mt-2 items-stretch">
            {/* Row 1, Col 1: New Note */}
            <button
              className="btn bg-[var(--accent)] hover:bg-[var(--accent-hover)] flex items-center justify-center rounded-lg col-start-1 row-start-1"
              title="Nueva nota"
              onClick={() => {
                setShowFabModal(true);
                setFabMode("note");
              }}
            >
              <img src="/icons_svg/note_icon_fill_when_clicked.svg" alt="Nueva nota" className="w-6 h-6" />
            </button>
            {/* Row 1, Col 2: Calendar Toggle */}
            <button
              className="btn bg-[var(--accent)] hover:bg-[var(--accent-hover)] flex items-center justify-center rounded-lg col-start-2 row-start-1"
              title={calendarVisible ? "Ocultar calendario" : "Mostrar calendario"}
              onClick={() => setCalendarVisible(v => !v)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" />
                <circle cx="12" cy="12" r="1.5" />
              </svg>
            </button>
            {/* Row 2, Col 1: New Folder */}
            <button
              className="btn bg-[var(--accent)] hover:bg-[var(--accent-hover)] flex items-center justify-center rounded-lg col-start-1 row-start-2"
              title="Nueva carpeta"
              onClick={() => {
                setShowFabModal(true);
                setFabMode("folder");
              }}
            >
              <img src="/icons_svg/folder.svg" alt="Nueva carpeta" className="w-6 h-6" />
            </button>
            {/* Row 2, Col 2: Theme Toggle */}
            <div className="flex items-center justify-center col-start-2 row-start-2">
              <ThemeToggle />
            </div>
            {/* Log out button: spans both rows in col 3 */}
            <button
              className="row-span-2 col-start-3 row-start-1 bg-red-600 hover:bg-red-700 flex flex-col items-center justify-center rounded-lg relative group transition text-white font-semibold text-base"
              style={{ minWidth: 0, minHeight: 0, height: "100%" }}
              title="Cerrar sesión"
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/login");
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-9 h-9" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.166 5.106a.75.75 0 0 1 0 1.06 8.25 8.25 0 1 0 11.668 0 .75.75 0 1 1 1.06-1.06c3.808 3.807 3.808 9.98 0 13.788-3.807 3.808-9.98 3.808-13.788 0-3.808-3.807-3.808-9.98 0-13.788a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs bg-black bg-opacity-70 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition">
                Cerrar sesión
              </span>
            </button>
          </div>
        )}
      </aside>
      {/* Modal for creating a task for a selected date */}
      {showTaskModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <form
            className="bg-[var(--panel)] p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 border border-[var(--border)]"
            onSubmit={handleCreateTaskForDate}
          >
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
              Crear tarea para el {selectedDate?.toLocaleDateString()}
            </h2>
            <input
              className="w-full mt-1 p-3 rounded-lg bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition"
              value={newTaskContent}
              onChange={e => setNewTaskContent(e.target.value)}
              placeholder="Descripción de la tarea"
              required
              autoFocus
              disabled={creatingTask}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-[var(--accent-muted)] text-[var(--foreground)] rounded-lg hover:bg-[var(--accent-hover)] font-semibold"
                onClick={() => setShowTaskModal(false)}
                disabled={creatingTask}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                disabled={creatingTask || !newTaskContent}
              >
                {creatingTask ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      
      {/* FAB Modal */}
      {showFabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <div className="bg-[var(--panel)] rounded-2xl shadow-2xl border border-[var(--border)] p-8 w-full max-w-sm relative animate-scale-in">
            {/* Close */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl"
              onClick={() => {
                setShowFabModal(false);
                setFabMode(null);
                setNewNoteTitle("");
                setNewFolderName("");
                setParentFolderId(null);
              }}
              aria-label="Cerrar"
            >
              ×
            </button>
            {/* Choose action */}
            {!fabMode && (
              <div className="flex flex-col gap-6 items-center">
                <div className="text-xl font-bold mb-2 text-[var(--foreground)]">¿Qué quieres crear?</div>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-lg transition"
                  onClick={() => setFabMode("note")}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth={2} />
                    <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                  Nueva nota
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-800 text-white font-semibold text-lg transition"
                  onClick={() => setFabMode("folder")}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={2} />
                    <path d="M3 7l3-4h12l3 4" stroke="currentColor" strokeWidth={2} />
                  </svg>
                  Nueva carpeta
                </button>
              </div>
            )}
            {/* Create Note */}
            {fabMode === "note" && (
              <form className="flex flex-col gap-4 mt-2" onSubmit={handleCreateNote}>
                <div className="text-lg font-bold text-[var(--foreground)]">Nueva nota</div>
                <input
                  className="w-full p-3 rounded-lg bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition"
                  value={newNoteTitle}
                  onChange={e => setNewNoteTitle(e.target.value)}
                  placeholder="Título de la nota"
                  required
                  disabled={creating}
                  autoFocus
                />
                <select
                  className="w-full p-3 rounded-lg bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]"
                  value={parentFolderId ?? ""}
                  onChange={e => setParentFolderId(e.target.value === "" ? null : Number(e.target.value))}
                  disabled={creating}
                >
                  {folderOptions.map(opt => (
                    <option key={opt.id ?? "none"} value={opt.id ?? ""}>{opt.name}</option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold"
                    onClick={() => {
                      setFabMode(null);
                      setNewNoteTitle("");
                      setParentFolderId(null);
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    disabled={creating || !newNoteTitle.trim()}
                  >
                    {creating ? "Creando..." : "Crear"}
                  </button>
                </div>
              </form>
            )}
            {/* Create Folder */}
            {fabMode === "folder" && (
              <form className="flex flex-col gap-4 mt-2" onSubmit={handleCreateFolder}>
                <div className="text-lg font-bold text-[var(--foreground)]">Nueva carpeta</div>
                <input
                  className="w-full p-3 rounded-lg bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Nombre de la carpeta"
                  required
                  disabled={creating}
                  autoFocus
                />
                <select
                  className="w-full p-3 rounded-lg bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]"
                  value={parentFolderId ?? ""}
                  onChange={e => setParentFolderId(e.target.value === "" ? null : Number(e.target.value))}
                  disabled={creating}
                >
                  {folderOptions.map(opt => (
                    <option key={opt.id ?? "none"} value={opt.id ?? ""}>{opt.name}</option>
                  ))}
                </select>
                {/* Color Picker */}
                <div className="flex items-center gap-3">
                  <label className="text-[var(--foreground)] font-medium">Color:</label>
                  <input
                    type="color"
                    value={newFolderColor}
                    onChange={e => setNewFolderColor(e.target.value)}
                    className="w-8 h-8 border-none bg-transparent cursor-pointer"
                    disabled={creating}
                    style={{ padding: 0, background: "none" }}
                  />
                  <span className="ml-2 text-sm">{newFolderColor}</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold"
                    onClick={() => {
                      setFabMode(null);
                      setNewFolderName("");
                      setParentFolderId(null);
                      setNewFolderColor("#8b232d");
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    disabled={creating || !newFolderName.trim()}
                  >
                    {creating ? "Creando..." : "Crear"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* --- ANIMATIONS --- */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95);}
          to { opacity: 1; transform: scale(1);}
        }
        .animate-fade-in { animation: fade-in 0.2s both; }
        .animate-scale-in { animation: scale-in 0.2s both; }
      `}</style>
    </div>
  );
}
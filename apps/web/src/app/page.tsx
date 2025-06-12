"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SmallSidebar from "@/components/SmallSidebar";
import Heatmap from "@/components/Heatmap";
import FoldersSidebar from "@/components/FoldersSidebar";
import TasksBoard from "@/components/TasksBoard";
import MarkdownEditor from "@/components/MarkdownEditor";
import ProductivityPanel from "@/components/ProductivityPanel";
import MainContent from "@/components/MainContent";
import GlobalSearch from "@/components/GlobalSearch";
import FabModal from "@/components/FabModal";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";
import TagResultsModal from "@/components/TagResultsModal";
import AdminPanel from "@/components/AdminPanel";
import TagsManagerModal from "@/components/TagsManagerModal";

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
  const [activeView, setActiveView] = useState<"notes" | "folders" | "heatmap" | "admin">("notes");
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedFolderSidebarId, setSelectedFolderSidebarId] = useState<number | null>(null);
  const [notesView, setNotesView] = useState<"list" | "grid">("grid");
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [noteMaximized, setNoteMaximized] = useState(false);

  const [noteDraft, setNoteDraft] = useState<string>(EMPTY_MARKDOWN);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingClose, setPendingClose] = useState<{ type: "folder" | "note"; id?: number | null; note?: any } | false>(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#8b232d");
  const [parentFolderId, setParentFolderId] = useState<number | null>(null);

  const [fabExpanded, setFabExpanded] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>("user");

  // FAB state
  const [showFabModal, setShowFabModal] = useState(false);
  const [fabMode, setFabMode] = useState<"note" | "folder" | null>(null);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [newFolderColor2, setNewFolderColor2] = useState("#8b232d");

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

  // Tasks for search
  const [tasks, setTasks] = useState<any[]>([]);
  const [shiningTaskId, setShiningTaskId] = useState<number | null>(null);

  // Global search modal state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(true);

  // Tag results modal state
  const [showTagResults, setShowTagResults] = useState<{ tag: any } | null>(null);

  // Handler to open the tag results modal
  const handleOpenTagResults = (tag: any) => {
    setShowTagResults({ tag });
  };

  // Left and right sidebar states
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Track unsaved changes
  const hasUnsavedChanges =
    selectedNote && noteDraft !== (selectedNote.content ?? "");

  // Ref for modal to detect outside click
  const modalRef = useRef<HTMLDivElement>(null);
  const smallSearchInputRef = useRef<HTMLInputElement>(null);

  // --- Remember last selected folder ---
  useEffect(() => {
    const stored = localStorage.getItem("selectedFolderSidebarId");
    if (stored !== null) setSelectedFolderSidebarId(stored === "null" ? null : Number(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem("selectedFolderSidebarId", String(selectedFolderSidebarId));
  }, [selectedFolderSidebarId]);
  // -------------------------------------

  // --- Fetch user, folders, notes, tasks ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const payload = JSON.parse(atob(token.split(".")[1]));
    const uid = payload.sub;
    setUserId(uid);
    setUserRole(payload.role || "user");

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/folders?userId=${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setFolders(data));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/notes?userId=${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setNotes(data));

    fetchTasks(uid);
  }, [router]);

  const fetchTasks = (uid = userId) => {
    if (!uid) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tasks?userId=${uid}`)
      .then(res => res.json())
      .then(data => setTasks(data));
  };

  // --- Reminders polling and sync ---
  const fetchReminders = useCallback(async (uid = userId) => {
    if (!uid) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/reminders/user/${uid}/active`
    );
    if (res.ok) {
      const reminders = await res.json();
      setNotifications(reminders);
    }
  }, [userId]);

  // Only one effect to fetch reminders on mount and every 30s
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
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/reminders/${id}/dismiss`,
      { method: "PATCH", headers: { "Content-Type": "application/json" } }
    );
    setNotifications(notifications => notifications.filter(n => n.id !== id));
    fetchReminders();
  };

  // --- Mark task as done from notification and sync everywhere ---
  const handleTaskDoneFromNotification = async (notification: Notification) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tasks/${notification.taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: true }),
      }
    );
    await dismissNotification(notification.id);
    setTasksBoardKey(k => k + 1);
    fetchReminders();
  };

  // Task toggle handler (for notifications)
  const handleTaskToggleFromNotification = async (notification: Notification, isDone: boolean) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tasks/${notification.taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !isDone }),
      }
    );
    if (!isDone) await dismissNotification(notification.id);
    setTasksBoardKey(k => k + 1);
    fetchReminders();
  };

  // Handler for creating a task for a specific date
  const handleCreateTaskForDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedDate || !newTaskContent.trim()) return;
    setCreatingTask(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tasks`, {
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
    setTasksBoardKey(k => k + 1);
    fetchTasks(userId);
  };

  const refetchNotesAndFolders = () => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/folders?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setFolders(data));
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/notes?userId=${userId}`, {
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
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/notes/${selectedNote.id}/content`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteDraft }),
      }
    );
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
      setPendingClose(false);
    } else {
      setSelectedNote(null);
      setNoteDraft(EMPTY_MARKDOWN);
      setNoteMaximized(false);
    }
  };

  // Handle click outside modal to close note
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
  }, [selectedNote, noteDraft, hasUnsavedChanges]);

  // Handle unsaved modal actions
  const handleUnsavedSave = async () => {
    await handleSaveNote();
    setShowUnsavedModal(false);
    if (pendingClose) {
      if (pendingClose.type === "folder") {
        setSelectedNote(null);
        setNoteDraft(EMPTY_MARKDOWN);
        setNoteMaximized(false);
        setSelectedFolderSidebarId(pendingClose.id ?? null);
      } else if (pendingClose.type === "note" && pendingClose.note) {
        await handleOpenNote(pendingClose.note);
      }
    } else {
      setSelectedNote(null);
      setNoteDraft(EMPTY_MARKDOWN);
      setNoteMaximized(false);
    }
    setPendingClose(false);
  };
  const handleUnsavedDiscard = () => {
    setShowUnsavedModal(false);
    if (pendingClose) {
      if (pendingClose.type === "folder") {
        setSelectedNote(null);
        setNoteDraft(EMPTY_MARKDOWN);
        setNoteMaximized(false);
        setSelectedFolderSidebarId(pendingClose.id ?? null);
      } else if (pendingClose.type === "note" && pendingClose.note) {
        handleOpenNote(pendingClose.note);
      }
    } else {
      setSelectedNote(null);
      setNoteDraft(EMPTY_MARKDOWN);
      setNoteMaximized(false);
    }
    setPendingClose(false);
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
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/notes/${note.id}/content`
    );
    if (res.ok) {
      const data = await res.json();
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
    setShowGlobalSearch(false);
    setActiveView("notes");
  };

  // --- Open folder from search modal ---
  const handleOpenFolder = (folder: any) => {
    setSelectedFolderSidebarId(folder.id);
    setActiveView("notes");
    setSelectedNote(null);
    setShowGlobalSearch(false);
  };

  // --- Open task from search modal ---
  const handleOpenTask = (task: any) => {
    setActiveView("folders");
    setShiningTaskId(task.id);
    setShowGlobalSearch(false);
  };

  // --- Keyboard shortcut for global search (Ctrl+Q) ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "q") {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === "Escape") {
        setShowGlobalSearch(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // --- Create Note ---
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newNoteTitle.trim()) return;
    setCreating(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: newNoteTitle,
        content: "",
        folderId: parentFolderId || undefined,
      }),
    });
    setCreating(false);
    setShowFabModal(false);
    setNewNoteTitle("");
    setParentFolderId(null);
    // Refetch notes/folders
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/notes?userId=${userId}`)
      .then(res => res.json())
      .then(data => setNotes(data));
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/folders?userId=${userId}`)
      .then(res => res.json())
      .then(data => setFolders(data));
  };

  // --- Create Folder ---
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newFolderName.trim()) return;
    setCreating(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name: newFolderName,
        color: newFolderColor,
        parentId: parentFolderId || undefined,
      }),
    });
    setCreating(false);
    setShowFabModal(false);
    setNewFolderName("");
    setNewFolderColor("#8b232d");
    setParentFolderId(null);
    // Refetch folders
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/folders?userId=${userId}`)
      .then(res => res.json())
      .then(data => setFolders(data));
  };

  // Tag state and handlers
  const [tags, setTags] = useState<{ id: number; name: string; color: string }[]>([]);

  // Fetch tags
  useEffect(() => {
    if (!userId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tags?userId=${userId}`)
      .then(res => res.json())
      .then(setTags);
  }, [userId]);

  // Tag handlers
  const handleCreateTag = async (name: string, color: string) => {
    if (!userId) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name, color }),
    });
    // Refetch tags
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tags?userId=${userId}`)
      .then(res => res.json())
      .then(setTags);
  };

  const handleEditTag = async (id: number, name: string, color: string) => {
    if (!userId) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tags/${id}?userId=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    // Refetch tags
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tags?userId=${userId}`)
      .then(res => res.json())
      .then(setTags);
  };

  const handleDeleteTag = async (id: number) => {
    if (!userId) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tags/${id}?userId=${userId}`, {
      method: "DELETE",
    });
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/tags?userId=${userId}`)
      .then(res => res.json())
      .then(setTags);
  };

  // Update tags for a note in both selectedNote and notes array
  const updateNoteTags = (noteId: number, tags: any[]) => {
    setNotes(prev =>
      prev.map(n => (n.id === noteId ? { ...n, tags } : n))
    );
    setSelectedNote(prev =>
      prev && prev.id === noteId ? { ...prev, tags } : prev
    );
  };

  // --- Wait for userId before rendering MainContent/TasksBoard ---
  if (!userId) {
    return <div className="text-white p-8">Loading...</div>;
  }

  if (!Array.isArray(folders)) return null;

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <SmallSidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelect={setActiveView}
        activeView={activeView}
        isAdmin={userRole === "admin"}
      />
      {activeView === "admin" && userRole === "admin" ? (
        <>
          <div className="flex-1">
            <AdminPanel token={localStorage.getItem("token") || ""} />
          </div>
          <ProductivityPanel
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            productivityCollapsed={productivityCollapsed}
            setProductivityCollapsed={setProductivityCollapsed}
            notifications={notifications}
            handleTaskToggleFromNotification={handleTaskToggleFromNotification}
            dismissNotification={dismissNotification}
            showGlobalSearch={showGlobalSearch}
            setShowGlobalSearch={setShowGlobalSearch}
            calendarVisible={calendarVisible}
            setCalendarVisible={setCalendarVisible}
            smallSearchInputRef={smallSearchInputRef}
            setShowFabModal={setShowFabModal}
            setFabMode={setFabMode}
            userId={userId}
            tags={tags}
            onCreateTag={handleCreateTag}
            onEditTag={handleEditTag}
            onDeleteTag={handleDeleteTag}
          />
        </>
      ) : (
        <>
          {activeView === "notes" && (
            <FoldersSidebar
              folders={folders}
              notes={notes}
              onSelectFolder={id => {
                if (selectedNote && noteDraft !== (selectedNote.content ?? "")) {
                  setShowUnsavedModal(true);
                  setPendingClose({ type: "folder", id });
                  return;
                }
                setSelectedNote(null);
                setNoteDraft(EMPTY_MARKDOWN);
                setNoteMaximized(false);
                setSelectedFolderSidebarId(id);
              }}
              selectedFolderId={selectedFolderSidebarId}
              collapsed={sidebarCollapsed}
              onCollapse={() => setSidebarCollapsed(c => !c)}
              onMove={refetchNotesAndFolders}
              onSelectNote={async note => {
                if (selectedNote && noteDraft !== (selectedNote.content ?? "")) {
                  setShowUnsavedModal(true);
                  setPendingClose({ type: "note", note });
                  return;
                }
                await handleOpenNote(note);
              }}
            />
          )}
          <main className="flex-1 bg-[var(--background)] p-8 relative overflow-hidden">
            <MainContent
              activeView={activeView}
              notes={notes}
              folders={folders}
              tasks={tasks}
              selectedNote={selectedNote}
              setSelectedNote={setSelectedNote}
              noteDraft={noteDraft}
              setNoteDraft={setNoteDraft}
              userId={userId}
              tasksBoardKey={tasksBoardKey}
              shiningTaskId={shiningTaskId}
              onShineEnd={() => setShiningTaskId(null)}
              onOpenNote={handleOpenNote}
              onMove={refetchNotesAndFolders}
              selectedFolderSidebarId={selectedFolderSidebarId}
              setSelectedFolderSidebarId={setSelectedFolderSidebarId}
              notesView={notesView}
              setNotesView={setNotesView}
              foldersSidebarCollapsed={sidebarCollapsed}
              onSaveNote={handleSaveNote}
              onCloseNote={handleCloseNote}
              tags={tags}
              handleEditTag={handleEditTag}
              handleDeleteTag={handleDeleteTag}
              handleCreateTag={handleCreateTag}
              updateNoteTags={updateNoteTags}
            />
            {/* Unsaved changes modal */}
            {showUnsavedModal && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-[var(--panel)] rounded-2xl shadow-2xl border border-[var(--border)] p-8 max-w-md w-full flex flex-col items-center">
                  <div className="mb-4 text-lg font-bold text-[var(--foreground)]">Tienes cambios sin guardar</div>
                  <div className="flex gap-4">
                    <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleUnsavedSave}>Guardar y salir</button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleUnsavedDiscard}>Descartar cambios</button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={handleUnsavedCancel}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}
            {showTagResults && (
              <TagResultsModal
                tag={showTagResults.tag}
                notes={notes}
                tasks={tasks}
                onClose={() => setShowTagResults(null)}
                onOpenNote={handleOpenNote}
                onOpenTask={handleOpenTask}
              />
            )}
          </main>
          <ProductivityPanel
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            productivityCollapsed={productivityCollapsed}
            setProductivityCollapsed={setProductivityCollapsed}
            notifications={notifications}
            handleTaskToggleFromNotification={handleTaskToggleFromNotification}
            dismissNotification={dismissNotification}
            showGlobalSearch={showGlobalSearch}
            setShowGlobalSearch={setShowGlobalSearch}
            calendarVisible={calendarVisible}
            setCalendarVisible={setCalendarVisible}
            smallSearchInputRef={smallSearchInputRef}
            setShowFabModal={setShowFabModal}
            setFabMode={setFabMode}
            userId={userId}
            tags={tags}
            onCreateTag={handleCreateTag}
            onEditTag={handleEditTag}
            onDeleteTag={handleDeleteTag}
            showTagsModal={showTagsModal}
            setShowTagsModal={setShowTagsModal}
            onCalendarDayClick={(date: Date) => {
              setSelectedDate(date);
              setShowTaskModal(true);
              setNewTaskContent("");
            }}
          />
          {showGlobalSearch && (
            <GlobalSearch
              notes={notes}
              folders={folders}
              tasks={tasks}
              tags={tags}
              onOpenNote={handleOpenNote}
              onOpenFolder={handleOpenFolder}
              onOpenTask={handleOpenTask}
              onOpenTagResults={handleOpenTagResults}
              showModal={showGlobalSearch}
              setShowModal={setShowGlobalSearch}
              autoFocus={true}
            />
          )}
          {showFabModal && (
            <FabModal
              fabMode={fabMode}
              setFabMode={setFabMode}
              setShowFabModal={setShowFabModal}
              handleCreateNote={handleCreateNote}
              handleCreateFolder={handleCreateFolder}
              newNoteTitle={newNoteTitle}
              setNewNoteTitle={setNewNoteTitle}
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              newFolderColor={newFolderColor}
              setNewFolderColor={setNewFolderColor}
              creating={creating}
              folders={folders}
              parentFolderId={parentFolderId}
              setParentFolderId={setParentFolderId}
            />
          )}
          {showTagsModal && (
            <TagsManagerModal
              tags={tags}
              onClose={() => setShowTagsModal(false)}
              onCreate={handleCreateTag}
              onEdit={handleEditTag}
              onDelete={handleDeleteTag}
              userId={userId}
            />
          )}
          {showTaskModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center">
              <DraggableTaskModal
                selectedDate={selectedDate}
                newTaskContent={newTaskContent}
                setNewTaskContent={setNewTaskContent}
                creatingTask={creatingTask}
                onClose={() => setShowTaskModal(false)}
                onSubmit={handleCreateTaskForDate}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DraggableTaskModal({ selectedDate, newTaskContent, setNewTaskContent, creatingTask, onClose, onSubmit }: {
  selectedDate: Date | null;
  newTaskContent: string;
  setNewTaskContent: (s: string) => void;
  creatingTask: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [drag, setDrag] = React.useState<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [modalPos, setModalPos] = React.useState<{ x: number; y: number } | null>(null);
  const modalRef = React.useRef<HTMLFormElement>(null);

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

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!modalPos && !drag) setModalPos(null);
  }, [drag, modalPos]);

  return (
    <form
      ref={modalRef}
      className="bg-[var(--glass-bg)] rounded-2xl shadow-2xl border glass-border p-8 max-w-md w-full flex flex-col gap-4 backdrop-blur-lg backdrop-saturate-200 animate-scale-in"
      onSubmit={onSubmit}
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(8px) saturate(180%)",
        WebkitBackdropFilter: "blur(8px) saturate(180%)",
        border: "1px solid var(--border)",
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
        <div className="font-bold text-lg px-4 py-1">
          New task for {selectedDate?.toLocaleDateString()}
        </div>
        <button type="button" className="text-2xl" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
      <input
        className="p-2 rounded-xl border border-gray-700 fab-modal-create-btn text-base"
        placeholder="Task name"
        value={newTaskContent}
        onChange={e => setNewTaskContent(e.target.value)}
        required
        autoFocus
      />
      <div className="flex gap-4 mt-6 justify-center">
        <button
          className="fab-modal-create-btn px-8 py-1 font-semibold rounded-full text-base"
          type="submit"
          disabled={creatingTask}
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(8px) saturate(180%)",
            WebkitBackdropFilter: "blur(8px) saturate(180%)",
            color: "var(--new-note-modal-text)",
            boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
            transition: "background 0.2s, box-shadow 0.2s, border-color 0.2s",
          }}
        >
          Create
        </button>
        <button
          className="fab-modal-create-btn px-8 py-1 font-semibold rounded-full text-base"
          type="button"
          onClick={onClose}
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(8px) saturate(180%)",
            WebkitBackdropFilter: "blur(8px) saturate(180%)",
            color: "var(--new-note-modal-text)",
            boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
            transition: "background 0.2s, box-shadow 0.2s, border-color 0.2s",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
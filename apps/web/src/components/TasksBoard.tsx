import { useRef, useEffect, useState } from "react";
import TagPickerModal from "./TagPickerModal";

type Task = {
  id: number;
  content: string;
  description?: string | null;
  isDone: boolean;
  dueDate?: string | null;
  taskListId?: number | null;
  tags?: { id: number; name: string; color: string }[];
};

type TaskList = {
  id: number;
  name: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api";

function daysUntil(dateString?: string | null) {
  if (!dateString) return null;
  const now = new Date();
  const due = new Date(dateString);
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function TasksBoard({
  userId,
  shiningTaskId,
  onTasksChanged,
  onShineEnd,
  tags,
  onEditTag,
  onDeleteTag,
  onCreateTag,
}: {
  userId: number;
  shiningTaskId?: number | null;
  onTasksChanged?: () => void;
  onShineEnd?: () => void;
  tags: { id: number; name: string; color: string }[];
  onEditTag: (id: number, name: string, color: string) => void;
  onDeleteTag: (id: number) => void;
  onCreateTag: (name: string, color: string) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newList, setNewList] = useState("");
  const [loading, setLoading] = useState(false);

  // For delete list modal
  const [deleteListId, setDeleteListId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // For per-list new task input
  const [listTaskInputs, setListTaskInputs] = useState<Record<number, string>>({});

  // Inline edit state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editReminderDate, setEditReminderDate] = useState<string>("");
  const [editReminderId, setEditReminderId] = useState<number | null>(null); // Track reminder ID
  const [savingEdit, setSavingEdit] = useState(false);

  const editDropdownRef = useRef<HTMLDivElement>(null);
  const [savingFromOutside, setSavingFromOutside] = useState(false);

  // --- Detect click outside for edit dropdown ---
  const [clickedOutside, setClickedOutside] = useState(false);

  useEffect(() => {
    if (editingTaskId === null) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        editDropdownRef.current &&
        !editDropdownRef.current.contains(e.target as Node)
      ) {
        setClickedOutside(true);
        setTimeout(() => {
          setClickedOutside(false);
          saveEdit();
        }, 0);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingTaskId, editContent, editDescription, editDueDate, editReminderDate]); // dependencies: all edit fields

  // For shiny animation
  const [shinyId, setShinyId] = useState<number | null>(null);

  // For tag modal per task
  const [showTagModalForTask, setShowTagModalForTask] = useState<number | null>(null);

  // Helper to convert UTC ISO string to local datetime-local value
  function toDatetimeLocalValue(dateString: string | null | undefined) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISO = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISO;
  }

  // Fetch tasks and lists
  const fetchAll = async () => {
    setLoading(true);
    const [listsRes, tasksRes] = await Promise.all([
      fetch(`${API_URL}/tasklists?userId=${userId}`),
      fetch(`${API_URL}/tasks?userId=${userId}`),
    ]);
    const listsData = await listsRes.json();
    const tasksData = await tasksRes.json();
    setLists(Array.isArray(listsData) ? listsData : []);
    setTasks(Array.isArray(tasksData) ? tasksData : []);
    setLoading(false);
    if (onTasksChanged) onTasksChanged();
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, [userId]);

  // Add single task
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, content: newTask }),
    });
    setNewTask("");
    fetchAll();
  };

  // Add new list
  const addList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newList.trim()) return;
    await fetch(`${API_URL}/tasklists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name: newList }),
    });
    setNewList("");
    fetchAll();
  };

  // Add task to a specific list
  const addTaskToList = async (e: React.FormEvent, listId: number) => {
    e.preventDefault();
    const content = listTaskInputs[listId]?.trim();
    if (!content) return;
    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, content, taskListId: listId }),
    });
    setListTaskInputs(inputs => ({ ...inputs, [listId]: "" }));
    fetchAll();
  };

  // Drag and drop handlers
  const onDragStart = (taskId: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", String(taskId));
  };
  const onDrop = (listId: number | null) => async (e: React.DragEvent) => {
    const taskId = Number(e.dataTransfer.getData("taskId"));
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskListId: listId }),
    });
    fetchAll();
  };

  // Toggle task completion
  const toggleTask = async (task: Task) => {
    await fetch(`${API_URL}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: !task.isDone }),
    });
    fetchAll();
  };

  // Delete task
  const deleteTask = async (taskId: number) => {
    await fetch(`${API_URL}/tasks/${taskId}`, { method: "DELETE" });
    fetchAll();
  };

  // Delete list and move its tasks to "tareas sueltas"
  const handleDeleteList = async () => {
    if (deleteListId == null) return;
    // Move all tasks to "tareas sueltas"
    const tasksInList = tasks.filter(t => t.taskListId === deleteListId);
    await Promise.all(tasksInList.map(t =>
      fetch(`${API_URL}/tasks/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskListId: null }),
      })
    ));
    // Then delete the list
    await fetch(`${API_URL}/tasklists/${deleteListId}`, { method: "DELETE" });
    setShowDeleteModal(false);
    setDeleteListId(null);
    fetchAll();
  };

  // --- Inline Edit Dropdown Logic ---
  // Open dropdown for a task
  const openEditDropdown = async (task: Task) => {
    setEditingTaskId(task.id);
    setEditContent(task.content);
    setEditDescription(task.description || "");
    setEditDueDate(toDatetimeLocalValue(task.dueDate));
    // Fetch reminder for this task
    const res = await fetch(`${API_URL}/reminders/${task.id}`);
    const reminders = await res.json();
    if (reminders && reminders.length > 0 && reminders[0].remindAt) {
      setEditReminderDate(toDatetimeLocalValue(reminders[0].remindAt));
      setEditReminderId(reminders[0].id); // Store reminder ID
    } else {
      setEditReminderDate("");
      setEditReminderId(null);
    }
  };

  // Save changes and close dropdown
  const saveEdit = async () => {
    if (editingTaskId == null || savingEdit) return;
    setSavingEdit(true);

    // 1. Update the task (including dueDate)
    await fetch(`${API_URL}/tasks/${editingTaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: editContent,
        description: editDescription,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      }),
    });

    // 2. Update, create, or delete the reminder
    if (editReminderDate) {
      await fetch(`${API_URL}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: editingTaskId,
          remindAt: new Date(editReminderDate).toISOString(),
        }),
      });
    } else if (editReminderId) {
      // If reminder was cleared, delete it
      await fetch(`${API_URL}/reminders/${editReminderId}`, {
        method: "DELETE",
      });
    }

    setSavingEdit(false);
    setEditingTaskId(null);
    setEditReminderId(null);
    fetchAll();
  };

  // --- Tag Picker Logic for Tasks ---
  const handleToggleTaskTag = async (tagId: number) => {
    if (showTagModalForTask == null) return;
    const task = tasks.find(t => t.id === showTagModalForTask);
    if (!task) return;
    const already = (task.tags || []).some((t) => t.id === tagId);
    if (already) {
      await fetch(`${API_URL}/tasks/${task.id}/tags/${tagId}?userId=${userId}`, {
        method: "DELETE",
      });
    } else {
      await fetch(`${API_URL}/tasks/${task.id}/tags/${tagId}?userId=${userId}`, {
        method: "POST",
      });
    }
    await fetchAll();
  };

  // --- Shiny animation ---
  useEffect(() => {
    if (shiningTaskId) {
      setShinyId(shiningTaskId);
      const timer = setTimeout(() => {
        setShinyId(null);
        if (onShineEnd) onShineEnd();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [shiningTaskId, onShineEnd]);

  // --- UI ---
  return (
    <div className="flex flex-col gap-8">
      {/* Loose tasks */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop(null)}
        className="mb-8"
      >
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--tasks-h2-text)" }}>Tasks</h2>
        <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-2 mb-4 justify-start">
          <input
            className="p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="New Task"
          />
          <button
            className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-6 py-2 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
            type="submit"
          >
            Add
          </button>
        </form>
        {/* Responsive grid for loose tasks */}
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4 items-start">
          {tasks.filter(t => !t.taskListId).map(task => {
            const days = daysUntil(task.dueDate);
            return (
              <li
                key={task.id}
                draggable={editingTaskId !== task.id}
                onDragStart={editingTaskId !== task.id ? onDragStart(task.id) : undefined}
                className={`flex flex-col gap-1 bg-gray-800 p-2 max-w-md w-full
                  ${shinyId === task.id ? "shine-and-scale" : ""}
                  ${editingTaskId === task.id ? "rounded-3xl" : "rounded-3xl"}
                  glass-border
                  backdrop-blur-lg
                  `}
                style={{
                  background: "var(--glass-bg)",
                  boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
                  border: "1px solid var(--border)",
                  margin: "0 auto",
                }}
              >
                {/* BUTTONS ROW */}
                <div className="flex items-center gap-2 mb-1">
                  <button
                    className="px-2 py-2 rounded-full glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
                    title="Tags"
                    onClick={() => setShowTagModalForTask(task.id)}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="var(--tasks-tag-icon)" className="size-4">
                      <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v2.879a2.5 2.5 0 0 0 .732 1.767l4.5 4.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-4.5-4.5A2.5 2.5 0 0 0 7.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="px-2 py-2 rounded-full glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] text-red-400 transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)] hover:text-red-600"
                    onClick={() => deleteTask(task.id)}
                    title="Delete task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                      <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="px-2 py-2 rounded-full glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] text-gray-400 transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)] hover:text-blue-500"
                    title="Edit task"
                    onClick={e => {
                      e.stopPropagation();
                      openEditDropdown(task);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                      <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                    </svg>
                  </button>
                </div>

                {/* TASK ROW */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <input
                    type="checkbox"
                    checked={!!task.isDone}
                    onChange={() => toggleTask(task)}
                  />
                  <span
                    className={`flex-1 relative transition-colors duration-300 ${task.isDone ? "text-gray-400" : ""}`}
                    style={{ display: "inline-block", minWidth: 0, wordBreak: "break-word" }}
                  >
                    <span
                      className={`transition-all duration-300 ${task.isDone ? "line-through-task" : ""}`}
                      style={{
                        position: "relative",
                        display: "inline-block",
                        wordBreak: "break-word",
                        minWidth: 0,
                      }}
                    >
                      {task.content}
                    </span>
                    {typeof days === "number" && (
                      <span className="ml-2 text-xs text-gray-400 font-semibold">
                        {days === 0
                          ? "hoy"
                          : days > 0
                            ? `${days} days`
                            : `${Math.abs(days)} days ago`}
                      </span>
                    )}
                  </span>
                </div>
                {/* Tags display */}
                <div className="flex gap-1 ml-6 flex-wrap">
                  {(task.tags || []).map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                      style={{ background: tag.color, color: "#fff" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                      </svg>
                      {tag.name}
                    </span>
                  ))}
                </div>
                {/* Tag Picker Modal */}

                {/* Inline edit dropdown */}
                {editingTaskId === task.id && (
                  <div
                    ref={editDropdownRef}
                    className={`
                      transition-all duration-300
                      overflow-hidden
                      rounded-3xl
                      border glass-border
                      bg-[var(--glass-bg)] backdrop-blur-lg
                      mt-2
                      ${editingTaskId === task.id ? "edit-dropdown-open" : "edit-dropdown-closed"}
                    `}
                    style={{
                      maxHeight: editingTaskId === task.id ? 400 : 0,
                      opacity: editingTaskId === task.id ? 1 : 0,
                      boxShadow: editingTaskId === task.id ? "0 4px 24px 0 rgba(0,0,0,0.08)" : "none",
                      pointerEvents: editingTaskId === task.id ? "auto" : "none",
                      marginTop: 12,
                      transition: "max-height 0.3s cubic-bezier(.4,2,.6,1), opacity 0.2s, box-shadow 0.2s, border-radius 0.3s cubic-bezier(.4,2,.6,1)",
                      border: "1px solid var(--border)",
                      background: "var(--glass-bg)",
                      backdropFilter: "blur(8px) saturate(180%)",
                      WebkitBackdropFilter: "blur(8px) saturate(180%)",
                    }}
                  >
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        saveEdit();
                      }}
                      className="flex flex-col gap-2"
                    >
                      <input
                        className="w-full p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        disabled={savingEdit}
                        autoFocus
                      />
                      <textarea
                        className="w-full p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        disabled={savingEdit}
                        placeholder="Descripción"
                      />
                      <input
                        type="datetime-local"
                        className="w-full p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                        value={editDueDate || ""}
                        onChange={e => setEditDueDate(e.target.value)}
                        disabled={savingEdit}
                      />
                      <input
                        type="datetime-local"
                        className="w-full p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                        value={editReminderDate || ""}
                        onChange={e => setEditReminderDate(e.target.value)}
                        onBlur={() => {
                          if (clickedOutside) {
                            setTimeout(() => {
                              saveEdit();
                            }, 0);
                          }
                        }}
                        disabled={savingEdit}
                      />
                      <div className="flex gap-2 mt-2 justify-center">
                        <button
                          className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-7 py-2 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
                          type="submit"
                          disabled={savingEdit}
                        >
                          Save
                        </button>
                        <button
                          className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-7 py-2 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
                          type="button"
                          onClick={() => setEditingTaskId(null)}
                          disabled={savingEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {/* Task Lists */}
      <div>
        <h2 className="text-xl font-bold mb-2 text-[var(--tasks-h2-text)]">Task Lists</h2>
        <form onSubmit={addList} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            className="p-2 w-48 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
            value={newList}
            onChange={e => setNewList(e.target.value)}
            placeholder="New list"
          />
          <button
            className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-5 py-2 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
            type="submit"
          >
            Create list
          </button>
        </form>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start">
          {lists.map(list => (
            <div
              key={list.id}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop(list.id)}
              className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg p-3 sm:p-4 rounded-4xl shadow w-full sm:min-w-[250px] group relative flex flex-col border border-[var(--border)]"
              style={{
                minWidth: "unset",
                marginBottom: 24,
                background: "var(--glass-bg)",
                boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
                border: "1px solid var(--border)",
                backdropFilter: "blur(8px) saturate(180%)",
                WebkitBackdropFilter: "blur(8px) saturate(180%)",
              }}
            >
              <div className="flex items-center mb-2">
                <h3 className="font-bold flex-1 text-xl text-[var(--tasks-text-color)]">{list.name}</h3>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-red-400 hover:text-red-600"
                  title="Delete list"
                  onClick={() => {
                    setDeleteListId(list.id);
                    setShowDeleteModal(true);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <form
                onSubmit={e => addTaskToList(e, list.id)}
                className="flex gap-2 mt-2"
              >
                <input
                  className="flex-1 p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                  value={listTaskInputs[list.id] || ""}
                  onChange={e =>
                    setListTaskInputs(inputs => ({
                      ...inputs,
                      [list.id]: e.target.value,
                    }))
                  }
                  placeholder="New task in list"
                />
                <button
                  className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-6 py-2 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
                  type="submit"
                >
                  Add
                </button>
              </form>
              <ul className="space-y-2 mt-4">
                {tasks.filter(t => t.taskListId === list.id).map(task => {
                  const days = daysUntil(task.dueDate);
                  return (
                    <li
                      key={task.id}
                      draggable={editingTaskId !== task.id}
                      onDragStart={editingTaskId !== task.id ? onDragStart(task.id) : undefined}
                      className={`flex flex-col gap-1 bg-gray-800 p-2 max-w-md w-full
                        ${shinyId === task.id ? "shine-and-scale" : ""}
                        ${editingTaskId === task.id ? "rounded-3xl" : "rounded-3xl"}
                        glass-border
                        backdrop-blur-lg
                        `}
                      style={{
                        background: "var(--glass-bg)",
                        boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
                        border: "1px solid var(--border)",
                        margin: "0 auto",
                      }}
                    >
                      {/* BUTTONS ROW - above */}
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          className="px-2 py-2 rounded-full glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
                          title="Tags"
                          onClick={() => setShowTagModalForTask(task.id)}
                          type="button"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="var(--tasks-tag-icon)" className="size-4">
                            <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v2.879a2.5 2.5 0 0 0 .732 1.767l4.5 4.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-4.5-4.5A2.5 2.5 0 0 0 7.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          className="px-2 py-2 rounded-full glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] text-red-400 transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)] hover:text-red-600"
                          onClick={() => deleteTask(task.id)}
                          title="Delete task"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          className="px-2 py-2 rounded-full glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] text-gray-400 transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)] hover:text-blue-500"
                          title="Edit task"
                          onClick={e => {
                            e.stopPropagation();
                            openEditDropdown(task);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                            <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                          </svg>
                        </button>
                      </div>
                      {/* TASK ROW */}
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <input
                          type="checkbox"
                          checked={!!task.isDone}
                          onChange={() => toggleTask(task)}
                        />
                        <span
                          className={`flex-1 relative transition-colors duration-300 ${task.isDone ? "text-gray-400" : ""
                            }`}
                          style={{ display: "inline-block" }}
                        >
                          <span
                            className={`transition-all duration-300 ${task.isDone ? "line-through-task" : ""
                              }`}
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            {task.content}
                          </span>
                          {typeof days === "number" && (
                            <span className="ml-2 text-xs text-gray-400 font-semibold">
                              {days === 0
                                ? "hoy"
                                : days > 0
                                  ? `${days} days`
                                  : `${Math.abs(days)} days ago`}
                            </span>
                          )}
                        </span>
                      </div>
                      {/* Tags display */}
                      <div className="flex gap-1 ml-6 flex-wrap">
                        {(task.tags || []).map((tag) => (
                          <span
                            key={tag.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                            style={{ background: tag.color, color: "#fff" }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                            </svg>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      {/* Tag Picker Modal */}

                      {/* Inline edit dropdown */}
                      {editingTaskId === task.id && (
                        <div
                          ref={editDropdownRef}
                          className={`
                            transition-all duration-300
                            overflow-hidden
                            rounded-3xl
                            border glass-border
                            bg-[var(--glass-bg)] backdrop-blur-lg
                            mt-2
                            ${editingTaskId === task.id ? "edit-dropdown-open" : "edit-dropdown-closed"}
                          `}
                          style={{
                            maxHeight: editingTaskId === task.id ? 400 : 0,
                            opacity: editingTaskId === task.id ? 1 : 0,
                            boxShadow: editingTaskId === task.id ? "0 4px 24px 0 rgba(0,0,0,0.08)" : "none",
                            pointerEvents: editingTaskId === task.id ? "auto" : "none",
                            marginTop: 12,
                            transition: "max-height 0.3s cubic-bezier(.4,2,.6,1), opacity 0.2s, box-shadow 0.2s, border-radius 0.3s cubic-bezier(.4,2,.6,1)",
                            border: "1px solid var(--border)",
                            background: "var(--glass-bg)",
                            backdropFilter: "blur(8px) saturate(180%)",
                            WebkitBackdropFilter: "blur(8px) saturate(180%)",
                          }}
                        >
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              saveEdit();
                            }}
                            className="flex flex-col gap-2"
                          >
                            <input
                              className="w-full p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              disabled={savingEdit}
                              autoFocus
                            />
                            <textarea
                              className="w-full p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                              value={editDescription}
                              onChange={e => setEditDescription(e.target.value)}
                              disabled={savingEdit}
                              placeholder="Description"
                            />
                            <input
                              type="datetime-local"
                              className="w-full p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                              value={editDueDate || ""}
                              onChange={e => setEditDueDate(e.target.value)}
                              disabled={savingEdit}
                            />
                            <input
                              type="datetime-local"
                              className="w-full p-2 rounded-3xl glass-border bg-[var(--glass-bg)] text-[var(--tasks-input-text)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition backdrop-blur-lg"
                              value={editReminderDate || ""}
                              onChange={e => setEditReminderDate(e.target.value)}
                              onBlur={() => {
                                if (clickedOutside) {
                                  setTimeout(() => {
                                    saveEdit();
                                  }, 0);
                                }
                              }}
                              disabled={savingEdit}
                            />
                            <div className="flex gap-2 mt-2 justify-center">
                              <button
                                className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-7 py-2 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
                                type="submit"
                                disabled={savingEdit}
                              >
                                Save
                              </button>
                              <button
                                className="glass-border bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--border)] px-7 py-2 rounded-full text-[var(--tasks-input-text)] font-semibold transition hover:border-[var(--accent)] hover:shadow-[0_0_0_2px_var(--accent),0_4px_32px_0_rgba(0,0,0,0.12)]"
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                disabled={savingEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* Delete List Modal */}
      {showDeleteModal && (
        <div className="fixed rounded-3xl inset-0 flex items-center justify-center z-50">
          <div
            className="rounded-3xl p-6 relative glass-border border border-[var(--border)] shadow-2xl"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(16px) saturate(200%)",
              WebkitBackdropFilter: "blur(16px) saturate(200%)",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
            }}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl"
              onClick={() => setShowDeleteModal(false)}
              aria-label="close"
            >
              ×
            </button>
            <div className="text-lg font-bold mb-4">Delete list?</div>
            <p className="mb-4">Tasks will be moved to task space</p>
            <div className="flex gap-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-full"
                onClick={handleDeleteList}
              >
                Delete
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded-full"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showTagModalForTask !== null && (
        <TagPickerModal
          tags={tags}
          selectedTagIds={
            (tasks.find(t => t.id === showTagModalForTask)?.tags || []).map(t => t.id)
          }
          onToggle={handleToggleTaskTag}
          onClose={() => setShowTagModalForTask(null)}
          onEdit={onEditTag}
          onDelete={onDeleteTag}
          onCreate={onCreateTag}
        />
      )}
    </div>
  );
}
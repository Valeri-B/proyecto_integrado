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
        <h2 className="text-xl font-bold mb-2">Tareas sueltas</h2>
        <form onSubmit={addTask} className="flex gap-2 mb-4">
          <input
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Nueva tarea"
          />
          <button className="bg-[var(--accent)] px-4 py-2 rounded text-white font-semibold" type="submit">
            Añadir
          </button>
        </form>
        <ul className="space-y-2">
          {tasks.filter(t => !t.taskListId).map(task => {
            const days = daysUntil(task.dueDate);
            return (
              <li
                key={task.id}
                draggable={editingTaskId !== task.id}
                onDragStart={editingTaskId !== task.id ? onDragStart(task.id) : undefined}
                className={`flex flex-col gap-1 mb-2 bg-gray-800 p-2 rounded ${shinyId === task.id ? "shine-and-scale" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!task.isDone}
                    onChange={() => toggleTask(task)}
                  />
                  <span className={task.isDone ? "line-through text-gray-400 flex-1" : "flex-1"}>
                    {task.content}
                    {typeof days === "number" && (
                      <span className="ml-2 text-xs text-gray-400 font-semibold">
                        {days === 0
                          ? "hoy"
                          : days > 0
                          ? `${days} días`
                          : `${Math.abs(days)} días atrás`}
                      </span>
                    )}
                  </span>
                  {/* TAG BUTTON */}
                  <button
                    className="ml-2 px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600"
                    title="Etiquetas"
                    onClick={() => setShowTagModalForTask(task.id)}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="ml-2 text-red-400 hover:text-red-600"
                    onClick={() => deleteTask(task.id)}
                    title="Eliminar tarea"
                  >
                    🗑
                  </button>
                  <button
                    className="text-gray-400 hover:text-blue-500 transition"
                    title="Editar tarea"
                    onClick={e => {
                      e.stopPropagation();
                      openEditDropdown(task);
                    }}
                  >
                    ✏️
                  </button>
                </div>
                {/* Tags display */}
                <div className="flex gap-1 ml-6 flex-wrap">
                  {(task.tags || []).map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs"
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
                {showTagModalForTask === task.id && (
                  <TagPickerModal
                    tags={tags}
                    selectedTagIds={(task.tags || []).map(t => t.id)}
                    onToggle={handleToggleTaskTag}
                    onClose={() => setShowTagModalForTask(null)}
                    onEdit={onEditTag}
                    onDelete={onDeleteTag}
                    onCreate={onCreateTag}
                  />
                )}
                {/* Inline edit dropdown */}
                {editingTaskId === task.id && (
                  <div
                    ref={editDropdownRef}
                    className="transition-all duration-300 overflow-hidden bg-gray-900 rounded-lg border border-gray-700 mt-2 max-h-[400px] opacity-100 p-4"
                    style={{
                      pointerEvents: "auto",
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
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        disabled={savingEdit}
                        autoFocus
                      />
                      <textarea
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        disabled={savingEdit}
                        placeholder="Descripción"
                      />
                      <input
                        type="datetime-local"
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
                        value={editDueDate || ""}
                        onChange={e => setEditDueDate(e.target.value)}
                        disabled={savingEdit}
                      />
                      <input
                        type="datetime-local"
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
                        value={editReminderDate || ""}
                        onChange={e => setEditReminderDate(e.target.value)}
                        onBlur={() => {
                          // If the user is clicking outside, ensure the latest value is saved
                          if (clickedOutside) {
                            setTimeout(() => {
                              saveEdit();
                            }, 0);
                          }
                        }}
                        disabled={savingEdit}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          className="bg-green-600 px-4 py-2 rounded text-white font-semibold"
                          type="submit"
                          disabled={savingEdit}
                        >
                          Guardar
                        </button>
                        <button
                          className="bg-gray-700 px-4 py-2 rounded text-white font-semibold"
                          type="button"
                          onClick={() => setEditingTaskId(null)}
                          disabled={savingEdit}
                        >
                          Cancelar
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
        <h2 className="text-xl font-bold mb-2">Listas de tareas</h2>
        <form onSubmit={addList} className="flex gap-2 mb-4">
          <input
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
            value={newList}
            onChange={e => setNewList(e.target.value)}
            placeholder="Nueva lista"
          />
          <button className="bg-green-600 px-4 py-2 rounded text-white font-semibold" type="submit">
            Crear lista
          </button>
        </form>
        <div className="flex gap-8">
          {lists.map(list => (
            <div
              key={list.id}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop(list.id)}
              className="bg-gray-900 p-4 rounded-2xl shadow min-w-[250px] group relative flex flex-col"
              style={{ minWidth: 300, marginBottom: 24 }}
            >
              <div className="flex items-center mb-2">
                <h3 className="font-bold flex-1">{list.name}</h3>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-red-400 hover:text-red-600"
                  title="Eliminar lista"
                  onClick={() => {
                    setDeleteListId(list.id);
                    setShowDeleteModal(true);
                  }}
                >
                  🗑
                </button>
              </div>
              <form
                onSubmit={e => addTaskToList(e, list.id)}
                className="flex gap-2 mt-2"
              >
                <input
                  className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
                  value={listTaskInputs[list.id] || ""}
                  onChange={e =>
                    setListTaskInputs(inputs => ({
                      ...inputs,
                      [list.id]: e.target.value,
                    }))
                  }
                  placeholder="Nueva tarea en lista"
                />
                <button className="bg-[var(--accent)] px-4 py-2 rounded text-white font-semibold" type="submit">
                  Añadir
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
                      className={`flex flex-col gap-1 mb-2 bg-gray-800 p-2 rounded ${shinyId === task.id ? "shine-and-scale" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!task.isDone}
                          onChange={() => toggleTask(task)}
                        />
                        <span className={task.isDone ? "line-through text-gray-400 flex-1" : "flex-1"}>
                          {task.content}
                          {typeof days === "number" && (
                            <span className="ml-2 text-xs text-gray-400 font-semibold">
                              {days === 0
                                ? "hoy"
                                : days > 0
                                ? `${days} días`
                                : `${Math.abs(days)} días atrás`}
                            </span>
                          )}
                        </span>
                        {/* TAG BUTTON */}
                        <button
                          className="ml-2 px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600"
                          title="Etiquetas"
                          onClick={() => setShowTagModalForTask(task.id)}
                          type="button"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          className="ml-2 text-red-400 hover:text-red-600"
                          onClick={() => deleteTask(task.id)}
                          title="Eliminar tarea"
                        >
                          🗑
                        </button>
                        <button
                          className="text-gray-400 hover:text-blue-500 transition"
                          title="Editar tarea"
                          onClick={e => {
                            e.stopPropagation();
                            openEditDropdown(task);
                          }}
                        >
                          ✏️
                        </button>
                      </div>
                      {/* Tags display */}
                      <div className="flex gap-1 ml-6 flex-wrap">
                        {(task.tags || []).map((tag) => (
                          <span
                            key={tag.id}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
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
                      {showTagModalForTask === task.id && (
                        <TagPickerModal
                          tags={tags}
                          selectedTagIds={(task.tags || []).map(t => t.id)}
                          onToggle={handleToggleTaskTag}
                          onClose={() => setShowTagModalForTask(null)}
                          onEdit={onEditTag}
                          onDelete={onDeleteTag}
                          onCreate={onCreateTag}
                        />
                      )}
                      {/* Inline edit dropdown */}
                      {editingTaskId === task.id && (
                        <div
                          ref={editDropdownRef}
                          className="transition-all duration-300 overflow-hidden bg-gray-900 rounded-lg border border-gray-700 mt-2 max-h-[400px] opacity-100 p-4"
                          style={{
                            pointerEvents: "auto",
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
                              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              disabled={savingEdit}
                              autoFocus
                            />
                            <textarea
                              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
                              value={editDescription}
                              onChange={e => setEditDescription(e.target.value)}
                              disabled={savingEdit}
                              placeholder="Descripción"
                            />
                            <input
                              type="datetime-local"
                              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
                              value={editDueDate || ""}
                              onChange={e => setEditDueDate(e.target.value)}
                              disabled={savingEdit}
                            />
                            <input
                              type="datetime-local"
                              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
                              value={editReminderDate || ""}
                              onChange={e => setEditReminderDate(e.target.value)}
                              onBlur={() => {
                                // If the user is clicking outside, ensure the latest value is saved
                                if (clickedOutside) {
                                  setTimeout(() => {
                                    saveEdit();
                                  }, 0);
                                }
                              }}
                              disabled={savingEdit}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                className="bg-green-600 px-4 py-2 rounded text-white font-semibold"
                                type="submit"
                                disabled={savingEdit}
                              >
                                Guardar
                              </button>
                              <button
                                className="bg-gray-700 px-4 py-2 rounded text-white font-semibold"
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                disabled={savingEdit}
                              >
                                Cancelar
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-[var(--panel)] rounded-xl p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl"
              onClick={() => setShowDeleteModal(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="text-lg font-bold mb-4">¿Eliminar lista?</div>
            <p className="mb-4">Las tareas se moverán a "Tareas sueltas".</p>
            <div className="flex gap-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteList}
              >
                Eliminar
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
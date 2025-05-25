import { useEffect, useState } from "react";

type Task = {
  id: number;
  content: string;
  isDone: boolean;
  dueDate?: string | null;
  taskListId?: number | null;
};

type TaskList = {
  id: number;
  name: string;
};

type Reminder = {
  id: number;
  remindAt: string;
};

export default function TasksBoard({ userId }: { userId: number }) {
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

  // Edit modal state
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editReminder, setEditReminder] = useState<string>("");
  const [reminderId, setReminderId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";

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
    setLists(await listsRes.json());
    setTasks(await tasksRes.json());
    setLoading(false);
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

  // --- Edit Task Modal Logic ---

  // Open modal and load reminder if exists
  const openEditModal = async (task: Task) => {
    setEditTask(task);
    setEditContent(task.content);
    setEditDueDate(toDatetimeLocalValue(task.dueDate));
    setEditReminder("");
    setReminderId(null);
    setShowEditModal(true);

    // Fetch reminder if exists
    const res = await fetch(`${API_URL}/reminders/${task.id}`);
    if (res.ok) {
      const reminders: Reminder[] = await res.json();
      if (reminders.length > 0) {
        setEditReminder(toDatetimeLocalValue(reminders[0].remindAt));
        setReminderId(reminders[0].id);
      }
    }
  };

  // Save changes to task and reminder
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    setSavingEdit(true);

    // Update task content and due date
    await fetch(`${API_URL}/tasks/${editTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: editContent,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      }),
    });

    // Handle reminder
    if (editReminder) {
      // If reminder exists, update or create
      if (reminderId) {
        await fetch(`${API_URL}/reminders/${reminderId}`, {
          method: "DELETE",
        });
      }
      await fetch(`${API_URL}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: editTask.id,
          remindAt: new Date(editReminder).toISOString(),
        }),
      });
    } else if (reminderId) {
      // If reminder was removed
      await fetch(`${API_URL}/reminders/${reminderId}`, {
        method: "DELETE",
      });
    }

    setSavingEdit(false);
    setShowEditModal(false);
    setEditTask(null);
    fetchAll();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Single Tasks */}
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
            placeholder="Nueva tarea suelta"
          />
          <button className="bg-[var(--accent)] px-4 py-2 rounded text-white font-semibold" type="submit">
            Añadir
          </button>
        </form>
        {loading ? (
          <div className="text-gray-400">Cargando...</div>
        ) : (
          <ul>
            {tasks.filter(t => !t.taskListId).map(task => (
              <li
                key={task.id}
                draggable
                onDragStart={onDragStart(task.id)}
                className="bg-gray-800 p-2 rounded mb-2 flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={!!task.isDone}
                  onChange={() => toggleTask(task)}
                />
                <span className={task.isDone ? "line-through text-gray-400" : ""}>{task.content}</span>
                <button
                  className="ml-auto text-blue-400 hover:text-blue-600 mr-2"
                  onClick={() => openEditModal(task)}
                  title="Editar tarea"
                >
                  ✏️
                </button>
                <button
                  className="text-red-400 hover:text-red-600"
                  onClick={() => deleteTask(task.id)}
                  title="Eliminar tarea"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
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
          <button className="bg-blue-600 px-4 py-2 rounded text-white font-semibold" type="submit">
            Crear lista
          </button>
        </form>
        <div className="flex gap-8 flex-wrap">
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
              <ul>
                {tasks
                  .filter(t => t.taskListId === list.id)
                  .map(task => (
                    <li
                      key={task.id}
                      draggable
                      onDragStart={onDragStart(task.id)}
                      className="flex items-center gap-2 mb-2 bg-gray-800 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={!!task.isDone}
                        onChange={() => toggleTask(task)}
                      />
                      <span className={task.isDone ? "line-through text-gray-400" : ""}>{task.content}</span>
                      <button
                        className="ml-auto text-blue-400 hover:text-blue-600 mr-2"
                        onClick={() => openEditModal(task)}
                        title="Editar tarea"
                      >
                        ✏️
                      </button>
                      <button
                        className="text-red-400 hover:text-red-600"
                        onClick={() => deleteTask(task.id)}
                        title="Eliminar tarea"
                      >
                        🗑
                      </button>
                    </li>
                  ))}
              </ul>
              {/* Add task to this list */}
              <form
                onSubmit={e => addTaskToList(e, list.id)}
                className="flex gap-2 mt-2"
              >
                <input
                  name="newTask"
                  className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
                  placeholder="Añadir tarea a la lista"
                  value={listTaskInputs[list.id] || ""}
                  onChange={e =>
                    setListTaskInputs(inputs => ({
                      ...inputs,
                      [list.id]: e.target.value,
                    }))
                  }
                />
                <button className="bg-[var(--accent)] px-2 py-1 rounded text-white font-semibold" type="submit">
                  Añadir
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
      {/* Delete List Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-[var(--panel)] p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 border border-[var(--border)]">
            <h2 className="text-xl font-bold text-white mb-2">
              ¿Eliminar la lista? Las tareas pasarán a "tareas sueltas".
            </h2>
            <div className="flex flex-col gap-2">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                onClick={handleDeleteList}
              >
                Eliminar lista
              </button>
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-semibold"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Task Modal */}
      {showEditModal && editTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <form
            className="bg-[var(--panel)] p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 border border-[var(--border)]"
            onSubmit={handleSaveEdit}
          >
            <h2 className="text-xl font-bold text-white mb-2">Editar tarea</h2>
            <label className="text-white font-semibold">Contenido</label>
            <input
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              required
              disabled={savingEdit}
            />
            <label className="text-white font-semibold mt-2">Fecha límite (opcional)</label>
            <input
              type="datetime-local"
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
              value={editDueDate || ""}
              onChange={e => setEditDueDate(e.target.value)}
              disabled={savingEdit}
            />
            <label className="text-white font-semibold mt-2">Recordatorio (opcional)</label>
            <input
              type="datetime-local"
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
              value={editReminder || ""}
              onChange={e => setEditReminder(e.target.value)}
              disabled={savingEdit}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-semibold"
                onClick={() => setShowEditModal(false)}
                disabled={savingEdit}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                disabled={savingEdit}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
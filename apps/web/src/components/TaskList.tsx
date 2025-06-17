import { useEffect, useState } from "react";

type Task = {
  id: number;
  content: string;
  isDone: boolean;
};

export default function TaskList({ noteId, userId }: { noteId?: number; userId?: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [shinyId, setShinyId] = useState<number | null>(null);

  // Fetch tasks for the note or all tasks for the user
  useEffect(() => {
    setLoading(true);
    let url = "";
    if (noteId) {
      url = `/api/tasks/${noteId}`;
    } else if (userId) {
      url = `/api/tasks?userId=${userId}`;
    }
    if (!url) return;
    fetch(url)
      .then(res => res.json())
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [noteId, userId]);

  // Toggle task completion
  const toggleTask = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: !task.isDone }),
    });
    setTasks(tasks =>
      tasks.map(t =>
        t.id === task.id ? { ...t, isDone: !t.isDone } : t
      )
    );
  };

  // Delete task
  const deleteTask = async (taskId: number) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setTasks(tasks => tasks.filter(t => t.id !== taskId));
  };

  // Add new task (from input)
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const res = await fetch(`/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteId ? { noteId, content: newTask } : { userId, content: newTask }),
    });
    const task = await res.json();
    setTasks(tasks => [...tasks, task]);
    setNewTask("");
  };

  // FAB: Add one empty task
  const handleAddTask = async () => {
    const res = await fetch(`/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteId ? { noteId, content: "New task" } : { userId, content: "New task" }),
    });
    const task = await res.json();
    setTasks(tasks => [...tasks, task]);
    setFabOpen(false);
  };

  // FAB: Add a list of three tasks
  const handleAddTaskList = async () => {
    const newTasks = ["Task 1", "Task 2", "Task 3"];
    for (const content of newTasks) {
      await fetch(`/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteId ? { noteId, content } : { userId, content }),
      });
    }
    // Refetch tasks
    setLoading(true);
    let url = "";
    if (noteId) {
      url = `/api/tasks/${noteId}`;
    } else if (userId) {
      url = `/api/tasks?userId=${userId}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(setTasks)
      .finally(() => setLoading(false));
    setFabOpen(false);
  };

  const onDragStart = (taskId: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", String(taskId));
    e.currentTarget.classList.add("opacity-50");
  };

  const onDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
  };

  const onDrop = async (e: React.DragEvent) => {
    const sourceId = Number(e.dataTransfer.getData("text/plain"));
    const targetId = Number((e.target as HTMLElement).closest("li")?.dataset.id);
    if (isNaN(sourceId) || isNaN(targetId) || sourceId === targetId) return;

    // Reorder logic here
    const sourceIndex = tasks.findIndex(t => t.id === sourceId);
    const targetIndex = tasks.findIndex(t => t.id === targetId);
    const updatedTasks = [...tasks];
    const [movedTask] = updatedTasks.splice(sourceIndex, 1);
    updatedTasks.splice(targetIndex, 0, movedTask);

    setTasks(updatedTasks);

    // Optionally, persist the new order to the server
    await fetch(`/api/tasks/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: movedTask.id, newOrder: targetIndex }),
    });
  };

  if (!noteId && !userId) return <div className="text-white">Select note or user to see tasks</div>;

  return (
    <div className="text-white max-w-md mx-auto relative">
      <h2 className="text-xl font-bold mb-4">Tasks</h2>
      <form onSubmit={addTask} className="flex gap-2 mb-4">
        <input
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Nueva tarea"
        />
        <button className="bg-[var(--accent)] px-4 py-2 rounded text-white font-semibold" type="submit">
          add
        </button>
      </form>
      {loading ? (
        <div>loading...</div>
      ) : (
        <ul className="space-y-2">
          {tasks.map(task => (
            <li
              key={task.id}
              draggable={editingTaskId !== task.id}
              onDragStart={editingTaskId !== task.id ? onDragStart(task.id) : undefined}
              className={`flex flex-col gap-1 mb-2 bg-gray-800 p-2 rounded ${
                shinyId === task.id ? "shine-and-scale" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!task.isDone}
                  onChange={() => toggleTask(task)}
                />
                <span className={task.isDone ? "line-through text-gray-400" : ""}>{task.content}</span>
                <button
                  className="ml-auto text-red-400 hover:text-red-600"
                  onClick={() => deleteTask(task.id)}
                  title="delete task"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* FAB */}
      <button
        className="fixed bottom-10 right-10 z-50 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-all"
        onClick={() => setFabOpen(true)}
        style={{ fontSize: 32, fontWeight: "bold" }}
        aria-label="Expandir acciones"
      >
        +
      </button>
      {fabOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setFabOpen(false)}
        >
          <div
            className="absolute bottom-24 right-10 bg-[var(--panel)] rounded-xl shadow-2xl flex flex-col gap-2 p-6 z-50 border border-[var(--border)]"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] text-left font-semibold"
              onClick={handleAddTask}
            >
              Create task
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left font-semibold"
              onClick={handleAddTaskList}
            >
              Create tasklist
            </button>
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-left font-semibold"
              onClick={() => setFabOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
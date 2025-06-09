import React from "react";

type Tag = { id: number; name: string; color: string };
type Note = { id: number; title: string; tags?: Tag[] };
type Task = { id: number; content: string; tags?: Tag[] };

export default function TagResultsModal({
  tag,
  notes,
  tasks,
  onClose,
  onOpenNote,
  onOpenTask,
}: {
  tag: Tag;
  notes: Note[];
  tasks: Task[];
  onClose: () => void;
  onOpenNote: (note: Note) => void;
  onOpenTask: (task: Task) => void;
}) {
  const taggedNotes = notes.filter(n => n.tags?.some(t => t.id === tag.id));
  const taggedTasks = tasks.filter(t => t.tags?.some(tg => tg.id === tag.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div
        className="rounded-4xl p-8 w-full max-w-lg relative border glass-border shadow-2xl"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px) saturate(200%)",
          WebkitBackdropFilter: "blur(16px) saturate(200%)",
          border: "1px solid var(--border)",
        }}
      >
        <button className="absolute top-3 right-3 text-2xl" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
        <h2 className="text-lg font-bold mb-4 flex items-center">
          {/* Tag icon SVG with tag color */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill={tag.color}
            stroke={tag.color}
            strokeWidth={1.5}
            className="w-5 h-5 mr-2"
          >
            <path
              fill={tag.color}
              stroke={tag.color}
              strokeWidth="1.5"
              d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5Z"
            />
            <circle fill={tag.color} cx="5" cy="6" r="1" />
          </svg>
          <span style={{ color: "var(--tag-result-modal-text)" }}>{tag.name}</span>
        </h2>
        <div>
          <div className="font-semibold mb-2" style={{ color: "var(--tag-result-modal-text)" }}>Notes</div>
          {taggedNotes.length === 0 && <div className="text-gray-400 mb-2">There are no notes with this tag</div>}
          <ul className="mb-4">
            {taggedNotes.map(note => (
              <li
                key={note.id}
                className="cursor-pointer flex items-center gap-2 text-blue-400 hover:underline"
                onClick={() => { onOpenNote(note); onClose(); }}
              >
                {/* Note SVG */}
                <svg
                  width="1em"
                  height="1em"
                  viewBox="0 0 1024 1024"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="var(--note-icon-search-result)"
                  style={{ flexShrink: 0 }}
                >
                  <rect x="192" y="192" width="640" height="640" rx="120" ry="120" />
                </svg>
                <span>{note.title}</span>
              </li>
            ))}
          </ul>
          <div className="font-semibold mb-2" style={{ color: "var(--tag-result-modal-text)" }}>Tasks</div>
          {taggedTasks.length === 0 && <div className="text-gray-400">There are no tasks with this tag</div>}
          <ul>
            {taggedTasks.map(task => (
              <li
                key={task.id}
                className="cursor-pointer flex items-center gap-2 text-purple-400 hover:underline"
                onClick={() => { onOpenTask(task); onClose(); }}
              >
                {/* Task SVG */}
                <svg
                  fill="var(--task-icon-search-result)"
                  width="1em"
                  height="1em"
                  viewBox="-2 -2 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M6 0h8a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6zm6 9a1 1 0 0 0 0 2h3a1 1 0 1 0 0-2h-3zm-2 4a1 1 0 0 0 0 2h5a1 1 0 1 0 0-2h-5zm0-8a1 1 0 1 0 0 2h5a1 1 0 0 0 0-2h-5zm-4.172 5.243l-.707-.707a1 1 0 1 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.415 0l2.828-2.828A1 1 0 0 0 7.95 8.12l-2.122 2.122z" />
                </svg>
                <span>{task.content}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
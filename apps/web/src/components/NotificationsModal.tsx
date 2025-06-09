export default function NotificationsModal({
  notifications,
  onDismiss,
  onTaskDone,
}: {
  notifications: any[];
  onDismiss: (id: number) => void;
  onTaskDone: (notification: any) => void;
}) {
  if (!notifications.length) return null;
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
      {notifications.map(n => (
        <div key={n.id} className="bg-[var(--panel)] border border-[var(--accent)] rounded-xl shadow-lg p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="font-bold text-[var(--accent)]">Recordatorio</div>
            <div>{n.content}</div>
            <div className="text-xs text-gray-400">{n.remindAt}</div>
          </div>
          <button
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={() => onTaskDone(n)}
          >
            ✓ Hecho
          </button>
          <button
            className="bg-gray-600 text-white px-3 py-1 rounded"
            onClick={() => onDismiss(n.id)}
          >
            Ignorar
          </button>
        </div>
      ))}
    </div>
  );
}
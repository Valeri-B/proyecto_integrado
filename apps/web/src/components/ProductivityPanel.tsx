import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useRef, useState } from "react";
import TagsManagerModal from "@/components/TagsManagerModal";

export default function ProductivityPanel({
  collapsed,
  setCollapsed,
  productivityCollapsed,
  setProductivityCollapsed,
  notifications,
  handleTaskToggleFromNotification,
  dismissNotification,
  showGlobalSearch,
  setShowGlobalSearch,
  calendarVisible,
  setCalendarVisible,
  smallSearchInputRef,
  setShowFabModal,
  setFabMode,
  userId,
  tags,
  onCreateTag,
  onEditTag,
  onDeleteTag,
  showTagsModal,
  setShowTagsModal,
}: {
  collapsed: boolean;
  setCollapsed: (b: boolean) => void;
  productivityCollapsed: boolean;
  setProductivityCollapsed: (b: boolean) => void;
  notifications: any[];
  handleTaskToggleFromNotification: (n: any, isDone: boolean) => void;
  dismissNotification: (id: number) => void;
  showGlobalSearch: boolean;
  setShowGlobalSearch: (b: boolean) => void;
  calendarVisible: boolean;
  setCalendarVisible: (b: boolean) => void;
  smallSearchInputRef: React.RefObject<HTMLInputElement>;
  setShowFabModal: (b: boolean) => void;
  setFabMode: (mode: "note" | "folder" | null) => void;
  userId: number;
  tags: { id: number; name: string; color: string }[];
  onCreateTag: (name: string, color: string) => void;
  onEditTag: (id: number, name: string, color: string) => void;
  onDeleteTag: (id: number) => void;
  showTagsModal: boolean;
  setShowTagsModal: (b: boolean) => void;
}) {
  const [showTagsModalLocal, setShowTagsModalLocal] = useState(false);

  return (
    <aside
      className={`
        flex flex-col
        border-l border-[var(--border)]
        shadow-lg
        transition-all duration-300
        backdrop-blur-lg
        backdrop-saturate-200
        ${productivityCollapsed ? "w-14 p-2" : "w-80 p-8"}
      `}
      style={{
        minWidth: productivityCollapsed ? 56 : 320,
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(1.5px)",
        WebkitBackdropFilter: "blur(1.5px)",
        borderRadius: 0,
        borderLeft: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        {!productivityCollapsed && (
          <h2 className="text-xl font-bold mb-0 text-[var(--productvt-panel-h2)]" >Productivity Panel</h2>
        )}
        <button
          className={`
    flex items-center justify-center
    border border-transparent hover:border-[var(--border)] transition
    rounded-xl
    w-10 h-10
    bg-transparent
  `}
          style={{ cursor: "pointer" }}
          onClick={() => setProductivityCollapsed((c) => !c)}
          title={productivityCollapsed ? "Expand panel" : "Collapse panel"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-7 h-7 sidebar-toggle-icon"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 5V19M16 8H18M16 11H18M16 14H18M6.2 19H17.8C18.9201 19 19.4802 19 19.908 18.782C20.2843 18.5903 20.5903 18.2843 20.782 17.908C21 17.4802 21 16.9201 21 15.8V8.2C21 7.0799 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V15.8C3 16.9201 3 17.4802 3.21799 17.908C3.40973 18.2843 3.71569 18.5903 4.09202 18.782C4.51984 19 5.07989 19 6.2 19Z"
              stroke="var(--sidebar-toggle-icon)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* --- SMALL SEARCH BAR ABOVE CALENDAR --- */}
      {!productivityCollapsed && (
        <div className="mb-4">
          <div
            className="
        flex items-center w-full
        bg-[var(--glass-bg)]/80
        border border-[var(--border)]
        rounded-2xl
        shadow-lg
        backdrop-blur-lg
        px-4 py-2
        gap-2
        transition
      "
            style={{
              boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
              minHeight: 44,
            }}
          >
            {/* Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--search-icon)" className="w-5 h-5 opacity-80 text-[var(--foreground)]">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            {/* Placeholder text */}
            <span className="text-[var(--search-text)] text-base font-medium opacity-80 select-none">Search</span>
            {/* Shortcut badge */}
            <span className="shortcut-badge select-none">
              Ctrl + Q
            </span>
            {/* Input (invisible, overlays the bar for click/focus) */}
            <input
              ref={smallSearchInputRef}
              type="text"
              className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer"
              readOnly={true}
              tabIndex={0}
              onClick={e => {
                setShowGlobalSearch(true);
                setTimeout(() => {
                  const modalInput = document.querySelector<HTMLInputElement>(".global-search-modal-input");
                  if (modalInput) modalInput.focus();
                }, 30);
              }}
              style={{ cursor: "pointer" }}
              aria-label="Buscar"
            />
          </div>
        </div>
      )}

      {/* Calendar */}
      {calendarVisible && !productivityCollapsed && (
        <div
          className={`
    bg-[var(--glass-bg)] rounded-xl p-4 mb-4 shadow-2xl
    backdrop-blur-lg backdrop-saturate-100
    calendar-animate
    ${calendarVisible ? "" : "calendar-animate-hide"}
  `}
        >
          <Calendar
            onClickDay={() => { }}
            className="rounded-xl"
          />
        </div>
      )}

      {/* Show calendar button if hidden */}
      {!calendarVisible && !productivityCollapsed && (
        <button
          className="flex items-center justify-center bg-[var(--glass-bg)] rounded-xl p-4 mb-4 shadow-2xl backdrop-blur-lg backdrop-saturate-200"
          onClick={() => setCalendarVisible(true)}
          title="Mostrar calendario"
        >
          <svg width="1.7em" height="1.7em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
            <path
              d="M3 9H21M7 3V5M17 3V5M6 12H8M11 12H13M16 12H18M6 15H8M11 15H13M16 15H18M6 18H8M11 18H13M16 18H18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"
              stroke="var(--calendar-icon)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {/* Notifications */}
      {!productivityCollapsed && notifications.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {notifications.map(n => (
            <div
              key={n.id}
              className="
          flex items-center gap-4 animate-fade-in
          border border-[var(--border)]
          rounded-xl shadow-2xl glass-border
          backdrop-blur-lg backdrop-saturate-200
          px-4 py-3
        "
              style={{
                background: "var(--glass-bg)",
                minWidth: 240,
              }}
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
        <div className="grid grid-cols-3 grid-rows-2 gap-3 mt-2 items-stretch">
          {/* Row 1, Col 1: New Note */}
          <button
            className="
      flex items-center justify-center
      border border-[var(--border)]
      rounded-xl shadow-2xl glass-border
      w-14 h-14 p-0
      backdrop-blur-lg backdrop-saturate-200
      transition hover:scale-103
      col-start-1 row-start-1
    "
            style={{ background: "var(--glass-bg)" }}
            title="Nueva nota"
            onClick={() => {
              setShowFabModal(true);
              setFabMode("note");
            }}
          >
            <svg width="1.7em" height="1.7em" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
              <rect x="192" y="192" width="640" height="640" rx="120" ry="120" fill="var(--note-icon)" />
            </svg>
          </button>
          {/* Row 1, Col 2: New Folder */}
          <button
            className="
      flex items-center justify-center
      border border-[var(--border)]
      rounded-xl shadow-2xl glass-border
      w-14 h-14 p-0
      backdrop-blur-lg backdrop-saturate-200
      transition hover:scale-103
      col-start-2 row-start-1
    "
            style={{ background: "var(--glass-bg)" }}
            title="Nueva carpeta"
            onClick={() => {
              setShowFabModal(true);
              setFabMode("folder");
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1.7em" height="1.7em" viewBox="0 0 48 48" fill="var(--folder-icon)" className="w-7 h-7">
              <path d="M40,12H22l-4-4H8c-2.2,0-4,1.8-4,4v24c0,2.2,1.8,4,4,4h29.7L44,29V16C44,13.8,42.2,12,40,12z"></path>
              <path d="M40,12H8c-2.2,0-4,1.8-4,4v20c0,2.2,1.8,4,4,4h32c2.2,0,4-1.8,4-4V16C44,13.8,42.2,12,40,12z"></path>
            </svg>
          </button>
          {/* Row 1, Col 3: Calendar Toggle */}
          <button
            className="
      flex items-center justify-center
      border border-[var(--border)]
      rounded-xl shadow-2xl glass-border
      w-14 h-14 p-0
      backdrop-blur-lg backdrop-saturate-200
      transition hover:scale-103
      col-start-3 row-start-1
    "
            style={{ background: "var(--glass-bg)" }}
            title={calendarVisible ? "Ocultar calendario" : "Mostrar calendario"}
            onClick={() => setCalendarVisible(v => !v)}
          >
            <svg width="1.7em" height="1.7em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
              <path
                d="M3 9H21M7 3V5M17 3V5M6 12H8M11 12H13M16 12H18M6 15H8M11 15H13M16 15H18M6 18H8M11 18H13M16 18H18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"
                stroke="var(--calendar-icon)"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </button>
          {/* Row 2, Col 1: Theme Toggle */}
          <div
            className="
    flex items-center justify-center
    w-14 h-14 p-0
    col-start-1 row-start-2
    bg-[var(--glass-bg)]
    rounded-xl
  "
            style={{ background: "var(--glass-bg)" }}
          >
            <ThemeToggle />
          </div>
          {/* Row 2, Col 2: Tag Manager */}
          <button
            className="
    flex items-center justify-center
    border border-[var(--border)]
    rounded-xl shadow-2xl glass-border
    w-14 h-14 p-0
    backdrop-blur-lg backdrop-saturate-200
    transition hover:scale-103
    col-start-2 row-start-2
    bg-[var(--glass-bg)]
  "
            style={{ background: "var(--glass-bg)" }}
            title="Gestionar tags"
            onClick={() => setShowTagsModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="var(--tag-icon)" strokeWidth={1.5} className="w-7 h-7">
              <path
                fill="var(--tag-icon)"
                stroke="var(--tag-icon)"
                strokeWidth="1.5"
                d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5Z"
              />
              <circle fill="var(--tag-icon)" cx="5" cy="6" r="1" />
            </svg>
          </button>
          {/* Row 2, Col 3: Logout */}
          <div
            className="
    flex items-center justify-center
    border border-[var(--border)]
    rounded-xl shadow-2xl glass-border
    w-14 h-14 p-0
    backdrop-blur-lg backdrop-saturate-200
    transition
    hover:scale-103
    col-start-3 row-start-2
    bg-[var(--glass-bg)]
  "
            style={{ background: "var(--glass-bg)" }}
          >
            <LogoutButton />
          </div>
        </div>
      )}
    </aside>
  );
}
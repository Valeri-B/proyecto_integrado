"use client";
import React, { useEffect, useState } from "react";

// --- Constants ---
const DAYS = 7;
const GRID_COLS = 10; // Shorter grid
const LIST_COLS = 20; // or however many columns you want in list view
const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_LABELS_MONDAY_FIRST = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getDateString(date: Date) {
  // Returns YYYY-MM-DD in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getTimeString(date: Date) {
  return date.toISOString();
}

// Helper: get Monday-based weekday index (0=Monday, 6=Sunday)
function getMondayIndex(date: Date) {
  // JS: 0=Sunday, 1=Monday, ..., 6=Saturday
  // We want: 0=Monday, ..., 6=Sunday
  return (date.getDay() + 6) % 7;
}

// --- Generate grid dates, aligned so first col is always Monday ---
function getHeatmapDatesGrid() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the most recent Monday (or today if today is Monday)
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysSinceMonday);

  // Fill grid column by column (vertical), so each column is a week, each row is a weekday
  const dates: Date[] = [];
  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row < DAYS; row++) {
      const d = new Date(lastMonday);
      d.setDate(lastMonday.getDate() - (GRID_COLS - col - 1) * 7 + row);
      dates.push(d);
    }
  }
  return dates;
}

const LIST_DAYS = 60; // Or however many days you want to show in the row

function getHeatmapDatesListRow() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  for (let i = LIST_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }
  return dates;
}

// Add this function to generate a grid of dates for the list view (7 rows, N columns)
function getHeatmapDatesListGrid() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the most recent Monday (or today if today is Monday)
  const dayOfWeek = today.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysSinceMonday);

  // Fill grid column by column (vertical), so each column is a week, each row is a weekday
  const dates: Date[] = [];
  for (let col = 0; col < LIST_COLS; col++) {
    for (let row = 0; row < DAYS; row++) {
      const d = new Date(lastMonday);
      d.setDate(lastMonday.getDate() - (LIST_COLS - col - 1) * 7 + row);
      dates.push(d);
    }
  }
  return dates;
}

// --- Color helpers ---
function hexToHSL(hex: string | null | undefined) {
  if (!hex || typeof hex !== "string" || (hex.length !== 4 && hex.length !== 7)) {
    // Default to a safe color (e.g., #39d353)
    hex = "#39d353";
  }
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function getIntensityColor(hex: string, count: number) {
  const { h, s } = hexToHSL(hex);
  const capped = Math.min(count, 4);
  const lightness = 85 - (capped - 1) * 13; // 1:85, 2:72, 3:59, 4+:46
  return `hsl(${h},${s}%,${lightness}%)`;
}

// --- Modal for creating heatmap ---
function CreateHeatmapModal({ onClose, onCreate }: { onClose: () => void, onCreate: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#39d353");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="bg-[var(--glass-bg)] rounded-2xl shadow-2xl border border-[var(--border)] p-8 w-full max-w-sm relative animate-scale-in glass-border"
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
          onClick={onClose}
          aria-label="Cerrar"
        >×</button>
        <div className="text-lg font-bold mb-4" style={{ color: "var(--heatmap-text)" }}>
          Create new heatmap
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (name.trim()) {
              onCreate(name.trim(), color);
              onClose();
            }
          }}
        >
          <input
            className="w-full p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--border)] shadow glass-border focus:ring-2 focus:ring-[var(--accent)] transition placeholder:text-gray-400/80"
            style={{
              color: "var(--heatmap-text)",
              backdropFilter: "blur(8px) saturate(180%)",
              WebkitBackdropFilter: "blur(8px) saturate(180%)",
            }}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Heatmap name"
            required
            autoFocus
          />
          <label className="flex items-center gap-3">
            <span className="text-[var(--heatmap-text)] font-medium">Color:</span>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-9 h-9 border-none rounded-full glass-border shadow cursor-pointer transition"
              style={{
                background: "var(--glass-bg)",
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
              }}
            />
          </label>
          <button
            type="submit"
            className="px-4 py-2 rounded-full text-white font-semibold shadow glass-border transition hover:brightness-110"
            style={{
              background: color,
              borderColor: color,
              color: "var(--heatmap-text)",
            }}
          >
            Create
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Helper for darkening a color ---
function getTintedBg(hex: string) {
  // Returns a darkened, semi-transparent version of the color
  const { h, s } = hexToHSL(hex);
  return `hsl(${h},${s}%,18%,0.85)`; // dark, semi-transparent
}

// --- Edit Heatmap Modal ---
function EditHeatmapModal({
  open,
  onClose,
  heatmap,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  heatmap: { type: string; color: string; tintedBg?: boolean };
  onSave: (newType: string, newColor: string, tintedBg: boolean) => void;
}) {
  const [name, setName] = useState(heatmap.type);
  const [color, setColor] = useState(heatmap.color);
  const [tintedBg, setTintedBg] = useState(!!heatmap.tintedBg);

  useEffect(() => {
    setName(heatmap.type);
    setColor(heatmap.color);
    setTintedBg(!!heatmap.tintedBg);
  }, [heatmap]);

  return open ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="bg-[var(--glass-bg)] rounded-2xl shadow-2xl border border-[var(--border)] p-8 w-full max-w-sm relative animate-scale-in glass-border"
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
          onClick={onClose}
          aria-label="Close"
        >×</button>
        <div className="text-lg font-bold mb-4"
          style={{
            color: tintedBg
              ? "var(--tinted-heatmap-text)"
              : "var(--heatmap-text)",
          }}
        >
          Edit heatmap
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (name.trim()) {
              onSave(name.trim(), color, tintedBg);
              onClose();
            }
          }}
        >
          <input
            className="w-full p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--border)] shadow glass-border focus:ring-2 focus:ring-[var(--accent)] transition placeholder:text-gray-400/80"
            style={{
              color: "var(--heatmap-text)",
              backdropFilter: "blur(8px) saturate(180%)",
              WebkitBackdropFilter: "blur(8px) saturate(180%)",
            }}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Heatmap name"
            required
            autoFocus
          />
          <label className="flex items-center gap-3">
            <span className="text-[var(--heatmap-text)] font-medium">Color:</span>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-9 h-9 border-none rounded-full glass-border shadow cursor-pointer transition"
              style={{
                background: "var(--glass-bg)",
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
              }}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[var(--heatmap-text)] font-medium">Tinted background</span>
            <span
              className="ios-checkbox"
              style={{
                // Use the heatmap color for the checkbox theme
                ["--checkbox-color" as any]: color,
                ["--checkbox-bg" as any]: `${color}22`, // transparent version for bg
                ["--checkbox-border" as any]: color,
                display: "inline-block",
              }}
            >
              <input
                type="checkbox"
                checked={tintedBg}
                onChange={e => setTintedBg(e.target.checked)}
                tabIndex={0}
              />
              <span className="checkbox-wrapper">
                <span className="checkbox-bg"></span>
                <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                  <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="3"
                    stroke="currentColor"
                    d="M4 12L10 18L20 6"
                    className="check-path"
                  ></path>
                </svg>
              </span>
            </span>
          </label>
          <button
            type="submit"
            className="px-4 py-2 rounded-full text-white font-semibold shadow glass-border transition hover:brightness-110"
            style={{
              background: color,
              borderColor: color,
              color: "var(--heatmap-text)",
            }}
          >
            Save
          </button>
        </form>
      </div>
    </div>
  ) : null;
}

// --- Main Heatmap Component ---
export default function Heatmap() {
  const [userId, setUserId] = useState<number | null>(null);
  const [heatmaps, setHeatmaps] = useState<{ type: string; color: string; tintedBg?: boolean }[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHeatmap, setSelectedHeatmap] = useState("default");
  const [activity, setActivity] = useState<Record<string, Record<string, { count: number; color: string | null; times: string[] }>>>({});
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingHeatmap, setEditingHeatmap] = useState<{ type: string; color: string; tintedBg?: boolean } | null>(null);

  // Get userId from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    setUserId(payload.sub);
  }, []);

  // Fetch user heatmaps
  useEffect(() => {
    if (!userId) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/activity/user-heatmaps?userId=${userId}`
    )
      .then(res => res.json())
      .then(data => {
        let maps = data;
        // Always include the default heatmap if not present
        if (!maps || !maps.length) {
          maps = [{ type: "default", color: "#39d353" }];
        } else if (!maps.some((h: any) => h.type === "default")) {
          maps = [{ type: "default", color: "#39d353" }, ...maps];
        }
        setHeatmaps(maps);
        setSelectedHeatmap(maps[0]?.type || "default");
      });
  }, [userId]);

  // Fetch all activities function
  const fetchAllActivities = async (userId: number, heatmaps: { type: string; color: string }[]) => {
    setLoading(true);
    const results = await Promise.all(
      heatmaps.map(h =>
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/activity/heatmap?userId=${userId}&type=${h.type}`
        )
          .then(res => res.json())
          .then(data => ({
            type: h.type,
            color: h.color,
            data: data.reduce((acc: any, row: any) => {
              acc[row.date] = {
                count: Number(row.count),
                color: row.color || h.color,
                times: row.times ? row.times : [],
              };
              return acc;
            }, {}),
          }))
      ));
    const map: Record<string, Record<string, { count: number, color: string | null, times: string[] }>> = {};
    results.forEach(r => {
      map[r.type] = r.data;
    });
    setActivity(map);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchAllActivities(userId, heatmaps);
  }, [userId, heatmaps]);

  // Log activity for selected heatmap (with timestamp)
  const logActivity = async (type: string) => {
    if (!userId) return;
    const heatmap = heatmaps.find(h => h.type === selectedHeatmap) || { color: "#39d353" };
    const todayLocal = getDateString(new Date());
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/activity/log`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type,
          color: heatmap?.color || "#39d353",
          date: todayLocal, // send local date
          timestamp: getTimeString(new Date()),
        }),
      }
    );
    // Refetch activity immediately after logging
    fetchAllActivities(userId, heatmaps);
  };

  // Handle custom heatmap creation
  const handleCreateCustomHeatmap = (name: string, color: string) => {
    if (heatmaps.some(h => h.type === name)) return;
    setHeatmaps([...heatmaps, { type: name, color }]);
    setSelectedHeatmap(name);
  };

  // Edit handler
  const handleEditHeatmap = async (type: string, color: string, tintedBg: boolean) => {
    if (!userId || !editingHeatmap) return;

    // Persist to backend
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/activity/user-heatmaps`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          oldType: editingHeatmap.type,
          newType: type,
          color,
          tintedBg,
        }),
      }
    );

    // Refetch heatmaps from backend
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/activity/user-heatmaps?userId=${userId}`
    )
      .then(res => res.json())
      .then(data => {
        setHeatmaps(data);
        setSelectedHeatmap(type);
      });
  };

  // Find max count for color scaling per heatmap
  const getMaxCount = (type: string) =>
    Math.max(1, ...Object.values(activity[type] || {}).map(a => a.count));

  // Dates for grid (now aligned to Monday, vertical fill)
  const gridDates = getHeatmapDatesGrid();

  // --- RENDER ---
  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--heatmap-text)" }}>Activity heatmaps</h2>
      {/* View toggle and create button */}
      <div className="flex gap-4 items-center mb-2">
        <button
          className="px-4 py-2 rounded-full font-semibold glass-border shadow transition hover:brightness-110"
          style={{
            background: "var(--glass-bg)",
            color: "var(--heatmap-text)",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
            backdropFilter: "blur(8px) saturate(180%)",
            WebkitBackdropFilter: "blur(8px) saturate(180%)",
          }}
          onClick={() => setShowCreateModal(true)}
        >
          Create heatmap
        </button>
      </div>
      {/* GRID VIEW ONLY */}
      <div
        className="grid-container flex flex-wrap gap-8 justify-center"
        style={{ width: "100%" }}
      >
        {heatmaps.map(h => (
          <div
            key={h.type}
            className="grid-card bg-[var(--panel)] rounded-2xl p-4 shadow-lg glass-border"
            style={{
              minWidth: 220,
              background: h.tintedBg
                ? getTintedBg(h.color)
                : "var(--glass-bg)",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
              backdropFilter: "blur(8px) saturate(180%)",
              WebkitBackdropFilter: "blur(8px) saturate(180%)",
              transition: "background 0.2s",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="habit-title font-bold flex items-center gap-2"
                style={{
                  color: h.tintedBg
                    ? "var(--tinted-heatmap-text)"
                    : "var(--heatmap-text)",
                }}
              >
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition"
                  title="Eliminar heatmap"
                  onClick={async () => {
                    if (window.confirm(`¿Eliminar heatmap "${h.type}"?`)) {
                      // Call backend to delete all logs for this heatmap
                      await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/activity/user-heatmaps`,
                        {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            userId,
                            type: h.type,
                          }),
                        }
                      );
                      // Refetch heatmaps from backend
                      fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777/api"}/activity/user-heatmaps?userId=${userId}`
                      )
                        .then(res => res.json())
                        .then(data => {
                          setHeatmaps(data);
                          if (selectedHeatmap === h.type && data.length > 0) {
                            setSelectedHeatmap(data[0].type);
                          }
                        });
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                  </svg>
                </button>
                {h.type === "create_note" ? "Created Notes" : h.type}
                {/* Edit button */}
                <button
                  type="button"
                  className="ml-2 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center justify-center"
                  title="Editar heatmap"
                  onClick={() => {
                    setEditingHeatmap(h);
                    setEditModalOpen(true);
                  }}
                  style={{
                    color: h.tintedBg
                      ? "var(--tinted-heatmap-text)"
                      : "var(--heatmap-text)",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                    <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                  </svg>
                </button>
              </span>
              <button
                className="ml-2 flex items-center justify-center rounded-full font-bold shadow glass-border transition hover:brightness-110 log-activity-btn"
                title="Añadir actividad hoy"
                onClick={() => logActivity(h.type)}
                style={{
                  background: "var(--glass-bg)",
                  color: "var(--heatmap-text)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
                  backdropFilter: "blur(8px) saturate(180%)",
                  WebkitBackdropFilter: "blur(8px) saturate(180%)",
                  width: 28,
                  height: 28,
                  minWidth: 28,
                  minHeight: 28,
                  padding: 0,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Animated icon transition */}
                <span className="log-activity-icon-wrapper">
                  {(() => {
                    const todayStr = getDateString(new Date());
                    const todayData = activity[h.type]?.[todayStr];
                    const isFirstLog = !todayData || !todayData.count;
                    return (
                      <>
                        <span
                          className={`log-activity-icon log-activity-square ${isFirstLog ? "log-activity-in" : "log-activity-out"}`}
                          aria-hidden={!isFirstLog}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span
                          className={`log-activity-icon log-activity-plus ${!isFirstLog ? "log-activity-in" : "log-activity-out"}`}
                          aria-hidden={isFirstLog}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                          </svg>
                        </span>
                      </>
                    );
                  })()}
                </span>
              </button>
            </div>
            {/* Day labels and grid */}
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", flexDirection: "column", marginRight: 4 }}>
                {DAY_LABELS_MONDAY_FIRST.map((label, i) => (
                  <div
                    key={label}
                    style={{
                      height: 16,
                      fontSize: 10,
                      color: "var(--heatmap-text)",
                      display: "flex",
                      alignItems: "center",
                      marginTop: 1.7,
                      marginBottom: 1.7,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div
                className="grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${GRID_COLS}, 16px)`,
                  gridTemplateRows: `repeat(${DAYS}, 16px)`,
                  gap: 4,
                }}
              >
                {gridDates.map((date, idx) => {
                  const dateStr = getDateString(date);
                  const data = activity[h.type]?.[dateStr];
                  let color = "#e5e7eb";
                  if (data && data.count > 0) {
                    color = getIntensityColor(h.color, data.count);
                  }
                  const col = Math.floor(idx / DAYS);
                  const row = idx % DAYS;
                  return (
                    <div
                      key={idx}
                      title={`${DAY_LABELS_MONDAY_FIRST[row]} ${dateStr}: ${data?.count || 0} actividad`}
                      style={{
                        gridColumn: col + 1,
                        gridRow: row + 1,
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: color,
                        border: "1px solid #ccc",
                        transition: "background 0.2s",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      {loading && <div className="text-gray-400">Loading...</div>}
      {showCreateModal && (
        <CreateHeatmapModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCustomHeatmap}
        />
      )}
      {editModalOpen && editingHeatmap && (
        <EditHeatmapModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          heatmap={editingHeatmap}
          onSave={handleEditHeatmap}
        />
      )}
      <style jsx global>{`
        .animate-scale-in {
          animation: scale-in 0.2s both;
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95);}
          to { opacity: 1; transform: scale(1);}
        }
        .ios-checkbox {
          --checkbox-size: 28px;
          --checkbox-color: #3b82f6;
          --checkbox-bg: #dbeafe;
          --checkbox-border: #93c5fd;
          position: relative;
          display: inline-block;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .ios-checkbox input {
          display: none;
        }
        .checkbox-wrapper {
          position: relative;
          width: var(--checkbox-size);
          height: var(--checkbox-size);
          border-radius: 8px;
          transition: transform 0.2s ease;
          display: inline-block;
        }
        .checkbox-bg {
          position: absolute;
          inset: 0;
          border-radius: 8px;
          border: 2px solid var(--checkbox-border);
          background: white;
          transition: all 0.2s ease;
        }
        .checkbox-icon {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 80%;
          height: 80%;
          color: white;
          transform: scale(0);
          transition: all 0.2s ease;
          pointer-events: none;
        }
        .ios-checkbox:hover .checkbox-wrapper {
          transform: scale(1.05);
        }
        .ios-checkbox:active .checkbox-wrapper {
          transform: scale(0.95);
        }
        .ios-checkbox input:focus + .checkbox-wrapper .checkbox-bg {
          box-shadow: 0 0 0 4px var(--checkbox-bg);
        }
        /* Animation */
        @keyframes bounce {
          0%, 100% { transform: scale(1);}
          50% { transform: scale(1.1);}
        }
        .ios-checkbox input:checked + .checkbox-wrapper {
          animation: bounce 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .check-path {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          transition: stroke-dashoffset 0.3s ease 0.1s;
        }
        .ios-checkbox input:checked + .checkbox-wrapper .checkbox-bg {
          background: var(--checkbox-color);
          border-color: var(--checkbox-color);
        }
        .ios-checkbox input:checked + .checkbox-wrapper .checkbox-icon {
          transform: scale(1);
        }
        .ios-checkbox input:checked + .checkbox-wrapper .check-path {
          stroke-dashoffset: 0;
        }
        .log-activity-btn {
          transition: box-shadow 0.18s, background 0.18s, border 0.18s;
        }
        .log-activity-icon-wrapper {
          position: relative;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .log-activity-icon {
          position: absolute;
          left: 0; top: 0;
          width: 18px;
          height: 18px;
          opacity: 0;
          transform: scale(0.7) rotate(-20deg);
          transition:
            opacity 0.28s cubic-bezier(.4,2,.6,1),
            transform 0.28s cubic-bezier(.4,2,.6,1);
          will-change: opacity, transform;
          pointer-events: none;
        }
        .log-activity-in {
          opacity: 1;
          transform: scale(1) rotate(0deg);
          z-index: 2;
        }
        .log-activity-out {
          opacity: 0;
          transform: scale(0.7) rotate(20deg);
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
"use client";
import React, { useEffect, useState } from "react";

// --- Constants ---
const DAYS = 7;
const GRID_COLS = 10; // Shorter grid
const LIST_COLS = 40; // Longer list
const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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
function getHeatmapDatesGrid() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  for (let i = GRID_COLS * DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }
  return dates;
}
function getHeatmapDatesList() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  for (let i = LIST_COLS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }
  return dates;
}

// --- Color helpers ---
function hexToHSL(hex: string) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-[var(--panel)] rounded-2xl shadow-2xl border border-[var(--border)] p-8 w-full max-w-sm relative animate-scale-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl"
          onClick={onClose}
          aria-label="Cerrar"
        >×</button>
        <div className="text-lg font-bold mb-4">Crear nuevo heatmap</div>
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
            className="w-full p-3 rounded-lg bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del heatmap"
            required
            autoFocus
          />
          <label className="flex items-center gap-3">
            <span>Color:</span>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-8 h-8 border-none bg-transparent cursor-pointer"
              style={{ padding: 0, background: "none" }}
            />
          </label>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-green-600 text-white font-semibold"
          >
            Crear
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main Heatmap Component ---
export default function Heatmap() {
  const [userId, setUserId] = useState<number | null>(null);
  const [heatmaps, setHeatmaps] = useState<{ type: string; color: string }[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHeatmap, setSelectedHeatmap] = useState("default");
  const [activity, setActivity] = useState<Record<string, Record<string, { count: number; color: string | null; times: string[] }>>>({});
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

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
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/activity/user-heatmaps?userId=${userId}`
    )
      .then(res => res.json())
      .then(data => {
        // Always include the default heatmap if not present
        let maps = data;
        if (!maps.some((h: any) => h.type === "default")) {
          maps = [{ type: "default", color: "#39d353" }, ...maps];
        }
        setHeatmaps(maps);
        setSelectedHeatmap(maps[0]?.type || "default");
      });
  }, [userId]);

  // Fetch all activities function (fixed parenthesis)
  const fetchAllActivities = async (userId: number, heatmaps: { type: string; color: string }[]) => {
    setLoading(true);
    const results = await Promise.all(
      heatmaps.map(h =>
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/activity/heatmap?userId=${userId}&type=${h.type}`
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
      )
    ); // <-- CLOSES Promise.all HERE!
    const map: Record<string, Record<string, { count: number, color: string | null, times: string[] }>> = {};
    results.forEach(r => {
      map[r.type] = r.data;
    });
    setActivity(map);
    setLoading(false);
  };

  // useEffect now just calls the function
  useEffect(() => {
    if (!userId) return;
    fetchAllActivities(userId, heatmaps);
  }, [userId, heatmaps]);

  // Log activity for selected heatmap (with timestamp)
  const logActivity = async (type: string) => {
    if (!userId) return;
    const heatmap = heatmaps.find(h => h.type === type);
    const todayLocal = getDateString(new Date());
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/activity/log`,
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

  // Find max count for color scaling per heatmap
  const getMaxCount = (type: string) =>
    Math.max(1, ...Object.values(activity[type] || {}).map(a => a.count));

  // Dates for grid and list
  const gridDates = getHeatmapDatesGrid();
  const listDates = getHeatmapDatesList();

  // --- RENDER ---
  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold mb-2">Heatmaps de actividad</h2>
      {/* View toggle */}
      <div className="flex gap-4 items-center mb-2">
        <button
          className={`px-4 py-2 rounded font-semibold ${view === "grid" ? "bg-[var(--accent)] text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
          onClick={() => setView("grid")}
        >
          Grid View
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${view === "list" ? "bg-[var(--accent)] text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
          onClick={() => setView("list")}
        >
          List View
        </button>
        <button
          className="ml-4 px-4 py-2 rounded bg-green-600 text-white font-semibold"
          onClick={() => setShowCreateModal(true)}
        >
          Añadir heatmap
        </button>
      </div>
      {/* GRID VIEW */}
      {view === "grid" && (
        <div className="grid-container flex flex-wrap gap-8">
          {heatmaps.map(h => (
            <div key={h.type} className="grid-card bg-[var(--panel)] rounded-2xl p-4 shadow-lg" style={{ minWidth: 220 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="habit-title font-bold">{h.type}</span>
                <button
                  className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-sm font-bold"
                  title="Añadir actividad hoy"
                  onClick={() => logActivity(h.type)}
                >+</button>
              </div>
              {/* Days of week */}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 16px)`, marginBottom: 4 }}>
                {Array.from({ length: GRID_COLS }).map((_, colIdx) => (
                  <div key={colIdx} style={{ gridColumn: colIdx + 1, gridRow: 1, textAlign: "center", fontSize: 10, color: "#888" }}>
                    {colIdx === 0 ? "" : ""}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex" }}>
                {/* Day labels */}
                <div style={{ display: "flex", flexDirection: "column", marginRight: 4 }}>
                  {DAY_LABELS.map((label, i) => (
                    <div key={label} style={{ height: 16, fontSize: 10, color: "#888", display: "flex", alignItems: "center" }}>{label}</div>
                  ))}
                </div>
                {/* Heatmap grid */}
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
                    return (
                      <div
                        key={idx}
                        title={`${DAY_LABELS[date.getDay()]} ${dateStr}: ${data?.count || 0} actividad`}
                        style={{
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
      )}
      {/* LIST VIEW */}
      {view === "list" && (
        <div className="list-container w-full flex flex-col gap-8">
          {heatmaps.map(h => (
            <div key={h.type} className="list-card bg-[var(--panel)] rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="list-label font-bold">{h.type}</span>
                <button
                  className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-sm font-bold"
                  title="Añadir actividad hoy"
                  onClick={() => logActivity(h.type)}
                >+</button>
              </div>
              {/* Days of week */}
              <div style={{ display: "flex", marginBottom: 4 }}>
                {DAY_LABELS.map((label, i) => (
                  <div key={label} style={{ width: 32, fontSize: 12, color: "#888", textAlign: "center" }}>{label}</div>
                ))}
              </div>
              <div
                className="list-heatmap"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${LIST_COLS}, 18px)`,
                  gap: 6,
                  padding: "0.5rem",
                  backgroundColor: "#222",
                  borderRadius: 20,
                  minHeight: 32, // Make the bar taller
                  alignItems: "center",
                }}
              >
                {listDates.map((date, idx) => {
                  const dateStr = getDateString(date);
                  const data = activity[h.type]?.[dateStr];
                  let color = "#e5e7eb";
                  if (data && data.count > 0) {
                    color = getIntensityColor(h.color, data.count);
                  }
                  return (
                    <div
                      key={idx}
                      title={`${DAY_LABELS[date.getDay()]} ${dateStr}: ${data?.count || 0} actividad`}
                      style={{
                        width: 18,
                        height: 32, // Make the bar taller
                        borderRadius: 6,
                        background: color,
                        border: "1px solid #333",
                        transition: "background 0.2s",
                        margin: "0 auto",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && <div className="text-gray-400">Cargando...</div>}
      {showCreateModal && (
        <CreateHeatmapModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCustomHeatmap}
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
      `}</style>
    </div>
  );
}
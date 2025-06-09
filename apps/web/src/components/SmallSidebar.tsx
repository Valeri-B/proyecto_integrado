import React from "react";

type Props = {
  collapsed: boolean;
  onCollapse: () => void;
  onSelect: (view: "notes" | "folders" | "heatmap" | "admin") => void;
  activeView: "notes" | "folders" | "heatmap" | "admin";
  isAdmin?: boolean;
};

export default function SmallSidebar({ collapsed, onCollapse, onSelect, activeView, isAdmin }: Props) {
  return (
    <nav className={`flex flex-col items-center bg-gray-900 text-white py-4 transition-all duration-300 ${collapsed ? "w-12" : "w-20"}`}>
      {/* Collapse/Expand Icon */}
      <button
        className="mb-6 p-2 hover:bg-gray-800 rounded transition"
        onClick={onCollapse}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <img
          src="/icons_svg/menu_left_right_TO_BE_ANIMATED.svg"
          alt="Collapse/Expand"
          className="w-7 h-7"
        />
      </button>
      {/* Notes Icon */}
      <button
        className={`mb-6 p-2 rounded ${activeView === "notes" ? "bg-red-600" : "hover:bg-gray-800"}`}
        onClick={() => onSelect("notes")}
        title="Notas sueltas"
      >
        <img
          src="/icons_svg/note_icon_fill_when_clicked.svg"
          alt="Notas"
          className="w-7 h-7"
        />
      </button>
      {/* Folders Icon */}
      <button
        className={`mb-6 p-2 rounded ${activeView === "folders" ? "bg-red-600" : "hover:bg-gray-800"}`}
        onClick={() => onSelect("folders")}
        title="Carpetas"
      >
        <img
          src="/icons_svg/tasklist.svg"
          alt="Carpetas"
          className="w-7 h-7"
        />
      </button>
      {/* Heatmap Icon */}
      <button
        className={`p-2 rounded ${activeView === "heatmap" ? "bg-red-600" : "hover:bg-gray-800"}`}
        onClick={() => onSelect("heatmap")}
        title="Heatmap"
      >
        <img
          src="/icons_svg/dark_heatmap_colored.svg"
          alt="Heatmap"
          className="w-7 h-7"
        />
      </button>
      {/* Admin Icon */}
      {isAdmin && (
        <button
          className={`mt-6 p-2 rounded ${activeView === "admin" ? "bg-red-600" : "hover:bg-gray-800"}`}
          onClick={() => onSelect("admin")}
          title="Admin"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
            <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
          </svg>
        </button>
      )}
    </nav>
  );
}
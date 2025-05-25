import React from "react";

type Props = {
  collapsed: boolean;
  onCollapse: () => void;
  onSelect: (view: "notes" | "folders" | "heatmap") => void;
  activeView: "notes" | "folders" | "heatmap";
};

export default function SmallSidebar({ collapsed, onCollapse, onSelect, activeView }: Props) {
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
    </nav>
  );
}
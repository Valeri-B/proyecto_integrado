import React, { useEffect, useState } from "react";

type Props = {
  collapsed: boolean;
  onCollapse: () => void;
  onSelect: (view: "notes" | "folders" | "heatmap" | "admin") => void;
  activeView: "notes" | "folders" | "heatmap" | "admin";
  isAdmin?: boolean;
};

export default function SmallSidebar({ collapsed, onCollapse, onSelect, activeView, isAdmin }: Props) {
  function handleSidebarBtnHover(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    (e.currentTarget as HTMLButtonElement).style.background = "rgba(245, 61, 79, 0.13)";
    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px 0 rgba(31,38,135,0.10)";
    (e.currentTarget as HTMLButtonElement).style.border = "1px solid var(--accent)";
  }
  function handleSidebarBtnLeave(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
    (e.currentTarget as HTMLButtonElement).style.border = "1px solid transparent";
  }

  // Detect theme for heatmap icon
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    function check() {
      const theme = document.documentElement.getAttribute("data-theme");
      if (theme === "dark") setIsDark(true);
      else if (theme === "light") setIsDark(false);
      else setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    check();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", check);
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", check);
      observer.disconnect();
    };
  }, []);

  return (
    <nav
      className={`
        flex flex-col h-full
        border-r border-[var(--border)]
        shadow-lg
        transition-all duration-300
        backdrop-blur-lg
        backdrop-saturate-200
        glass-border
        ${collapsed ? "w-12" : "w-20"}
        bg-clip-padding
      `}
      style={{
        height: "100%",
        minHeight: 0,
        minWidth: collapsed ? 48 : 80,
        background: "var(--glass-bg)",
        backdropFilter: "blur(1.5px)",
        WebkitBackdropFilter: "blur(1.5px)",
        borderRadius: 0,
        borderRight: "1px solid var(--border)",
        overflow: "hidden",
        paddingTop: 16,
        paddingBottom: 16,
      }}
    >
      {/* Collapse/Expand Icon */}
      <button
        className="mb-6 p-2 rounded-xl transition border border-transparent"
        onClick={onCollapse}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          background: "transparent",
          transition: "border 0.18s, background 0.18s, box-shadow 0.18s",
        }}
        onMouseEnter={handleSidebarBtnHover}
        onMouseLeave={handleSidebarBtnLeave}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`size-7 transition-transform duration-300 ${collapsed ? "rotate-90" : ""}`}
          style={{ display: "block" }}
        >
          <path
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {/* Notes Icon */}
      <button
        className={`mb-6 p-2 rounded-xl transition border border-transparent ${
          activeView === "notes"
            ? "bg-[var(--glass-bg)] border-[var(--border)] shadow-lg backdrop-blur-lg backdrop-saturate-200"
            : ""
        }`}
        onClick={() => onSelect("notes")}
        title="Notes without folder"
        style={{
          background: activeView === "notes" ? "var(--glass-bg)" : "transparent",
          boxShadow: activeView === "notes" ? "0 4px 32px 0 rgba(0,0,0,0.08)" : undefined,
          border: activeView === "notes" ? "1px solid var(--border)" : "1px solid transparent",
          backdropFilter: activeView === "notes" ? "blur(8px) saturate(180%)" : undefined,
          WebkitBackdropFilter: activeView === "notes" ? "blur(8px) saturate(180%)" : undefined,
          transition: "border 0.18s, background 0.18s, box-shadow 0.18s",
        }}
        onMouseEnter={activeView !== "notes" ? handleSidebarBtnHover : undefined}
        onMouseLeave={activeView !== "notes" ? handleSidebarBtnLeave : undefined}
      >
        <svg
          width="1.75em"
          height="1.75em"
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7"
          fill="currentColor"
          style={{ color: "var(--note-icon-smallSidebar)" }}
        >
          <rect x="192" y="192" width="640" height="640" rx="120" ry="120" />
        </svg>
      </button>
      {/* Folders Icon */}
      <button
        className={`mb-6 p-2 rounded-xl transition border border-transparent ${
          activeView === "folders"
            ? "bg-[var(--glass-bg)] border-[var(--border)] shadow-lg backdrop-blur-lg backdrop-saturate-200"
            : ""
        }`}
        onClick={() => onSelect("folders")}
        title="Carpetas"
        style={{
          background: activeView === "folders" ? "var(--glass-bg)" : "transparent",
          boxShadow: activeView === "folders" ? "0 4px 32px 0 rgba(0,0,0,0.08)" : undefined,
          border: activeView === "folders" ? "1px solid var(--border)" : "1px solid transparent",
          backdropFilter: activeView === "folders" ? "blur(8px) saturate(180%)" : undefined,
          WebkitBackdropFilter: activeView === "folders" ? "blur(8px) saturate(180%)" : undefined,
          transition: "border 0.18s, background 0.18s, box-shadow 0.18s",
        }}
        onMouseEnter={activeView !== "folders" ? handleSidebarBtnHover : undefined}
        onMouseLeave={activeView !== "folders" ? handleSidebarBtnLeave : undefined}
      >
        <svg
          fill="currentColor"
          width="1.75em"
          height="1.75em"
          viewBox="-2 -2 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7"
          style={{ display: "block", color: "var(--tasks-icon-smallSidebar)" }}
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6 0h8a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6zm6 9a1 1 0 0 0 0 2h3a1 1 0 1 0 0-2h-3zm-2 4a1 1 0 0 0 0 2h5a1 1 0 1 0 0-2h-5zm0-8a1 1 0 1 0 0 2h5a1 1 0 0 0 0-2h-5zm-4.172 5.243l-.707-.707a1 1 0 1 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.415 0l2.828-2.828A1 1 0 0 0 7.95 8.12l-2.122 2.122z" />
        </svg>
      </button>
      {/* Heatmap Icon */}
      <button
        className={`p-2 rounded-xl transition border border-transparent ${
          activeView === "heatmap"
            ? "bg-[var(--glass-bg)] border-[var(--border)] shadow-lg backdrop-blur-lg backdrop-saturate-200"
            : ""
        }`}
        onClick={() => onSelect("heatmap")}
        title="Heatmap"
        style={{
          background: activeView === "heatmap" ? "var(--glass-bg)" : "transparent",
          boxShadow: activeView === "heatmap" ? "0 4px 32px 0 rgba(0,0,0,0.08)" : undefined,
          border: activeView === "heatmap" ? "1px solid var(--border)" : "1px solid transparent",
          backdropFilter: activeView === "heatmap" ? "blur(8px) saturate(180%)" : undefined,
          WebkitBackdropFilter: activeView === "heatmap" ? "blur(8px) saturate(180%)" : undefined,
          transition: "border 0.18s, background 0.18s, box-shadow 0.18s",
        }}
        onMouseEnter={activeView !== "heatmap" ? handleSidebarBtnHover : undefined}
        onMouseLeave={activeView !== "heatmap" ? handleSidebarBtnLeave : undefined}
      >
        <img
          src={isDark ? "/icons_svg/heatmap_light.svg" : "/icons_svg/heatmap_dark.svg"}
          alt="Heatmap"
          className="w-7 h-7"
          draggable={false}
        />
      </button>
      {/* Admin Icon */}
      {isAdmin && (
        <button
          className={`mt-6 p-2 rounded-xl transition border border-transparent ${
            activeView === "admin"
              ? "bg-[var(--glass-bg)] border-[var(--border)] shadow-lg backdrop-blur-lg backdrop-saturate-200"
              : ""
          }`}
          onClick={() => onSelect("admin")}
          title="Admin"
          style={{
            background: activeView === "admin" ? "var(--glass-bg)" : "transparent",
            boxShadow: activeView === "admin" ? "0 4px 32px 0 rgba(0,0,0,0.08)" : undefined,
            border: activeView === "admin" ? "1px solid var(--border)" : "1px solid transparent",
            backdropFilter: activeView === "admin" ? "blur(8px) saturate(180%)" : undefined,
            WebkitBackdropFilter: activeView === "admin" ? "blur(8px) saturate(180%)" : undefined,
            transition: "border 0.18s, background 0.18s, box-shadow 0.18s",
          }}
          onMouseEnter={activeView !== "admin" ? handleSidebarBtnHover : undefined}
          onMouseLeave={activeView !== "admin" ? handleSidebarBtnLeave : undefined}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7"
            style={{ color: "var(--admin-icon-smallSidebar)" }}
          >
            <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
            <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
          </svg>
        </button>
      )}
    </nav>
  );
}
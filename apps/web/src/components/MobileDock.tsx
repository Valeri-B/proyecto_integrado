import React, { useEffect, useRef, useState } from "react";

type Props = {
    userRole: string;
    setActiveView: (view: "notes" | "folders" | "heatmap" | "admin") => void;
    setShowGlobalSearch: (b: boolean) => void;
    setFabMode: (mode: "note" | "folder" | null) => void;
    setShowFabModal: (b: boolean) => void;
    setShowLeftSidebar: (b: boolean) => void;
    setShowRightSidebar: (b: boolean) => void;
};

export default function MobileDock({
    userRole,
    setActiveView,
    setShowGlobalSearch,
    setFabMode,
    setShowFabModal,
    setShowLeftSidebar,
    setShowRightSidebar,
}: Props) {
    const [showDock, setShowDock] = useState(true);
    const lastScroll = useRef(0);
    const [showPlusModal, setShowPlusModal] = useState(false);

    useEffect(() => {
        function onScroll() {
            const curr = window.scrollY;
            if (curr > lastScroll.current && curr > 40) setShowDock(false); // scroll down
            else setShowDock(true); // scroll up
            lastScroll.current = curr;
        }
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

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

    // Plus modal logic
    const handlePlusClick = () => setShowPlusModal(true);
    const handleClosePlusModal = () => setShowPlusModal(false);
    const handleNoteClick = () => {
        setFabMode("note");
        setShowFabModal(true);
        setShowPlusModal(false);
    };
    const handleFolderClick = () => {
        setFabMode("folder");
        setShowFabModal(true);
        setShowPlusModal(false);
    };

    return (
        <>
            {/* Plus Modal */}
            {showPlusModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
                    onClick={handleClosePlusModal}
                >
                    <div
                        className="w-full max-w-xs mx-auto mb-24 bg-[var(--glass-bg)] rounded-3xl shadow-2xl p-6 flex flex-col gap-4 animate-scale-in glass-border"
                        style={{
                            backdropFilter: "blur(16px) saturate(200%)",
                            WebkitBackdropFilter: "blur(16px) saturate(200%)",
                            border: "1px solid var(--border)",
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold text-lg shadow"
                            onClick={handleNoteClick}
                        >
                            New Note
                        </button>
                        <button
                            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg shadow"
                            onClick={handleFolderClick}
                        >
                            New Folder
                        </button>
                        <button
                            className="w-full py-3 rounded-xl bg-gray-700 text-white font-semibold text-lg shadow"
                            onClick={handleClosePlusModal}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Responsive Dock */}
            <div
                className={`fixed left-1/2 bottom-4 z-50 -translate-x-1/2 transition-all duration-300 ${showDock ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                style={{
                    background: "var(--glass-bg)",
                    borderRadius: "2rem",
                    boxShadow: "0 4px 32px 0 rgba(0,0,0,0.12)",
                    padding: "0.5rem 1.5rem",
                    backdropFilter: "blur(12px) saturate(180%)",
                    WebkitBackdropFilter: "blur(12px) saturate(180%)",
                }}
            >
                <div className="mobile-dock-grid">
                    {/* Folders Sidebar Button (left) */}
                    <button
                        className="bg-[var(--panel)] rounded-xl p-2 flex items-center justify-center"
                        onClick={() => setShowLeftSidebar(true)}
                        aria-label="Open folders sidebar"
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M11 5V19M6 8H8M6 11H8M6 14H8M6.2 19H17.8C18.9201 19 19.4802 19 19.908 18.782C20.2843 18.5903 20.5903 18.2843 20.782 17.908C21 17.4802 21 16.9201 21 15.8V8.2C21 7.0799 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V15.8C3 16.9201 3 17.4802 3.21799 17.908C3.40973 18.2843 3.71569 18.5903 4.09202 18.782C4.51984 19 5.07989 19 6.2 19Z"
                                stroke="#000000"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    {/* Notes */}
                    <button
                        className="bg-[var(--panel)] rounded-xl p-2 flex items-center justify-center"
                        onClick={() => setActiveView("notes")}
                        aria-label="Notes"
                    >
                        <svg width="28" height="28" viewBox="0 0 1024 1024" fill="currentColor">
                            <rect x="192" y="192" width="640" height="640" rx="120" ry="120" />
                        </svg>
                    </button>
                    {/* Tasks */}
                    <button
                        className="bg-[var(--panel)] rounded-xl p-2 flex items-center justify-center"
                        onClick={() => setActiveView("folders")}
                        aria-label="Tasks"
                    >
                        <svg fill="currentColor" width="28" height="28" viewBox="-2 -2 24 24">
                            <path d="M6 0h8a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6zm6 9a1 1 0 0 0 0 2h3a1 1 0 1 0 0-2h-3zm-2 4a1 1 0 0 0 0 2h5a1 1 0 1 0 0-2h-5zm0-8a1 1 0 1 0 0 2h5a1 1 0 0 0 0-2h-5zm-4.172 5.243l-.707-.707a1 1 0 1 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.415 0l2.828-2.828A1 1 0 0 0 7.95 8.12l-2.122 2.122z" />
                        </svg>
                    </button>
                    {/* Heatmap */}
                    <button
                        className="bg-[var(--panel)] rounded-xl p-2 flex items-center justify-center"
                        onClick={() => setActiveView("heatmap")}
                        aria-label="Heatmap"
                    >
                        {isDark ? (
                            <svg viewBox="0 0 100 100" width={28} height={28} xmlns="http://www.w3.org/2000/svg">
                                <rect width="100" height="100" rx="20" fill="#F0F0F0" />
                                <g>
                                    <rect x="12" y="12" width="12" height="12" rx="2" fill="#C8C8CC" />
                                    <rect x="28" y="12" width="12" height="12" rx="2" fill="#C4C4C8" />
                                    <rect x="44" y="12" width="12" height="12" rx="2" fill="#C0C0C4" />
                                    <rect x="60" y="12" width="12" height="12" rx="2" fill="#BCBCC0" />
                                    <rect x="76" y="12" width="12" height="12" rx="2" fill="#B8B8BC" />
                                    <rect x="12" y="28" width="12" height="12" rx="2" fill="#C4C4C8" />
                                    <rect x="28" y="28" width="12" height="12" rx="2" fill="#C0C0C4" />
                                    <rect x="44" y="28" width="12" height="12" rx="2" fill="#BCBCC0" />
                                    <rect x="60" y="28" width="12" height="12" rx="2" fill="#B8B8BC" />
                                    <rect x="76" y="28" width="12" height="12" rx="2" fill="#B4B4B8" />
                                    <rect x="12" y="44" width="12" height="12" rx="2" fill="#C0C0C4" />
                                    <rect x="28" y="44" width="12" height="12" rx="2" fill="#BCBCB8" />
                                    <rect x="44" y="44" width="12" height="12" rx="2" fill="#B8B8BC" />
                                    <rect x="60" y="44" width="12" height="12" rx="2" fill="#B4B4B8" />
                                    <rect x="76" y="44" width="12" height="12" rx="2" fill="#B0B0B4" />
                                    <rect x="12" y="60" width="12" height="12" rx="2" fill="#BCBCB8" />
                                    <rect x="28" y="60" width="12" height="12" rx="2" fill="#B8B8BC" />
                                    <rect x="44" y="60" width="12" height="12" rx="2" fill="#B4B4B8" />
                                    <rect x="60" y="60" width="12" height="12" rx="2" fill="#B0B0B4" />
                                    <rect x="76" y="60" width="12" height="12" rx="2" fill="#ACACB0" />
                                    <rect x="12" y="76" width="12" height="12" rx="2" fill="#B8B8BC" />
                                    <rect x="28" y="76" width="12" height="12" rx="2" fill="#B4B4B8" />
                                    <rect x="44" y="76" width="12" height="12" rx="2" fill="#B0B0B4" />
                                    <rect x="60" y="76" width="12" height="12" rx="2" fill="#ACACB0" />
                                    <rect x="76" y="76" width="12" height="12" rx="2" fill="#A8A8AC" />
                                </g>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 100 100" width={28} height={28} xmlns="http://www.w3.org/2000/svg">
                                <rect width="100" height="100" rx="20" fill="#111" />
                                <g>
                                    <rect x="12" y="12" width="12" height="12" rx="2" fill="#2A2A2F" />
                                    <rect x="28" y="12" width="12" height="12" rx="2" fill="#2E2E33" />
                                    <rect x="44" y="12" width="12" height="12" rx="2" fill="#323237" />
                                    <rect x="60" y="12" width="12" height="12" rx="2" fill="#36363B" />
                                    <rect x="76" y="12" width="12" height="12" rx="2" fill="#3A3A3F" />
                                    <rect x="12" y="28" width="12" height="12" rx="2" fill="#2E2E33" />
                                    <rect x="28" y="28" width="12" height="12" rx="2" fill="#323237" />
                                    <rect x="44" y="28" width="12" height="12" rx="2" fill="#36363B" />
                                    <rect x="60" y="28" width="12" height="12" rx="2" fill="#3A3A3F" />
                                    <rect x="76" y="28" width="12" height="12" rx="2" fill="#3E3E43" />
                                    <rect x="12" y="44" width="12" height="12" rx="2" fill="#323237" />
                                    <rect x="28" y="44" width="12" height="12" rx="2" fill="#36363B" />
                                    <rect x="44" y="44" width="12" height="12" rx="2" fill="#3A3A3F" />
                                    <rect x="60" y="44" width="12" height="12" rx="2" fill="#3E3E43" />
                                    <rect x="76" y="44" width="12" height="12" rx="2" fill="#424247" />
                                    <rect x="12" y="60" width="12" height="12" rx="2" fill="#36363B" />
                                    <rect x="28" y="60" width="12" height="12" rx="2" fill="#3A3A3F" />
                                    <rect x="44" y="60" width="12" height="12" rx="2" fill="#3E3E43" />
                                    <rect x="60" y="60" width="12" height="12" rx="2" fill="#424247" />
                                    <rect x="76" y="60" width="12" height="12" rx="2" fill="#46464B" />
                                    <rect x="12" y="76" width="12" height="12" rx="2" fill="#3A3A3F" />
                                    <rect x="28" y="76" width="12" height="12" rx="2" fill="#3E3E43" />
                                    <rect x="44" y="76" width="12" height="12" rx="2" fill="#424247" />
                                    <rect x="60" y="76" width="12" height="12" rx="2" fill="#46464B" />
                                    <rect x="76" y="76" width="12" height="12" rx="2" fill="#4A4A4F" />
                                </g>
                            </svg>
                        )}
                    </button>
                    {/* Search */}
                    <button
                        className="bg-[var(--panel)] rounded-xl p-2 flex items-center justify-center"
                        onClick={() => setShowGlobalSearch(true)}
                        aria-label="Search"
                    >
                        <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {/* Plus */}
                    <button
                        className="bg-[var(--panel)] rounded-xl p-2 flex items-center justify-center"
                        onClick={handlePlusClick}
                        aria-label="Add"
                    >
                        <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {/* Admin (if admin) */}
                    {userRole === "admin" && (
                        <button
                            className="bg-[var(--panel)] rounded-xl p-2 flex items-center justify-center"
                            onClick={() => setActiveView("admin")}
                            aria-label="Admin"
                        >
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                style={{ color: "var(--admin-icon-smallSidebar)" }}
                            >
                                <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
                                <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
                            </svg>
                        </button>
                    )}
                    {/* Productivity Panel Button (right) */}
                    <button
                        className="bg-[var(--panel)] rounded-xl p-2 flex items-center justify-center"
                        onClick={() => setShowRightSidebar(true)}
                        aria-label="Open productivity panel"
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
                <style jsx>{`
                    .mobile-dock-grid {
                        display: grid;
                        grid-template-columns: repeat(8, 1fr);
                        gap: 1.2rem;
                    }
                    @media (max-width: 485px) {
                        .mobile-dock-grid {
                            grid-template-columns: repeat(4, 1fr);
                            grid-template-rows: repeat(2, 1fr);
                            gap: 0.7rem 1.2rem;
                        }
                    }
                `}</style>
            </div>
        </>
    );
}
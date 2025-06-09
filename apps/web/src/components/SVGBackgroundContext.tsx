"use client";
import React, { createContext, useContext, useState } from "react";

const icons = [
  // Folder
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
    <path d="M40,12H22l-4-4H8c-2.2,0-4,1.8-4,4v24c0,2.2,1.8,4,4,4h29.7L44,29V16C44,13.8,42.2,12,40,12z"></path>
    <path d="M40,12H8c-2.2,0-4,1.8-4,4v20c0,2.2,1.8,4,4,4h32c2.2,0,4-1.8,4-4V16C44,13.8,42.2,12,40,12z"></path>
  </svg>`,
  // Note
  `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <rect x="192" y="192" width="640" height="640" rx="120" ry="120"/>
  </svg>`,
  // Tag
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v3.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l3.878-3.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 8.38 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
  </svg>`
];

const COUNT = 50;
const MODES = ["spin", "move", "click"] as const;
type Mode = typeof MODES[number];

type SVGIconState = {
  top: number;
  left: number;
  icon: string;
  mode: Mode;
};

function getRandomMode(): Mode {
  return MODES[Math.floor(Math.random() * MODES.length)];
}

function generateSVGState(): SVGIconState[] {
  return Array.from({ length: COUNT }).map(() => ({
    top: Math.random() * 90,
    left: Math.random() * 90,
    icon: icons[Math.floor(Math.random() * icons.length)],
    mode: getRandomMode(),
  }));
}

const SVGBackgroundContext = createContext<SVGIconState[] | null>(null);

export function SVGBackgroundProvider({ children }: { children: React.ReactNode }) {
  const [svgState] = useState(() => generateSVGState());
  return (
    <SVGBackgroundContext.Provider value={svgState}>
      {children}
    </SVGBackgroundContext.Provider>
  );
}

export function useSVGBackgroundState() {
  const ctx = useContext(SVGBackgroundContext);
  if (!ctx) throw new Error("useSVGBackgroundState must be used within SVGBackgroundProvider");
  return ctx;
}
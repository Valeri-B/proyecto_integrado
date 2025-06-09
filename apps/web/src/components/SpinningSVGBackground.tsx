"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useSVGBackgroundState } from "./SVGBackgroundContext";

gsap.registerPlugin(Draggable);

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

const COUNT = 30;
const MODES = ["spin", "move", "click"] as const;

type Mode = typeof MODES[number];

function getRandomMode(): Mode {
  const idx = Math.floor(Math.random() * MODES.length);
  return MODES[idx];
}

export default function SpinningSVGBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgState = useSVGBackgroundState();

  useEffect(() => {
    if (!containerRef.current) return;
    const nodes = Array.from(containerRef.current.children);

    nodes.forEach((node, i) => {
      const { mode } = svgState[i];

      if (mode === "spin") {
        // Drag to spin (rotation)
        Draggable.create(node, {
          type: "rotation",
          inertia: true,
          onPress() {
            gsap.to(node, { scale: 1.07, duration: 0.2 });
          },
          onRelease() {
            gsap.to(node, { scale: 1, duration: 0.2 });
          },
        });
      } else if (mode === "move") {
        // Drag to move
        Draggable.create(node, {
          type: "x,y",
          inertia: true,
          onPress() {
            gsap.to(node, { scale: 1.07, duration: 0.2 });
          },
          onRelease() {
            gsap.to(node, { scale: 1, duration: 0.2 });
          },
        });
      } else if (mode === "click") {
        // Only clickable, scale on click
        node.addEventListener("click", () => {
          gsap.to(node, { scale: 1.07, duration: 0.1, yoyo: true, repeat: 1 });
        });
        // pointer cursor for clickables
        (node as HTMLElement).style.cursor = "pointer";
      }
    });
  }, [svgState]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {svgState.map((item, i) => (
        <div
          key={i}
          className="svg-bg-icon"
          style={{
            position: "absolute",
            top: `${item.top}%`,
            left: `${item.left}%`,
            width: "2.5em",
            height: "2.5em",
            opacity: 0.18,
            color: "var(--bg-svgs)",
            pointerEvents: "auto",
            touchAction: "none",
            userSelect: "none",
            transition: "color 0.3s",
          }}
          dangerouslySetInnerHTML={{ __html: item.icon }}
        />
      ))}
    </div>
  );
}
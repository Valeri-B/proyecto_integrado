import React, { useEffect, useRef } from "react";
import MarkdownIt from "markdown-it";
import markdownItFootnote from "markdown-it-footnote";
import markdownItDeflist from "markdown-it-deflist";
import markdownItMark from "markdown-it-mark";
import markdownItSub from "markdown-it-sub";
import markdownItSup from "markdown-it-sup";
import markdownItTaskLists from "markdown-it-task-lists";
import markdownItContainer from "markdown-it-container";
import markdownItMultimdTable from "markdown-it-multimd-table";
import markdownItHighlightjs from "markdown-it-highlightjs";
import markdownItAbbr from "markdown-it-abbr";
import markdownItIns from "markdown-it-ins";
import "highlight.js/styles/github.css";


const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})
  .use(markdownItFootnote)
  .use(markdownItDeflist)
  .use(markdownItMark)
  .use(markdownItSub)
  .use(markdownItSup)
  .use(markdownItTaskLists, { enabled: true })
  .use(markdownItMultimdTable, {
    multiline: true,
    rowspan: true,
    headerless: true,
  })
  .use(markdownItHighlightjs)
  .use(markdownItContainer, "warning")
  .use(markdownItContainer, "info")
  .use(markdownItContainer, "success")
  .use(markdownItContainer, "danger")
  .use(markdownItAbbr)
  .use(markdownItIns);

export default function MarkdownPreview({
  value,
  notes = [],
  onOpenNote,
}: {
  value: string;
  notes?: any[];
  onOpenNote?: (note: any) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && onOpenNote) {
      const links = ref.current.querySelectorAll('a[href^="#note/"]');
      links.forEach((link) => {
        const href = link.getAttribute("href");
        if (href) {
          const noteTitle = decodeURIComponent(href.replace("#note/", ""));
          const matchingNote = notes.find((n: any) =>
            n.title.trim().toLowerCase() === noteTitle.toLowerCase()
          );
          if (matchingNote) {
            link.addEventListener("click", (e) => {
              e.preventDefault();
              onOpenNote(matchingNote);
            });
            (link as HTMLElement).style.color = "var(--accent)";
            (link as HTMLElement).style.textDecoration = "underline";
          }
        }
      });
    }
  }, [value, notes, onOpenNote]);

  const renderedHTML = md.render(value);

  return (
    <div
      ref={ref}
      className="markdown-preview prose max-w-none w-full h-full p-4 border rounded-lg overflow-auto"
      style={{
        background: "transparent",
        color: "var(--foreground)",
        borderColor: "transparent",
        minHeight: "400px",
        maxHeight: "600px",
        overflowY: "auto",
      }}
      dangerouslySetInnerHTML={{ __html: renderedHTML }}
    />
  );
}
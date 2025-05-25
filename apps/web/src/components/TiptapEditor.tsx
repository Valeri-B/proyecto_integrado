import React from "react";
import TiptapEditor from "./TiptapEditor";
import MarkdownIt from "markdown-it";
import mkEmoji from "markdown-it-emoji";
import mkFootnote from "markdown-it-footnote";
import mkDeflist from "markdown-it-deflist";
import mkAbbr from "markdown-it-abbr";
import mkMark from "markdown-it-mark";
import mkIns from "markdown-it-ins";
import mkSub from "markdown-it-sub";
import mkSup from "markdown-it-sup";
import mkContainer from "markdown-it-container";
import "katex/dist/katex.min.css";
import { tiptapJsonToMarkdown } from "../utils/jsonToMarkdown";

const md = MarkdownIt({ html: true, linkify: true, typographer: true })
  .use(mkEmoji)
  .use(mkFootnote)
  .use(mkDeflist)
  .use(mkAbbr)
  .use(mkMark)
  .use(mkIns)
  .use(mkSub)
  .use(mkSup)
  .use(mkContainer, "warning");

export default function Editor({ value, setValue, editable = true }: any) {
  return (
    <TiptapEditor
      value={value}
      setValue={setValue}
      editable={editable}
      extensions={[
        StarterKit,
        TaskList,
        TaskItem,
        Strike,
        CodeBlock,
        Markdown.configure({
          html: false,
        }),
      ]}
    />
  );
}
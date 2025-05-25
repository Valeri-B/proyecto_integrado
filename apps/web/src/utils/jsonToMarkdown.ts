export function tiptapJsonToMarkdown(json: any): string {
  if (!json || !json.content) return "";
  return json.content
    .map((node: any) => {
      if (node.type === "heading") {
        return `${"#".repeat(node.attrs.level)} ${node.content?.[0]?.text || ""}`;
      }
      if (node.type === "paragraph") {
        return node.content?.map((n: any) => n.text).join("") || "";
      }
      if (node.type === "bulletList") {
        return (
          node.content
            ?.map(
              (item: any) =>
                "- " +
                (item.content
                  ?.map((n: any) => n.content?.map((nn: any) => nn.text).join("") || "")
                  .join("") || "")
            )
            .join("\n") || ""
        );
      }
      if (node.type === "orderedList") {
        return (
          node.content
            ?.map(
              (item: any, i: number) =>
                `${i + 1}. ` +
                (item.content
                  ?.map((n: any) => n.content?.map((nn: any) => nn.text).join("") || "")
                  .join("") || "")
            )
            .join("\n") || ""
        );
      }
      if (node.type === "taskList") {
        return (
          node.content
            ?.map(
              (item: any) =>
                `- [${item.attrs.checked ? "x" : " "}] ` +
                (item.content?.map((n: any) => n.text).join("") || "")
            )
            .join("\n") || ""
        );
      }
      // --- Table support ---
      if (node.type === "table") {
        const rows = node.content || [];
        return rows
          .map((row: any, rowIdx: number) => {
            const cells = row.content || [];
            const line =
              "|" +
              cells
                .map((cell: any) =>
                  (cell.content || [])
                    .map((n: any) => n.text || "")
                    .join("")
                )
                .join("|") +
              "|";
            // Add separator after header row
            if (rowIdx === 0) {
              const sep =
                "|" +
                cells
                  .map(() => "---")
                  .join("|") +
                "|";
              return line + "\n" + sep;
            }
            return line;
          })
          .join("\n");
      }
      return "";
    })
    .join("\n\n");
}
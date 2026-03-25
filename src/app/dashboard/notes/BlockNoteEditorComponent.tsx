"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";

interface Props {
  value: string;        // JSON string of blocks (or legacy HTML)
  onChange: (val: string) => void;
  pageId: string;       // used so editor recreates when page changes
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/notes/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || "Upload failed");
  }
  const data = await res.json();
  return data.url;
}

function parseBlocks(value: string): PartialBlock[] | undefined {
  if (!value || value === "Loading...") return undefined;
  // Try JSON first (new format)
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as PartialBlock[];
  } catch {}
  // Fallback: treat as legacy HTML — strip tags and wrap in a paragraph
  return [{ type: "paragraph", content: [{ type: "text", text: value.replace(/<[^>]+>/g, ''), styles: {} }] }];
}

export default function BlockNoteEditorComponent({ value, onChange, pageId }: Props) {
  const onChangeFn = useRef(onChange);
  onChangeFn.current = onChange;

  const initialContent = useMemo(() => parseBlocks(value), [pageId]); // Only re-parse on page change

  const editor = useMemo(() => {
    return BlockNoteEditor.create({
      initialContent,
      uploadFile,
    });
  }, [pageId]); // Recreate editor when page changes

  const handleChange = useCallback(() => {
    const blocks = editor.document;
    onChangeFn.current(JSON.stringify(blocks));
  }, [editor]);

  return (
    <div className="h-full w-full blocknote-container">
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="light"
      />
      <style global jsx>{`
        .blocknote-container {
          --bn-colors-editor-background: #ffffff;
          --bn-colors-menu-background: #ffffff;
        }
        .blocknote-container .bn-container {
          height: 100%;
        }
        .blocknote-container .bn-editor {
          padding: 2rem 3rem;
          min-height: 100%;
          font-family: inherit;
          font-size: 15px;
        }
        .blocknote-container .bn-block-group {
          width: 100%;
        }
        /* Drag handle visible on hover */
        .blocknote-container .bn-drag-handle {
          opacity: 0;
          transition: opacity 0.15s;
        }
        .blocknote-container .bn-block:hover .bn-drag-handle {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

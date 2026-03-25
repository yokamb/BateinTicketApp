"use client";
import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

async function uploadFileToBlob(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("/api/notes/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "Upload failed");
      return null;
    }
    const data = await res.json();
    return data.url;
  } catch {
    alert("Upload failed. Please try again.");
    return null;
  }
}

export default function NativeQuill({ value, onChange, className }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (quillRef.current) return;

    const editorDiv = document.createElement("div");
    containerRef.current.appendChild(editorDiv);
    
    const quill = new Quill(editorDiv, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image', 'code-block'],
            ['clean']
          ],
          handlers: {
            image: () => {
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');
              input.click();
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const url = await uploadFileToBlob(file);
                if (url) {
                  const range = quill.getSelection(true);
                  quill.insertEmbed(range.index, 'image', url);
                  quill.setSelection(range.index + 1, 0);
                }
              };
            }
          }
        }
      }
    });

    quillRef.current = quill;

    // Handle drag and drop of files/images
    editorDiv.addEventListener('drop', async (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      for (const file of files) {
        const url = await uploadFileToBlob(file);
        if (url) {
          const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
          if (file.type.startsWith('image/')) {
            quill.insertEmbed(range.index, 'image', url);
          } else {
            quill.insertText(range.index, file.name, 'link', url);
          }
          quill.setSelection(range.index + 1, 0);
        }
      }
    });

    editorDiv.addEventListener('dragover', (e) => e.preventDefault());

    // Handle clipboard paste of images
    quill.root.addEventListener('paste', async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(i => i.type.startsWith('image/'));
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          const url = await uploadFileToBlob(file);
          if (url) {
            const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
            quill.insertEmbed(range.index, 'image', url);
            quill.setSelection(range.index + 1, 0);
          }
        }
      }
    });

    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      onChange(html === '<p><br></p>' ? '' : html);
    });
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (quill) {
      const currentHtml = quill.root.innerHTML;
      if (value !== currentHtml && value !== undefined && typeof value === 'string') {
        const selection = quill.getSelection();
        quill.clipboard.dangerouslyPasteHTML(value);
        if (selection) {
          setTimeout(() => quill.setSelection(selection), 0);
        }
      }
    }
  }, [value]);

  return (
    <div className={className} ref={containerRef} />
  );
}

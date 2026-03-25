"use client";
import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export default function NativeQuill({ value, onChange, className }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!quillRef.current) {
      // Initialize Quill
      const editorDiv = document.createElement("div");
      containerRef.current.appendChild(editorDiv);
      
      quillRef.current = new Quill(editorDiv, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image', 'code-block'],
            ['clean']
          ]
        }
      });
      
      quillRef.current.on('text-change', () => {
        if (quillRef.current) {
          const html = quillRef.current.root.innerHTML;
          // Avoid infinite loops if quill issues change
          onChange(html === '<p><br></p>' ? '' : html);
        }
      });
    }
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

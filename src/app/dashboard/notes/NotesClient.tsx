"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Folder, File, Save, Trash2 } from "lucide-react";

// Quill needs to be loaded dynamically to avoid SSR issues
const NativeQuill = dynamic(() => import("./NativeQuill"), { ssr: false });

export default function NotesClient({ workspaces, currentUser }: { workspaces: any[]; currentUser: any }) {
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]?.id || "");
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Page Content State
  const [pageTitle, setPageTitle] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedWorkspace) fetchSections();
  }, [selectedWorkspace]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/sections?workspaceId=${selectedWorkspace}`);
      if (res.ok) {
        const data = await res.json();
        setSections(data);
        if (selectedSection) {
          const updatedSection = data.find((s: any) => s.id === selectedSection.id);
          setSelectedSection(updatedSection || null);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateSection = async () => {
    const name = prompt("Enter section name:");
    if (!name) return;
    try {
      const res = await fetch("/api/notes/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, workspaceId: selectedWorkspace })
      });
      if (res.ok) {
        fetchSections();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create section");
      }
    } catch (e) { console.error(e); }
  };

  const handleCreatePage = async () => {
    if (!selectedSection) return;
    const title = prompt("Enter page title:");
    if (!title) return;
    try {
      const res = await fetch("/api/notes/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sectionId: selectedSection.id, workspaceId: selectedWorkspace })
      });
      if (res.ok) {
        fetchSections();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create page");
      }
    } catch (e) { console.error(e); }
  };

  const handleSelectPage = async (page: any) => {
    setSelectedPage(page);
    setPageTitle(page.title);
    setPageContent("Loading...");
    try {
      const res = await fetch(`/api/notes/pages/${page.id}`);
      if (res.ok) {
        const data = await res.json();
        setPageContent(data.content || "");
      }
    } catch (e) { console.error(e); }
  };

  const handleSavePage = async () => {
    if (!selectedPage) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/notes/pages/${selectedPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: pageTitle, content: pageContent })
      });
      if (res.ok) {
        fetchSections(); // refresh titles in sidebar
      } else {
        alert("Failed to save page");
      }
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const handleDeletePage = async () => {
    if (!selectedPage || !confirm("Delete this page?")) return;
    try {
      const res = await fetch(`/api/notes/pages/${selectedPage.id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedPage(null);
        fetchSections();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-1 w-full overflow-hidden bg-white">
      
      {/* LEFT PANE: Sections */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <select 
            value={selectedWorkspace} 
            onChange={e => { setSelectedWorkspace(e.target.value); setSelectedSection(null); setSelectedPage(null); }}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium outline-none"
          >
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sections</h3>
            <button onClick={handleCreateSection} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors" title="New Section">
               <Plus size={16} />
            </button>
          </div>
          {loading && <div className="text-sm text-slate-400">Loading...</div>}
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => { setSelectedSection(section); setSelectedPage(null); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${selectedSection?.id === section.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'}`}
            >
              <Folder size={16} className={selectedSection?.id === section.id ? 'text-indigo-200' : 'text-slate-400'} />
              <span className="truncate">{section.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE PANE: Pages */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {selectedSection ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 truncate pr-2">{selectedSection.name} Pages</h3>
                <button onClick={handleCreatePage} className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md font-bold transition-colors shadow-sm shrink-0 flex items-center gap-1">
                   <Plus size={14} /> New
                </button>
              </div>
              {selectedSection.pages?.length === 0 && <p className="text-xs text-slate-400 italic">No pages in this section.</p>}
              {selectedSection.pages?.map((page: any) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border ${selectedPage?.id === page.id ? 'border-indigo-200 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}
                >
                  <File size={16} className={selectedPage?.id === page.id ? 'text-indigo-500' : 'text-slate-400'} />
                  <span className="truncate">{page.title}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-slate-400">
            Select a section to view its pages.
          </div>
        )}
      </div>

      {/* RIGHT PANE: Editor */}
      <div className="flex-1 bg-white flex flex-col min-w-0">
        {selectedPage ? (
          <>
            <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <input
                type="text"
                value={pageTitle}
                onChange={e => setPageTitle(e.target.value)}
                className="text-2xl font-bold text-slate-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1 w-2/3"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleDeletePage} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Page">
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={handleSavePage} 
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors text-sm disabled:opacity-70"
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto bg-white notes-editor-container">
               <NativeQuill 
                 value={pageContent} 
                 onChange={setPageContent} 
                 className="h-full"
               />
               <style jsx global>{`
                 .notes-editor-container .quill { height: 100%; display: flex; flex-direction: column; }
                 .notes-editor-container .ql-container { flex: 1; overflow-y: auto; font-size: 15px; font-family: inherit; }
                 .notes-editor-container .ql-editor { padding: 2rem; }
                 .notes-editor-container .ql-toolbar { border-left: none; border-right: none; border-top: none; background: #f8fafc; padding: 12px; }
               `}</style>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-4 bg-slate-50/30">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shadow-inner">
               <File size={32} className="text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">No Page Selected</h3>
              <p className="text-sm max-w-xs mx-auto">Select a page from the middle pane or create a new one to start writing.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

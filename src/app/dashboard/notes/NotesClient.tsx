"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Folder, File, Save, Trash2 } from "lucide-react";

const BlockNoteEditorComponent = dynamic(() => import("./BlockNoteEditorComponent"), { ssr: false });

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

  // Creation States
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [sectionSuccess, setSectionSuccess] = useState(false);
  const [pageSuccess, setPageSuccess] = useState(false);

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

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    setSectionLoading(true);
    setSectionError(null);
    try {
      const res = await fetch("/api/notes/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSectionName, workspaceId: selectedWorkspace })
      });
      const data = await res.json();
      if (res.ok) {
        setNewSectionName("");
        setNewSectionName("");
        setIsCreatingSection(false);
        setSectionSuccess(false);
        fetchSections();
      } else {
        setSectionError(data.error || "Failed to create section");
      }
    } catch (e) { 
      setSectionError("An unexpected error occurred");
      console.error(e); 
    }
    finally { setSectionLoading(false); }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection || !newPageTitle.trim()) return;
    setPageLoading(true);
    setPageError(null);
    try {
      const res = await fetch("/api/notes/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPageTitle, sectionId: selectedSection.id, workspaceId: selectedWorkspace })
      });
      const data = await res.json();
      if (res.ok) {
        setNewPageTitle("");
        setNewPageTitle("");
        setIsCreatingPage(false);
        setPageSuccess(false);
        fetchSections();
      } else {
        setPageError(data.error || "Failed to create page");
      }
    } catch (e) { 
      setPageError("An unexpected error occurred");
      console.error(e); 
    }
    finally { setPageLoading(false); }
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
    <div className="flex flex-1 w-full overflow-hidden bg-white text-sm">
      
      {/* LEFT PANE: Sections */}
      <div className="w-56 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-3 border-b border-slate-200">
          <select 
            value={selectedWorkspace} 
            onChange={e => { setSelectedWorkspace(e.target.value); setSelectedSection(null); setSelectedPage(null); }}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none"
          >
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sections</h3>
            <button onClick={() => setIsCreatingSection(true)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors" title="New Section">
               <Plus size={14} />
            </button>
          </div>
          {loading && <div className="text-xs text-slate-400 ml-2">Loading...</div>}
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => { setSelectedSection(section); setSelectedPage(null); }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${selectedSection?.id === section.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <Folder size={14} className={selectedSection?.id === section.id ? 'text-indigo-200' : 'text-slate-400'} />
              <span className="truncate">{section.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE PANE: Pages */}
      <div className="w-60 bg-white border-r border-slate-200 flex flex-col">
        {selectedSection ? (
          <>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate pr-2">{selectedSection.name}</h3>
                <button onClick={() => setIsCreatingPage(true)} className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded font-black transition-colors shadow-sm shrink-0 flex items-center gap-1 uppercase tracking-tighter">
                   <Plus size={12} /> New
                </button>
              </div>
              {selectedSection.pages?.length === 0 && <p className="text-[10px] text-slate-400 italic px-2">No pages here.</p>}
              {selectedSection.pages?.map((page: any) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors border ${selectedPage?.id === page.id ? 'border-indigo-100 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
                >
                  <File size={14} className={selectedPage?.id === page.id ? 'text-indigo-500' : 'text-slate-400'} />
                  <span className="truncate">{page.title}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-slate-400">
            Select a section to view its pages.
          </div>
        )}
      </div>

      {/* RIGHT PANE: Editor */}
      <div className="flex-1 bg-white flex flex-col min-w-0">
        {selectedPage ? (
          <>
            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <input
                type="text"
                value={pageTitle}
                onChange={e => setPageTitle(e.target.value)}
                className="text-lg font-bold text-slate-900 bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500/30 rounded px-2 py-0.5 w-2/3"
                placeholder="Page Title"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={handleDeletePage} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="Delete Page">
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={handleSavePage} 
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors text-xs disabled:opacity-70"
                >
                  <Save size={14} />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
            {/* Editor Area */}
            <div className="flex-1 overflow-hidden bg-white">
               <BlockNoteEditorComponent
                 key={selectedPage.id}
                 pageId={selectedPage.id}
                 value={pageContent} 
                 onChange={setPageContent} 
               />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-300 gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shadow-inner">
               <File size={24} className="text-slate-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-0.5 uppercase tracking-wide">No Page Selected</h3>
              <p className="text-xs max-w-[180px] mx-auto opacity-60">Select or create a page to start writing.</p>
            </div>
          </div>
        )}
      </div>


      {/* Section Creation Modal */}
      {isCreatingSection && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 relative animate-fade-in-up">
            <h3 className="text-base font-bold text-slate-900 mb-3 uppercase tracking-tight">Create New Notebook</h3>
            <form onSubmit={handleCreateSection} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-1 uppercase tracking-wide">Notebook Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSectionName}
                  onChange={(e) => { setNewSectionName(e.target.value); setSectionError(null); }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                  placeholder="e.g. Project Specs"
                />
              </div>

              {sectionError && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[11px] font-bold leading-tight animate-shake text-center">
                  {sectionError}
                </div>
              )}

              {sectionSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-[11px] font-bold leading-tight flex items-center justify-center gap-2">
                   Notebook created!
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreatingSection(false); setSectionError(null); }}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sectionLoading || sectionSuccess}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black transition-all disabled:opacity-70 text-xs shadow-md shadow-indigo-200"
                >
                  {sectionLoading ? "Creating..." : sectionSuccess ? "Refining..." : "Create Notebook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Creation Modal */}
      {isCreatingPage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 relative animate-fade-in-up">
            <h3 className="text-base font-bold text-slate-900 mb-3 uppercase tracking-tight">New Page in {selectedSection?.name}</h3>
            <form onSubmit={handleCreatePage} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-1 uppercase tracking-wide">Page Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPageTitle}
                  onChange={(e) => { setNewPageTitle(e.target.value); setPageError(null); }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                  placeholder="e.g. Meeting Transcript"
                />
              </div>

              {pageError && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[11px] font-bold leading-tight animate-shake text-center">
                  {pageError}
                </div>
              )}

              {pageSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-[11px] font-bold leading-tight text-center">
                   Page ready! Opening...
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { setIsCreatingPage(false); setPageError(null); }}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pageLoading || pageSuccess}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black transition-all disabled:opacity-70 text-xs shadow-md shadow-indigo-200"
                >
                  {pageLoading ? "Adding..." : pageSuccess ? "Opening..." : "Add Page"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

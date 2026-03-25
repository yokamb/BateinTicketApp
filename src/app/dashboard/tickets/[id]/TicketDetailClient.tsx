"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, Clock, CheckCircle, MessageSquare, Send } from "lucide-react";

export default function TicketDetailClient({ ticket, currentUser }: { ticket: any, currentUser: any }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [isUpdating, setIsUpdating] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [targetTicketId, setTargetTicketId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(ticket.title);
  const [editDesc, setEditDesc] = useState(ticket.description || "");

  const router = useRouter();

  const isAdmin = currentUser.role === "ADMIN";

  const handleUpdate = async (field: string, value: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        if (field === "status") setStatus(value);
        if (field === "priority") setPriority(value);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDetails = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDesc, status, priority }),
      });
      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("Failed to save changes.");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveAndClose = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDesc, status, priority }),
      });
      if (res.ok) {
        router.push("/dashboard/tickets");
        router.refresh();
      } else {
        alert("Failed to save changes.");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/tickets");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText, ticketId: ticket.id }),
      });
      if (res.ok) {
        setCommentText("");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleLinkTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTicketId.trim()) return;
    setIsLinking(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTicketId }),
      });
      if (res.ok) {
        setTargetTicketId("");
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to link ticket");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLinking(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to upload file");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = ''; // reset input
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="flex-1 pr-4">
            {isEditing ? (
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full text-2xl font-bold bg-slate-50 border border-indigo-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 mb-2" />
            ) : (
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{editTitle}</h1>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
               <span className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-md text-indigo-700 font-bold uppercase tracking-widest shadow-sm">
                 {ticket.shortId}
               </span>
               <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-semibold text-[10px] uppercase tracking-wider border border-slate-200">
                 {ticket.type}
               </span>
               <span>Workspace: <strong className="text-slate-700">{ticket.workspace?.name}</strong></span>
               <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
               <span>By: {ticket.creator?.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {isEditing ? (
              <>
                <button onClick={() => { setIsEditing(false); setEditTitle(ticket.title); setEditDesc(ticket.description || ""); }} className="flex items-center gap-1 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors">Cancel</button>
                <button onClick={handleSaveDetails} disabled={isUpdating} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold transition-colors shadow-sm">{isUpdating ? "Saving..." : "Save"}</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors">Edit</button>
            )}
            {isAdmin && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                title="Delete Ticket"
              >
                <Trash2 size={16} /> 
              </button>
            )}
          </div>
        </div>

        {/* Approval Controls */}
        {ticket.type === "CHANGE" && ticket.workspace?.requiresChangeApproval && ticket.approvalStatus !== "PENDING" && (
           <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
              <span className="text-sm font-semibold uppercase text-slate-500">Approval Status:</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-md ${ticket.approvalStatus === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                 {ticket.approvalStatus}
              </span>
           </div>
        )}

        {ticket.type === "CHANGE" && ticket.workspace?.requiresChangeApproval && ticket.approvalStatus === "PENDING" && currentUser.id === ticket.approverId && (
           <div className="mb-6 p-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                 <h3 className="font-bold text-indigo-900">Approval Required</h3>
                 <p className="text-sm text-indigo-700 mb-0">You are the assigned approver for this Change.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                 <button 
                  onClick={() => handleUpdate("approvalStatus", "APPROVED")} 
                  disabled={isUpdating}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 shadow-sm transition-colors"
                 >
                   Approve
                 </button>
                 <button 
                  onClick={() => handleUpdate("approvalStatus", "REJECTED")} 
                  disabled={isUpdating}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 shadow-sm transition-colors"
                 >
                   Reject
                 </button>
              </div>
           </div>
        )}

        {ticket.type === "CHANGE" && ticket.workspace?.requiresChangeApproval && ticket.approvalStatus === "PENDING" && currentUser.id !== ticket.approverId && (
           <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
              <h3 className="font-bold text-amber-900">Pending Approval</h3>
              <p className="text-sm text-amber-700">Waiting for the assigned Approver to review this Change request.</p>
           </div>
        )}

        {/* Status and Priority Controls */}
        <div className="flex flex-wrap gap-6 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!isEditing || isUpdating}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-50"
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
             <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={!isEditing || isUpdating}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-50"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
          {isEditing ? (
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={6} className="w-full text-slate-700 bg-white border border-indigo-300 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-y text-sm font-medium">{editDesc}</textarea>
          ) : (
            <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-6 rounded-xl border border-slate-100 text-sm">
              {editDesc || <span className="text-slate-400 italic">No description provided.</span>}
            </div>
          )}
        </div>

        {/* Attachments & Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-slate-100 pt-8">
            {/* Attachments */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Attachments</h3>
                <div>
                   <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                     {isUploading ? "Uploading..." : "+ Upload File"}
                     <input type="file" className="hidden" disabled={isUploading} onChange={handleFileUpload} />
                   </label>
                </div>
              </div>
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <ul className="space-y-2">
                  {ticket.attachments.map((att: any) => (
                    <li key={att.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm">
                       <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[80%] inline-block">
                          {att.fileUrl.split('/').pop()}
                       </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No attachments added.</p>
              )}
            </div>

            {/* Linked Tickets */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Linked Tickets</h3>
              <form onSubmit={handleLinkTicket} className="flex gap-2 mb-4">
                 <input 
                   type="text" 
                   value={targetTicketId}
                   onChange={e => setTargetTicketId(e.target.value)}
                   placeholder="Enter ticket ID..." 
                   className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                 />
                 <button type="submit" disabled={isLinking} className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-70">
                   Link
                 </button>
              </form>
              <ul className="space-y-2 text-sm">
                {ticket.linkedTo?.map((link: any) => (
                   <li key={link.target.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-slate-500 text-xs uppercase mr-2">Linked to</span>
                      <a href={`/dashboard/tickets/${link.target.id}`} className="font-semibold text-indigo-600 hover:underline">
                         {link.target.title}
                      </a>
                   </li>
                ))}
                {ticket.linkedFrom?.map((link: any) => (
                   <li key={link.source.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-slate-500 text-xs uppercase mr-2">Linked from</span>
                      <a href={`/dashboard/tickets/${link.source.id}`} className="font-semibold text-indigo-600 hover:underline">
                         {link.source.title}
                      </a>
                   </li>
                ))}
                {(!ticket.linkedTo?.length && !ticket.linkedFrom?.length) && (
                   <p className="text-xs text-slate-500 italic">No linked tickets.</p>
                )}
              </ul>
            </div>
        </div>
      </div>

      {/* Discussion/Comments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
           <MessageSquare size={20} className="text-slate-400" />
           <h3 className="text-lg font-semibold text-slate-900">Discussion</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {ticket.comments.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8 italic border border-dashed border-slate-200 rounded-xl">No comments yet. Start the conversation!</p>
          ) : (
            <div className="space-y-6">
              {ticket.comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-sm">
                    {comment.user.name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tl-sm border border-slate-100">
                    <div className="flex justify-between items-baseline mb-2">
                       <p className="font-semibold text-sm text-slate-900">{comment.user.name}</p>
                       <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 mt-6">
             <form onSubmit={handleAddComment} className="flex flex-col gap-3">
               <textarea
                 value={commentText}
                 onChange={(e) => setCommentText(e.target.value)}
                 className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-y min-h-[100px]"
                 placeholder="Leave a comment..."
               />
               <div className="flex justify-end gap-3 flex-wrap">
                 {isEditing && (
                   <button
                     type="button"
                     onClick={handleSaveAndClose}
                     disabled={isUpdating}
                     className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-colors disabled:opacity-70 text-sm shadow-sm"
                   >
                     {isUpdating ? "Saving..." : "Save Ticket"}
                   </button>
                 )}
                 <button
                   type="submit"
                   disabled={isCommenting || !commentText.trim()}
                   className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70 text-sm shadow-sm"
                 >
                   <Send size={16} /> 
                   {isCommenting ? "Posting..." : "Post Comment"}
                 </button>
               </div>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
}

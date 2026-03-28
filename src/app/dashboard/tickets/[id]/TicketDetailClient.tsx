"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, Clock, CheckCircle, MessageSquare, Send, XCircle, RotateCcw, Sparkles } from "lucide-react";
import { TicketTypeBadge } from "@/components/TicketTypeBadge";
import { Modal, Textarea, Button, Group, Stack, Text, Title } from "@mantine/core";

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

  // Approval state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionFeedback, setRejectionFeedback] = useState("");
  const [isDeciding, setIsDeciding] = useState(false);

  const router = useRouter();

  // Check roles (Guest or Owner)
  const isGuest = ticket.workspace?.customers?.find((c: any) => c.userId === currentUser.id)?.role === "GUEST";
  const isOwner = ticket.workspace?.adminId === currentUser.id || ticket.creatorId === currentUser.id;

  const handleDecision = async (decision: "APPROVED" | "REJECTED") => {
    setIsDeciding(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, feedback: rejectionFeedback }),
      });
      if (res.ok) {
        setRejectModalOpen(false);
        setRejectionFeedback("");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeciding(false);
    }
  };

  const handleResubmit = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/resubmit`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };


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

    // Client-side size check (5MB for FREE/PRO, 10MB for MAX)
    const MAX_SIZE = 10 * 1024 * 1024; // We'll let server enforce plan-based limits
    if (file.size > MAX_SIZE) {
      alert(`File too large. Maximum allowed size is 10MB.`);
      return;
    }

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
        const data = await res.json();
        alert(data.error || "Failed to upload file");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 text-sm font-sans">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="flex-1 pr-3">
            {isEditing ? (
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full text-base font-bold bg-slate-50 border border-indigo-300 px-2 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 mb-2" />
            ) : (
              <h1 className="text-base font-bold text-slate-900 mb-1">{editTitle}</h1>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
               <span className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-700 font-black uppercase tracking-tighter shadow-sm text-[10px]">
                 {ticket.shortId}
               </span>
               <TicketTypeBadge type={ticket.type} category={ticket.typeCategory} professionalRole={currentUser.professionalRole} size="sm" />
               <span>In <strong className="text-slate-700">{ticket.workspace?.name}</strong></span>
               <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
               <span>By <strong className="text-slate-700">{ticket.creator?.name}</strong></span>
            </div>
          </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
            {isEditing ? (
              <>
                <button onClick={() => { setIsEditing(false); setEditTitle(ticket.title); setEditDesc(ticket.description || ""); }} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">Cancel</button>
                <button onClick={handleSaveDetails} disabled={isUpdating} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold transition-colors shadow-sm">{isUpdating ? "Saving..." : "Save"}</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">Edit</button>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
              title="Delete Ticket"
            >
              <Trash2 size={14} /> 
            </button>
          </div>
        </div>

        {/* Approval Controls */}
        {ticket.typeCategory === "CHANGE" && (
           <div className="mb-6">
              <div className={`p-4 rounded-[1.5rem] border ${
                ticket.approvalStatus === "APPROVED" ? "bg-emerald-50 border-emerald-100" : 
                ticket.approvalStatus === "REJECTED" ? "bg-rose-50 border-rose-100" : 
                "bg-amber-50 border-amber-100"
              } shadow-sm transition-all`}>
                <Group justify="apart">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        ticket.approvalStatus === "APPROVED" ? "bg-emerald-500 text-white" : 
                        ticket.approvalStatus === "REJECTED" ? "bg-rose-500 text-white" : 
                        "bg-amber-500 text-white"
                      }`}>
                         {ticket.approvalStatus === "APPROVED" ? <CheckCircle size={20} /> : 
                          ticket.approvalStatus === "REJECTED" ? <XCircle size={20} /> : 
                          <Clock size={20} />}
                      </div>
                      <div>
                        <Text size="xs" fw={800} color="dimmed" className="uppercase tracking-widest opacity-60">Approval Status</Text>
                        <Title order={4} className={`text-sm font-black uppercase tracking-tighter ${
                          ticket.approvalStatus === "APPROVED" ? "text-emerald-700" : 
                          ticket.approvalStatus === "REJECTED" ? "text-rose-700" : 
                          "text-amber-700"
                        }`}>
                          {ticket.approvalStatus}
                        </Title>
                      </div>
                   </div>

                   {/* Actions for Guest */}
                   {isGuest && ticket.approvalStatus === "PENDING" && (
                      <Group gap="sm">
                         <Button 
                            variant="light" 
                            color="red" 
                            radius="xl" 
                            size="xs" 
                            leftSection={<XCircle size={14} />}
                            onClick={() => setRejectModalOpen(true)}
                            loading={isDeciding}
                         >
                            Reject
                         </Button>
                         <Button 
                            color="dark" 
                            radius="xl" 
                            size="xs" 
                            leftSection={<CheckCircle size={14} />}
                            onClick={() => handleDecision("APPROVED")}
                            loading={isDeciding}
                         >
                            Approve
                         </Button>
                      </Group>
                   )}

                   {/* Action for Owner: Resubmit */}
                   {isOwner && ticket.approvalStatus === "REJECTED" && (
                      <Button 
                        variant="filled" 
                        color="dark" 
                        radius="xl" 
                        size="xs" 
                        leftSection={<RotateCcw size={14} />}
                        onClick={handleResubmit}
                        loading={isUpdating}
                      >
                        Resubmit for Approval
                      </Button>
                   )}
                </Group>

                {ticket.rejectionFeedback && ticket.approvalStatus === "REJECTED" && (
                  <div className="mt-3 p-3 bg-white/50 rounded-xl border border-rose-100 text-xs text-rose-800 font-medium italic">
                    <strong>Guest Feedback:</strong> "{ticket.rejectionFeedback}"
                  </div>
                )}
              </div>
           </div>
        )}

        {/* Rejection Modal */}
        <Modal 
          opened={rejectModalOpen} 
          onClose={() => setRejectModalOpen(false)} 
          title={<Text fw={900} className="uppercase tracking-tighter">Reject this Change</Text>}
          radius="2rem"
          padding="xl"
          centered
        >
          <Stack gap="md">
            <Text size="xs" color="dimmed" fw={600}>Please provide feedback to the team so they can address your concerns.</Text>
            <Textarea 
              placeholder="e.g. Please update the logo size before we proceed..." 
              value={rejectionFeedback}
              onChange={(e) => setRejectionFeedback(e.currentTarget.value)}
              minRows={4}
              radius="lg"
            />
            <Button 
              fullWidth 
              color="red" 
              radius="xl" 
              onClick={() => handleDecision("REJECTED")}
              disabled={!rejectionFeedback.trim() || isDeciding}
              loading={isDeciding}
            >
              Confirm Rejection
            </Button>
          </Stack>
        </Modal>

        {/* Status and Priority Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!isEditing || isUpdating}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50"
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">InProgress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
             <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={!isEditing || isUpdating}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50"
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
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Description</h3>
          {isEditing ? (
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={5} className="w-full text-slate-700 bg-white border border-indigo-300 px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 resize-y text-xs font-medium"></textarea>
          ) : (
            <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed opacity-90 font-medium">
              {editDesc || <span className="text-slate-400 italic">No description provided.</span>}
            </div>
          )}
        </div>

        {/* Attachments & Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-slate-100 pt-6">
            {/* Attachments */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Attachments</h3>
                <div>
                   <label className="cursor-pointer text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded transition-colors tracking-tighter">
                     {isUploading ? "..." : "+ Upload"}
                     <input type="file" className="hidden" disabled={isUploading} onChange={handleFileUpload} />
                   </label>
                </div>
              </div>
              <ul className="space-y-1.5">
                {ticket.attachments?.map((att: any) => (
                  <li key={att.id} className="flex justify-between items-center px-2 py-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-medium">
                     <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[80%]">
                        {att.fileUrl.split('/').pop()}
                     </a>
                  </li>
                ))}
                {!ticket.attachments?.length && <p className="text-[10px] text-slate-400 italic">None</p>}
              </ul>
            </div>

            {/* Linked Tickets */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Linked</h3>
              <form onSubmit={handleLinkTicket} className="flex gap-1.5 mb-3">
                 <input 
                   type="text" 
                   value={targetTicketId}
                   onChange={e => setTargetTicketId(e.target.value)}
                   placeholder="ID..." 
                   className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded outline-none focus:border-indigo-400"
                 />
                 <button type="submit" disabled={isLinking} className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 disabled:opacity-70 uppercase tracking-tighter">
                   Link
                 </button>
              </form>
              <ul className="space-y-1 text-xs">
                {ticket.linkedTo?.map((link: any) => (
                   <li key={link.target.id} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded flex items-center justify-between gap-2">
                       <span className="text-slate-400 text-[9px] uppercase font-bold shrink-0">To</span>
                       <a href={`/dashboard/tickets/${link.target.id}`} className="font-bold text-indigo-600 hover:underline truncate text-[11px]">
                          {link.target.title}
                       </a>
                   </li>
                ))}
                {ticket.linkedFrom?.map((link: any) => (
                   <li key={link.source.id} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded flex items-center justify-between gap-2">
                       <span className="text-slate-400 text-[9px] uppercase font-bold shrink-0">From</span>
                       <a href={`/dashboard/tickets/${link.source.id}`} className="font-bold text-indigo-600 hover:underline truncate text-[11px]">
                          {link.source.title}
                       </a>
                   </li>
                ))}
                {(!ticket.linkedTo?.length && !ticket.linkedFrom?.length) && (
                   <p className="text-[10px] text-slate-400 italic">None</p>
                )}
              </ul>
            </div>
        </div>
      </div>

      {/* Discussion/Comments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
           <MessageSquare size={16} className="text-slate-400" />
           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Discussion</h3>
        </div>
        
        <div className="p-4 md:p-6 space-y-4">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {ticket.comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0 text-xs">
                  {comment.user.name?.[0] || 'U'}
                </div>
                <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-baseline mb-1">
                     <p className="font-bold text-[11px] text-slate-700">{comment.user.name}</p>
                     <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
            {ticket.comments.length === 0 && <p className="text-center text-slate-400 text-xs py-4 italic">No comments yet.</p>}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
             <form onSubmit={handleAddComment} className="flex flex-col gap-2">
               <textarea
                 value={commentText}
                 onChange={(e) => setCommentText(e.target.value)}
                 className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500/30 text-xs resize-y min-h-[60px] font-medium bg-slate-50/20"
                 placeholder="Leave a comment..."
               />
               <div className="flex justify-end gap-2 flex-wrap">
                 {isEditing && (
                   <button
                     type="button"
                     onClick={handleSaveAndClose}
                     disabled={isUpdating}
                     className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors disabled:opacity-70 text-xs shadow-sm uppercase tracking-tighter"
                   >
                     {isUpdating ? "..." : "Save & Exit"}
                   </button>
                 )}
                 <button
                   type="submit"
                   disabled={isCommenting || !commentText.trim()}
                   className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors disabled:opacity-70 text-xs shadow-sm uppercase tracking-tighter"
                 >
                   <Send size={14} /> 
                   {isCommenting ? "..." : "Post"}
                 </button>
               </div>
             </form>
          </div>
        </div>
      </div>
    </div>

  );
}

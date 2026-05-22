"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import AssemblySidebar from "@/components/AssemblySidebar";
import PostCard, { PostResponse } from "@/components/PostCard";
import { useAuth } from "@/context/AuthContext";
import { Award, MessageSquare, Send, Reply, Calendar, CheckCircle2, ShieldAlert, Image as ImageIcon, MapPin } from "lucide-react";

interface CommentType {
  id: number;
  post_id: number;
  user_id?: number;
  username: string;
  user_image?: string;
  user_role: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  replies: CommentType[];
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = Number(params.id);
  const { token, user } = useAuth();
  
  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);

  // MLA Action Form States
  const [mlaReplyText, setMlaReplyText] = useState("");
  const [mlaProofUrl, setMlaProofUrl] = useState("");
  const [mlaStatusUpdate, setMlaStatusUpdate] = useState("acknowledged");
  const [submittingMla, setSubmittingMla] = useState(false);

  const fetchPostDetails = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // 1. Fetch Post Details
      const postRes = await fetch(`http://localhost:8000/api/posts/${postId}`, { headers });
      if (postRes.ok) {
        const postData = await postRes.json();
        setPost(postData);
      }

      // 2. Fetch Comments Tree
      const commentsRes = await fetch(`http://localhost:8000/api/comments/${postId}`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }
    } catch (err) {
      console.error("Error loading post details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [postId, token]);

  const handleAddComment = async (e: React.FormEvent, parentId: number | null = null) => {
    e.preventDefault();
    if (!token) {
      alert("Please sign in to write comments!");
      return;
    }

    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    try {
      const res = await fetch("http://localhost:8000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          content,
          parent_id: parentId,
        }),
      });

      if (res.ok) {
        if (parentId) {
          setReplyContent("");
          setReplyTargetId(null);
        } else {
          setNewComment("");
        }
        
        // Refresh details & comment tree
        fetchPostDetails();
      }
    } catch (err) {
      console.error("Comment submission failed:", err);
    }
  };

  const handleMlaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !post || !user) return;
    if (!mlaReplyText.trim()) return;

    setSubmittingMla(true);
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${post.id}/reply?status_update=${mlaStatusUpdate}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: mlaReplyText,
          progress_proof_url: mlaProofUrl || null,
        }),
      });

      if (res.ok) {
        setMlaReplyText("");
        setMlaProofUrl("");
        fetchPostDetails();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to submit official response.");
      }
    } catch (err) {
      console.error("MLA reply failed:", err);
    } finally {
      setSubmittingMla(false);
    }
  };

  // Determine if logged-in user is the verified MLA for this post
  const isUserMlaForPost = () => {
    if (!user || !post) return false;
    return user.role === "representative" && user.constituency_id === post.assembly_id;
  };

  // Recursive Comment Node Component
  const CommentNode: React.FC<{ comment: CommentType; depth: number }> = ({ comment, depth }) => {
    const isRep = comment.user_role === "representative";
    
    return (
      <div className="mt-4 space-y-2">
        <div className="flex gap-3">
          {/* Left Branch lines for nesting indicators */}
          {depth > 0 && (
            <div className="flex shrink-0 select-none justify-center px-1">
              <div className="w-[2px] rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          )}
          
          <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 dark:border-slate-800/40 dark:bg-slate-800/10">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <img
                  src={comment.user_image || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                  alt={comment.username}
                  className="h-5 w-5 rounded-full bg-slate-100 border border-border"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  {comment.username}
                  {isRep && (
                    <span className="inline-flex items-center rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                      MLA Rep
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {/* Reply trigger button */}
              {token && (
                <button
                  onClick={() => {
                    setReplyTargetId(comment.id);
                    setReplyContent("");
                  }}
                  className="flex items-center gap-1 font-bold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}
            </div>

            {/* Comment Body */}
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {comment.content}
            </p>

            {/* In-place reply form */}
            {replyTargetId === comment.id && (
              <form onSubmit={(e) => handleAddComment(e, comment.id)} className="mt-3 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder={`Reply to ${comment.username}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  Post
                </button>
                <button
                  type="button"
                  onClick={() => setReplyTargetId(null)}
                  className="rounded-xl border border-border px-2 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Recursive Children replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="pl-6 sm:pl-8">
            {comment.replies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-kerala-dark-bg transition-colors duration-300">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Left Navigation */}
        <AssemblySidebar />

        {/* Center Panel */}
        <section className="flex-1 max-w-2xl space-y-6">
          
          {loading && !post ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
              <p className="text-sm text-slate-500">Loading civic report details...</p>
            </div>
          ) : post ? (
            <>
              {/* Detailed Post Card */}
              <PostCard 
                post={post} 
                onPostUpdate={(updated) => setPost(updated)}
              />

              {/* Verified Representative Response details (Expanded view) */}
              {post.replies && post.replies.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-5 dark:border-emerald-950/30 dark:bg-emerald-950/5">
                  <div className="flex items-center gap-2 border-b border-emerald-100 pb-3 dark:border-emerald-950/30">
                    <Award className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-400">
                        Official Response: Acknowledged by MLA
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Response submitted by Representative {post.replies[0].representative_name}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    &ldquo;{post.replies[0].content}&rdquo;
                  </p>

                  {/* Progress Proof Image */}
                  {post.replies[0].progress_proof_url && (
                    <div className="mt-4 space-y-2">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Official Work Progress Proof
                      </span>
                      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-slate-100 max-h-60 flex items-center justify-center">
                        <img
                          src={post.replies[0].progress_proof_url}
                          alt="Progress Proof"
                          className="w-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verified MLA Representative Input Portal Panel */}
              {isUserMlaForPost() && (
                <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-lg shadow-emerald-500/[0.02]">
                  <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Award className="h-5 w-5" /> Official MLA Actions Dashboard
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Submit an official public response. Your reply is highlighted and updates the complaint resolution status.
                  </p>

                  <form onSubmit={handleMlaSubmit} className="mt-4 space-y-4">
                    {/* Action text */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Response Message
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="State your planned actions, fund allocations, PWD coordination details..."
                        value={mlaReplyText}
                        onChange={(e) => setMlaReplyText(e.target.value)}
                        className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
                      />
                    </div>

                    {/* Proof URL & Status Updates */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> Progress Proof Image URL
                        </label>
                        <input
                          type="text"
                          placeholder="Link to progress photo (e.g. road repair visual)..."
                          value={mlaProofUrl}
                          onChange={(e) => setMlaProofUrl(e.target.value)}
                          className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Action Resolution Status
                        </label>
                        <select
                          value={mlaStatusUpdate}
                          onChange={(e) => setMlaStatusUpdate(e.target.value)}
                          className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
                        >
                          <option value="acknowledged">Acknowledged (Funding/Inspection Scheduled)</option>
                          <option value="resolved">Resolved (Civic Problem Fixed completely)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <button
                        type="submit"
                        disabled={submittingMla}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                      >
                        {submittingMla ? "Publishing..." : "Publish Official Reply"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Discussions & Comment Section */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-3">
                  <MessageSquare className="h-4.5 w-4.5 text-emerald-600" />
                  Community Discussion ({comments.length > 0 ? comments.length : 0})
                </h3>

                {/* Root Comment Form */}
                {token ? (
                  <form onSubmit={(e) => handleAddComment(e, null)} className="flex gap-3">
                    <img
                      src={user?.profile_image || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                      alt="me"
                      className="h-8 w-8 rounded-full border bg-slate-50 shrink-0"
                    />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        required
                        placeholder="Add to public discussion... Share evidence or updates!"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full rounded-xl border border-border bg-slate-50 py-2 pl-4 pr-10 text-xs sm:text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
                      />
                      <button
                        type="submit"
                        className="absolute inset-y-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all"
                        aria-label="Submit comment"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center bg-slate-50/40 dark:bg-slate-800/10">
                    <p className="text-xs text-slate-500">
                      You must be signed in to post updates or join the civic discussions.
                    </p>
                    <a href="/login" className="mt-2 inline-block text-xs font-bold text-emerald-600 hover:underline">
                      Sign In Now
                    </a>
                  </div>
                )}

                {/* Recursive Comments list */}
                {comments.length > 0 ? (
                  <div className="space-y-4 divide-y divide-slate-100/60 dark:divide-slate-800/40">
                    {comments.map((comment) => (
                      <CommentNode key={comment.id} comment={comment} depth={0} />
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-xs text-slate-400 italic">
                    No discussions yet. Start the conversation!
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card py-20 text-center">
              <p className="text-slate-500">Post details could not be loaded.</p>
            </div>
          )}

        </section>

      </main>
    </div>
  );
}

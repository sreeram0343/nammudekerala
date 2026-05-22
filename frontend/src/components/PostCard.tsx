"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Award, Calendar, CheckCircle2, User as UserIcon, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { postService } from "@/services/postService";

import { PostResponse } from "@/services/postService";
export type { PostResponse };

interface PostCardProps {
  post: PostResponse;
  onPostUpdate?: (updatedPost: PostResponse) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const { token, user } = useAuth();
  const [localVote, setLocalVote] = useState<"up" | "down" | null>(null);
  const [upvotes, setUpvotes] = useState(post.upvotes_count);
  const [downvotes, setDownvotes] = useState(post.downvotes_count);
  const [toastMessage, setToastMessage] = useState("");

  // Sync initial server vote
  useEffect(() => {
    if (post.user_vote === "up") setLocalVote("up");
    else if (post.user_vote === "down") setLocalVote("down");
    else setLocalVote(null);
    
    setUpvotes(post.upvotes_count);
    setDownvotes(post.downvotes_count);
  }, [post]);

  const handleVote = async (type: "up" | "down") => {
    if (!token) {
      showToast("Authentication required to vote on issues!");
      return;
    }

    let nextVote: "up" | "down" | "none" = type;
    if (localVote === type) {
      // Toggle off
      nextVote = "none";
    }

    try {
      const data = await postService.submitVote(post.id, nextVote);
      setLocalVote(nextVote === "none" ? null : nextVote);
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      
      if (onPostUpdate) {
        onPostUpdate({
          ...post,
          upvotes_count: data.upvotes,
          downvotes_count: data.downvotes,
          user_vote: nextVote === "none" ? null : nextVote,
        });
      }
    } catch (err) {
      console.error("Voting failed:", err);
    }
  };

  const copyShareLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    showToast("Link copied to clipboard! Share on WhatsApp!");
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Get color for issue category badge
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "roads": return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      case "water": return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30";
      case "waste": return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "flooding": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      case "corruption": return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
      default: return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/30";
    }
  };

  // Get status color tag
  const getStatusDetails = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return { text: "Resolved", style: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400" };
      case "acknowledged":
        return { text: "MLA Acknowledged", style: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400" };
      default:
        return { text: "Reported", style: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400" };
    }
  };

  const statusInfo = getStatusDetails(post.status);
  const mlaReply = post.replies && post.replies.length > 0 ? post.replies[0] : null;

  return (
    <article className="relative rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-300">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl dark:bg-emerald-600">
          {toastMessage}
        </div>
      )}

      <div className="flex gap-4">
        {/* Voting System Column (Left side like Reddit) */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 p-1 dark:bg-slate-800/40 h-fit">
          <button
            onClick={() => handleVote("up")}
            className={`rounded-lg p-1 transition-all ${
              localVote === "up" 
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 scale-110" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            aria-label="Upvote"
          >
            <ArrowBigUp className="h-6 w-6 fill-current" />
          </button>
          
          <span className={`text-xs font-bold ${
            localVote === "up" 
              ? "text-emerald-600 dark:text-emerald-400" 
              : localVote === "down" 
                ? "text-red-500" 
                : "text-slate-600 dark:text-slate-300"
          }`}>
            {upvotes - downvotes}
          </span>
          
          <button
            onClick={() => handleVote("down")}
            className={`rounded-lg p-1 transition-all ${
              localVote === "down" 
                ? "text-red-500 bg-red-50 dark:bg-red-950/20 scale-110" 
                : "text-slate-400 hover:text-red-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            aria-label="Downvote"
          >
            <ArrowBigDown className="h-6 w-6 fill-current" />
          </button>
        </div>

        {/* Content Column */}
        <div className="flex-1 space-y-2">
          {/* Header Row: User info, timestamp, category */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <img
                src={post.user_image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Ac"}
                alt={post.username}
                className="h-6 w-6 rounded-full border border-border"
              />
              <span className={`font-semibold ${post.is_anonymous ? "italic text-slate-400" : "text-slate-700 dark:text-slate-300"}`}>
                {post.username}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(post.created_at).toLocaleDateString("en-IN", { 
                  day: "numeric", 
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 font-semibold text-[10px] ${statusInfo.style}`}>
                {statusInfo.text}
              </span>
              <span className={`rounded-full border px-2 py-0.5 font-semibold text-[10px] ${getCategoryColor(post.category)}`}>
                {post.category}
              </span>
            </div>
          </div>

          {/* Post Title */}
          <div>
            <Link href={`/posts/${post.id}`}>
              <h2 className="text-base font-bold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                {post.title}
              </h2>
            </Link>
            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500">
              Tag: 
              <Link href={`/assembly/${post.assembly_slug}`} className="hover:underline ml-1">
                @{post.assembly_name} Constituency
              </Link>
            </p>
          </div>

          {/* Post Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
            {post.content}
          </p>

          {/* Media Attachment */}
          {post.media_url && (
            <div className="overflow-hidden rounded-xl border border-border bg-slate-100 max-h-60 flex items-center justify-center">
              <img
                src={post.media_url}
                alt="Civic Issue Proof"
                className="w-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Verified Representative Response Highlight */}
          {mlaReply && (
            <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-950/30 dark:bg-emerald-950/10">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-400 text-xs">
                <Award className="h-4 w-4 text-emerald-600" />
                Verified Reply from {mlaReply.representative_name}
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-700/60 dark:text-emerald-500/60 font-normal">
                  <Clock className="h-3 w-3" />
                  {new Date(mlaReply.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-2">
                &ldquo;{mlaReply.content}&rdquo;
              </p>
              {mlaReply.progress_proof_url && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Progress Proof Attached
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Bottom Toolbar */}
          <div className="flex items-center gap-4 border-t border-slate-100 pt-2 dark:border-slate-800/60 text-xs text-slate-500 font-semibold">
            <Link 
              href={`/posts/${post.id}`} 
              className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{post.comments_count} Comments</span>
            </Link>

            <button 
              onClick={copyShareLink}
              className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
export default PostCard;

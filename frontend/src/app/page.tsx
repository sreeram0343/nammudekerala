"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AssemblySidebar from "@/components/AssemblySidebar";
import PostCard, { PostResponse } from "@/components/PostCard";
import CreatePostModal from "@/components/CreatePostModal";
import { useAuth } from "@/context/AuthContext";
import { PlusCircle, Flame, AlertCircle, RefreshCw, BarChart2, Radio, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { postService } from "@/services/postService";
import { assemblyService } from "@/services/assemblyService";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Home() {
  const { token, user } = useAuth();
  
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [sort, setSort] = useState("trending");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [wsMessage, setWsMessage] = useState<{ type: string; title: string; mla_name?: string; assembly_name?: string } | null>(null);

  // Dynamic stats & leaderboards
  const [globalStats, setGlobalStats] = useState<{
    total_issues: number;
    resolved_issues: number;
    acknowledged_issues: number;
    reported_issues: number;
    resolution_rate: number;
    active_hotspot: string;
  } | null>(null);
  const [ignoredPosts, setIgnoredPosts] = useState<PostResponse[]>([]);

  // List of standard categories
  const categories = [
    { id: "all", name: "All Issues", value: "" },
    { id: "roads", name: "Roads & Potholes", value: "Roads" },
    { id: "waste", name: "Waste & Garbage", value: "Waste" },
    { id: "water", name: "Water Supply", value: "Water" },
    { id: "flooding", name: "Flooding & Drains", value: "Flooding" },
    { id: "corruption", name: "Bribery & Corruption", value: "Corruption" }
  ];

  const fetchGlobalStats = async () => {
    try {
      const data = await assemblyService.getGlobalStats();
      setGlobalStats(data);
    } catch (err) {
      console.error("Error loading global stats:", err);
    }
  };

  const fetchIgnoredPosts = async () => {
    try {
      const data = await postService.getPosts(undefined, undefined, "ignored");
      setIgnoredPosts(data.slice(0, 3));
    } catch (err) {
      console.error("Error loading ignored posts:", err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await postService.getPosts(undefined, selectedCategory || undefined, sort);
      setPosts(data);
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchGlobalStats();
    fetchIgnoredPosts();
  }, [sort, selectedCategory, token]);

  // WebSocket Live Notification Setup using custom hook
  useWebSocket((data) => {
    setWsMessage(data as any);
    
    // Auto-hide alert after 5 seconds
    setTimeout(() => {
      setWsMessage(null);
    }, 5000);
    
    // Proactively refresh posts in background
    fetchPosts();
    fetchGlobalStats();
    fetchIgnoredPosts();
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-kerala-dark-bg transition-colors duration-300">
      <Navbar />

      {/* Main Grid Wrapper */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        
        {/* Left Sidebar - Hidden on mobile, shown as top section or toggleable later */}
        <div className="hidden lg:block">
          <AssemblySidebar currentSort={sort} onSortChange={(s) => setSort(s)} />
        </div>

        {/* Center Posts Feed */}
        <section className="w-full flex-1 lg:max-w-2xl space-y-6">
          
          {/* WebSocket Broadcast Banner */}
          {wsMessage && (
            <div className="animate-in slide-in-from-top-4 flex items-center gap-3 rounded-2xl bg-emerald-600 p-4 text-white shadow-xl">
              <span className="flex h-7 w-7 animate-pulse items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Radio className="h-4 w-4" />
              </span>
              <div className="flex-1 text-xs">
                <span className="font-bold">LIVE FEED UPDATE: </span>
                {wsMessage.type === "new_post" ? (
                  <span>New civic issue reported at @{wsMessage.assembly_name} - &ldquo;{wsMessage.title}&rdquo;</span>
                ) : (
                  <span>Verified response from {wsMessage.mla_name} on &ldquo;{wsMessage.title}&rdquo;</span>
                )}
              </div>
              <button 
                onClick={() => fetchPosts()}
                className="rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-white/30"
              >
                Refresh
              </button>
            </div>
          )}

          {/* Welcome Onboarding Card */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-slate-50 dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-slate-900 p-6 shadow-sm transition-all hover:shadow-md duration-300">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="relative">
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <span>Welcome to Nammude Kerala</span>
                <span className="animate-bounce">🌾</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Empowering Kerala's citizens to voice local concerns, tag assembly representatives, and track civic resolutions transparently.
              </p>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-card/60 backdrop-blur-md border border-border p-3 hover:scale-[1.02] transition-all duration-200">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-xs font-black text-emerald-600 dark:text-emerald-400">1</div>
                  <h3 className="text-xs font-bold text-foreground mt-2">Claim Profile</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">Register and link your home assembly constituency.</p>
                </div>
                
                <div className="rounded-2xl bg-card/60 backdrop-blur-md border border-border p-3 hover:scale-[1.02] transition-all duration-200">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-xs font-black text-emerald-600 dark:text-emerald-400">2</div>
                  <h3 className="text-xs font-bold text-foreground mt-2">Track & Follow</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">Search and follow any of the 140 Kerala assembly hubs.</p>
                </div>
                
                <div className="rounded-2xl bg-card/60 backdrop-blur-md border border-border p-3 hover:scale-[1.02] transition-all duration-200">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-xs font-black text-emerald-600 dark:text-emerald-400">3</div>
                  <h3 className="text-xs font-bold text-foreground mt-2">Voice & Resolve</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">Report road potholes, flooding, or waste, and tag your MLA.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tagline / Action Box */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-bold text-foreground">
              Tag your assembly, hold representatives accountable.
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Post local problems (potholes, flooding, public bribery) and tag your constituency to bring public pressure.
            </p>
            
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (!user) {
                    window.location.href = "/login";
                  } else {
                    setIsPostModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/10"
              >
                <PlusCircle className="h-4 w-4" />
                Report An Issue
              </button>
              
              <Link 
                href="/explore"
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                🌍 Explore Hotspots Map
              </Link>
            </div>
          </div>

          {/* Horizontally scrollable categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.value)}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === cat.value
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                    : "border-border bg-card text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort Tabs (Only visible if not "ignored" feed which has its own routing style) */}
          {sort !== "ignored" && (
            <div className="flex items-center gap-4 border-b border-border pb-2 text-sm text-slate-500 font-bold">
              <button
                onClick={() => setSort("trending")}
                className={`flex items-center gap-1 border-b-2 px-1 pb-2 transition-all ${
                  sort === "trending"
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent hover:text-foreground"
                }`}
              >
                <Flame className="h-4 w-4" />
                Trending
              </button>
              <button
                onClick={() => setSort("new")}
                className={`flex items-center gap-1 border-b-2 px-1 pb-2 transition-all ${
                  sort === "new"
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent hover:text-foreground"
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Recent
              </button>
            </div>
          )}

          {sort === "ignored" && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-800 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <div className="text-xs">
                <span className="font-bold">Most Ignored:</span> Displaying issues with over 10 upvotes that have received absolutely no verified representative replies yet.
              </div>
            </div>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
              <p className="text-sm text-slate-500">Loading Kerala civic feed...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  onPostUpdate={(updated) => {
                    setPosts(posts.map((p) => p.id === updated.id ? updated : p));
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card py-20 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold">No civic issues reported under this filter yet.</p>
              <p className="text-xs text-slate-400 mt-1">Be the first to raise a civic problem in your neighborhood!</p>
              <button 
                onClick={() => setIsPostModalOpen(true)}
                className="mt-4 rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Report First Issue
              </button>
            </div>
          )}
        </section>

        {/* Right Sidebar - Kerala Civic Insights */}
        <section className="hidden w-80 shrink-0 space-y-6 lg:block">
          {/* Daily Insight Box */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <BarChart2 className="h-4.5 w-4.5 text-emerald-600" />
              Kerala Today
            </h3>
            {globalStats ? (
              <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="font-medium">Total Reported Issues</span>
                  <span className="font-bold text-foreground">{globalStats.total_issues}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="font-medium">Acknowledged by MLAs</span>
                  <span className="font-bold text-blue-600">{globalStats.acknowledged_issues}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="font-medium">Resolved Publicly</span>
                  <span className="font-bold text-emerald-600">{globalStats.resolved_issues}</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="font-medium">Resolution Success Rate</span>
                  <span className="font-bold text-emerald-600 text-sm">{globalStats.resolution_rate}%</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                <p className="text-[11px] text-slate-400">Loading civic analytics...</p>
              </div>
            )}
            
            <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40 text-[11px] text-slate-500">
              ⚡ <span className="font-bold">Active Hotspot:</span> {globalStats ? globalStats.active_hotspot : "Loading activity stats..."}
            </div>
          </div>

          {/* Most Ignored Sidebar Mini Leaderboard */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-red-500" />
              Urgent Attention Required
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Highly supported citizen complaints with zero official answers.
            </p>
            
            <div className="mt-3 space-y-3">
              {ignoredPosts.length > 0 ? (
                ignoredPosts.map((post) => (
                  <div key={post.id} className="rounded-xl border border-slate-100 p-2.5 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-800 dark:bg-red-950/20 dark:text-red-400">
                        {post.upvotes_count} Upvotes
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <Link href={`/posts/${post.id}`}>
                      <h4 className="mt-1.5 text-xs font-bold text-foreground hover:text-emerald-600 transition-colors line-clamp-1">
                        {post.title}
                      </h4>
                    </Link>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      <Link href={`/assembly/${post.assembly_slug}`} className="hover:underline">
                        @{post.assembly_name} Constituency
                      </Link>
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-6 px-4 text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-foreground">All Quiet in Kerala!</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">No citizen complaints are currently left unresolved with over 10 upvotes.</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Creation Modal */}
      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onPostCreated={() => {
          fetchPosts();
        }}
      />
    </div>
  );
}

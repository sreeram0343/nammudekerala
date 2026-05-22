"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import AssemblySidebar from "@/components/AssemblySidebar";
import PostCard, { PostResponse } from "@/components/PostCard";
import CreatePostModal from "@/components/CreatePostModal";
import { MapPin, User as UserIcon, CheckCircle, BarChart2, Heart, Award, ShieldAlert, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { assemblyService } from "@/services/assemblyService";
import { postService } from "@/services/postService";

interface AssemblyStats {
  id: number;
  assembly_name: string;
  district: string;
  slug: string;
  constituency_type: string;
  mla_name: string;
  mla_verified: boolean;
  total_issues: number;
  resolved_issues: number;
  acknowledged_issues: number;
  ignored_issues: number;
  resolution_rate: number;
}

export default function AssemblyPage() {
  const params = useParams();
  const rawName = params.name as string;
  const decodedName = decodeURIComponent(rawName);
  const { token, user } = useAuth();
  
  const [stats, setStats] = useState<AssemblyStats | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const fetchAssemblyData = async () => {
    setLoading(true);
    try {
      // 1. Fetch assembly stats using assemblyService
      const statsData = await assemblyService.getAssemblyStats(decodedName);
      setStats(statsData as any);

      // 2. Fetch assembly posts using postService
      const postsData = await postService.getPosts(decodedName, undefined, "trending");
      setPosts(postsData);
    } catch (err) {
      console.error("Error loading assembly page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssemblyData();

    // Check if this assembly is followed
    const followed = localStorage.getItem("nk_followed");
    if (followed) {
      const list = JSON.parse(followed) as string[];
      setIsFollowed(list.includes(decodedName));
    }
  }, [decodedName, token]);

  const handleFollowToggle = () => {
    const followed = localStorage.getItem("nk_followed");
    let list: string[] = [];
    if (followed) {
      list = JSON.parse(followed);
    }

    if (isFollowed) {
      list = list.filter((name) => name !== decodedName);
      setIsFollowed(false);
    } else {
      list.push(decodedName);
      setIsFollowed(true);
    }
    
    localStorage.setItem("nk_followed", JSON.stringify(list));
    // Dispatch standard storage event to trigger sidebar refresh
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-kerala-dark-bg transition-colors duration-300">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Left Sidebar */}
        <AssemblySidebar />

        {/* Center Panel */}
        <section className="flex-1 max-w-2xl space-y-4">
          
          {/* Loading placeholder */}
          {loading && !stats ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
              <p className="text-sm text-slate-500">Loading @{decodedName} constituency...</p>
            </div>
          ) : stats ? (
            <>
              {/* Assembly Header & Dashboard Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left Column: Constituency Name and District */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <MapPin className="h-3 w-3" /> {stats.district} District
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
                        🏛️ {stats.constituency_type} Seat
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-foreground mt-1.5">
                      @{stats.assembly_name} Constituency
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Official civic discussion portal and public feedback board.
                    </p>
                  </div>

                  {/* Right Column: Follow Button */}
                  <button
                    onClick={handleFollowToggle}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all border active:scale-95 ${
                      isFollowed
                        ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        : "bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-md shadow-emerald-600/10"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFollowed ? "fill-red-500 text-red-500" : ""}`} />
                    {isFollowed ? "Following Constituency" : "Follow Constituency"}
                  </button>
                </div>

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4 text-center">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Issues</p>
                    <p className="text-lg font-black text-foreground">{stats.total_issues}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Resolved</p>
                    <p className="text-lg font-black text-emerald-600">{stats.resolved_issues}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Resolution</p>
                    <p className="text-lg font-black text-emerald-600">{stats.resolution_rate}%</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Unacknowledged</p>
                    <p className="text-lg font-black text-red-500">{stats.ignored_issues}</p>
                  </div>
                </div>

                {/* Official Representative MLA Profile banner */}
                {stats.mla_name ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50/50 p-4 dark:bg-slate-800/20">
                    <div className="relative">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stats.mla_name}`}
                        alt={stats.mla_name}
                        className="h-12 w-12 rounded-xl border border-emerald-500/20 bg-slate-100"
                      />
                      {stats.mla_verified && (
                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm" title="Verified MLA Profile">
                          <CheckCircle className="h-3 w-3 fill-current text-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        <Award className="h-2.5 w-2.5" /> Legislative Representative
                      </span>
                      <h3 className="text-sm font-bold text-foreground mt-0.5">
                        {stats.mla_name}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Member of the Legislative Assembly (MLA)
                      </p>
                    </div>
                    
                    {stats.mla_verified ? (
                      <div className="hidden sm:block text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          🟢 Active Responder
                        </span>
                        <p className="text-[9px] text-slate-400 mt-0.5">Monitors & replies to posts</p>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                          🔴 Unverified Account
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-slate-350 dark:border-slate-800 bg-slate-50/50 p-4 dark:bg-slate-800/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400">
                        <UserIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                          ⚠️ Seat Profile Unclaimed
                        </span>
                        <h3 className="text-xs font-bold text-foreground mt-0.5">
                          Representative Profile Unclaimed
                        </h3>
                        <p className="text-[10px] text-slate-500 leading-normal max-w-xs sm:max-w-sm mt-0.5">
                          The official MLA profile for @{stats.assembly_name} is currently vacant. Share this board with your representative to enable verified civic replies!
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        alert("To claim this official MLA seat, please contact representative-verify@nammudekerala.org from your official email domain.");
                      }}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Claim MLA Seat
                    </button>
                  </div>
                )}
              </div>

              {/* Action Box to create post */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Have a problem in @{stats.assembly_name}?</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Your post will automatically be tagged to this assembly.</p>
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      window.location.href = "/login";
                    } else {
                      setIsPostModalOpen(true);
                    }
                  }}
                  className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/10"
                >
                  Report Issue
                </button>
              </div>

              {/* Assembly Feed Title */}
              <div className="border-b border-border pb-2">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Civic Reports Feed
                </h3>
              </div>

              {/* Posts Feed List */}
              {posts.length > 0 ? (
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
                  <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold">No civic complaints reported under @{stats.assembly_name} yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Be the first to report local potholes, flooding, or waste issues!</p>
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="mt-4 rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Report First Issue
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card py-20 text-center">
              <p className="text-slate-500">Assembly constituency could not be loaded.</p>
            </div>
          )}

        </section>

      </main>

      {/* Creation Modal */}
      {stats && (
        <CreatePostModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onPostCreated={() => {
            fetchAssemblyData();
          }}
        />
      )}
    </div>
  );
}

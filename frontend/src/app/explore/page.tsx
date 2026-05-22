"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import AssemblySidebar from "@/components/AssemblySidebar";
import { Compass, Info, Map, Layers, HelpCircle } from "lucide-react";
import { postService } from "@/services/postService";

// Import MapHotspots dynamically with SSR disabled to prevent Leaflet window reference errors
const MapHotspots = dynamic(() => import("@/components/MapHotspots").then((mod) => mod.MapHotspots), {
  ssr: false,
  loading: () => (
    <div className="flex h-[550px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-slate-900/5 text-slate-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mb-4" />
      <p className="text-sm font-semibold">Initializing Kerala Interactive Map...</p>
    </div>
  )
});

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  status: string;
  latitude?: number;
  longitude?: number;
  assembly_name: string;
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [
    { id: "all", name: "All Hotspots", value: "" },
    { id: "roads", name: "Roads & Potholes", value: "Roads" },
    { id: "waste", name: "Garbage & Waste", value: "Waste" },
    { id: "water", name: "Water Leaks", value: "Water" },
    { id: "flooding", name: "Flooding & Drains", value: "Flooding" },
    { id: "corruption", name: "Public Corruption", value: "Corruption" }
  ];

  useEffect(() => {
    const fetchAllPosts = async () => {
      setLoading(true);
      try {
        const data = await postService.getPosts(undefined, selectedCategory || undefined, "new");
        setPosts(data as any);
      } catch (err) {
        console.error("Error loading map posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, [selectedCategory]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-kerala-dark-bg transition-colors duration-300">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Left Sidebar Navigation */}
        <AssemblySidebar />

        {/* Explore Interactive Map Area */}
        <section className="flex-1 space-y-4">
          
          {/* Header Card */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-600" />
              Kerala Civic Hotspots Map
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Visualize unresolved local civic reports across the state. Click on any color-coded marker to view immediate popup details and navigate directly to the community discussion thread.
            </p>
          </div>

          {/* Map Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.value)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === cat.value
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "border-border bg-card text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* The Dynamic Map Component */}
          <div className="relative">
            {loading ? (
              <div className="flex h-[550px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-slate-900/5 text-slate-500">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mb-4" />
                <p className="text-sm font-semibold">Updating Hotspots Overlay...</p>
              </div>
            ) : (
              <MapHotspots posts={posts} />
            )}
          </div>

          {/* Map Legend Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            
            {/* Color Scheme Legends */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-3">
                <Layers className="h-4 w-4" /> Marker Categories Legend
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: "#f59e0b" }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Roads & Potholes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: "#0ea5e9" }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Water Leaks / Scarcity</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: "#10b981" }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Waste Dumping</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: "#3b82f6" }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Flooding & Drains</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <span className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: "#a855f7" }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Public Corruption & Bribery Reports</span>
                </div>
              </div>
            </div>

            {/* Quick Map Guide */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
                  <HelpCircle className="h-4 w-4" /> Quick Map Guide
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                  Citizen reports are pinned using GPS coordinates. If an issue is reported without coordinate tags, our system auto-centers it on the constituency headquarters to guarantee centralized visibility!
                </p>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-2.5 text-[11px] text-slate-500 flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zoom into cities like Trivandrum, Kochi, or Kozhikode to resolve overlapping markers and inspect individual street complaints.</span>
              </div>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}

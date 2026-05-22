"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, AlertOctagon, CheckSquare, Sparkles, MapPin, Plus, Heart } from "lucide-react";
import { assemblyService } from "@/services/assemblyService";

interface SidebarProps {
  currentSort?: string;
  onSortChange?: (sort: string) => void;
}

export const AssemblySidebar: React.FC<SidebarProps> = ({ currentSort, onSortChange }) => {
  const pathname = usePathname();
  const [allAssemblies, setAllAssemblies] = useState<{ id: number; assembly_name: string; district: string; slug: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [followedAssemblies, setFollowedAssemblies] = useState<string[]>([]);

  useEffect(() => {
    // Fetch all 140 constituencies using assemblyService
    assemblyService.getAssemblies()
      .then((data) => {
        setAllAssemblies(data);
      })
      .catch((err) => console.error("Error fetching assemblies in sidebar:", err));

    // Load followed assemblies from local storage
    const stored = localStorage.getItem("nk_followed");
    if (stored) {
      setFollowedAssemblies(JSON.parse(stored));
    }
  }, []);

  const handleUnfollow = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    const updated = followedAssemblies.filter((a) => a !== name);
    localStorage.setItem("nk_followed", JSON.stringify(updated));
    setFollowedAssemblies(updated);
    // Dispatch standard storage event to update followed states in other components
    window.dispatchEvent(new Event("storage"));
  };

  // Filter assemblies based on search query
  const displayedAssemblies = searchQuery.trim() === ""
    ? allAssemblies.filter((a) => 
        ["Kazhakuttom", "Kochi", "Kalamassery", "Neyyattinkara", "Dharmadam", "Kozhikode North"].includes(a.assembly_name)
      ).slice(0, 6)
    : allAssemblies.filter((a) => 
        a.assembly_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.district.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8);

  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto pb-4 pr-2 lg:block">
      {/* Feeds Section */}
      <div className="space-y-1">
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Civic Feeds
        </h3>
        
        <Link
          href="/"
          onClick={() => onSortChange && onSortChange("trending")}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
            pathname === "/" && currentSort === "trending"
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Home className="h-5 w-5" />
          Home Feed (Trending)
        </Link>

        <Link
          href="/"
          onClick={() => onSortChange && onSortChange("new")}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
            pathname === "/" && currentSort === "new"
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles className="h-5 w-5" />
          Recent Complaints
        </Link>

        <Link
          href="/"
          onClick={() => onSortChange && onSortChange("ignored")}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
            pathname === "/" && currentSort === "ignored"
              ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <AlertOctagon className="h-5 w-5" />
          Most Ignored Issues
          <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            HOT
          </span>
        </Link>

        <Link
          href="/explore"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
            pathname === "/explore"
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Compass className="h-5 w-5" />
          Interactive Issue Map
        </Link>
      </div>

      <hr className="my-6 border-border" />

      {/* Followed Assemblies */}
      <div className="space-y-2">
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> My Constituencies
        </h3>
        {followedAssemblies.length > 0 ? (
          <ul className="space-y-1">
            {followedAssemblies.map((name) => {
              // Try to find the slug for followed assembly, fallback to name in lowercase
              const match = allAssemblies.find(a => a.assembly_name.toLowerCase() === name.toLowerCase());
              const routeSlug = match ? match.slug : name.toLowerCase();
              return (
                <li key={name}>
                  <Link
                    href={`/assembly/${routeSlug}`}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      pathname === `/assembly/${routeSlug}` ? "bg-slate-100 dark:bg-slate-800 font-bold" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      @{name}
                    </span>
                    <button
                      onClick={(e) => handleUnfollow(name, e)}
                      className="hidden text-xs text-red-500 hover:underline group-hover:block"
                    >
                      Leave
                    </button>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-3 py-2 text-xs italic text-slate-400 dark:text-slate-500">
            No assemblies followed.
          </p>
        )}
      </div>

      <hr className="my-6 border-border" />

      {/* Popular/Search assemblies */}
      <div className="space-y-2">
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {searchQuery ? "Search Results" : "Explore Assemblies"}
        </h3>
        
        {/* Sleek Search Input */}
        <div className="px-3">
          <input
            type="text"
            placeholder="🔍 Search 140 constituencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800/40 px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none mb-2 transition-all"
          />
        </div>

        <ul className="space-y-1">
          {displayedAssemblies.map((asm) => (
            <li key={asm.id}>
              <Link
                href={`/assembly/${asm.slug}`}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  pathname === `/assembly/${asm.slug}` ? "bg-slate-100 dark:bg-slate-800 font-bold" : ""
                }`}
              >
                <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-xs font-bold text-foreground">@{asm.assembly_name}</p>
                  <p className="text-[9px] text-slate-400">{asm.district} District</p>
                </div>
              </Link>
            </li>
          ))}
          {displayedAssemblies.length === 0 && (
            <p className="px-3 py-2 text-xs italic text-slate-400">No constituencies match your search.</p>
          )}
        </ul>
      </div>
    </aside>
  );
};
export default AssemblySidebar;

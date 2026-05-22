"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sun, Moon, Search, MapPin, LogOut, User as UserIcon, ShieldAlert } from "lucide-react";
import { assemblyService } from "@/services/assemblyService";

export const Navbar: React.FC = () => {
  const { user, logout, selectedAssembly, setSelectedAssembly } = useAuth();
  const [allAssemblies, setAllAssemblies] = useState<{ id: number; assembly_name: string; district: string; slug: string }[]>([]);
  // Use local state alias to retain filtered list logic below
  const [assemblies, setAssemblies] = useState<{ id: number; assembly_name: string; district: string; slug: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load assemblies for search dropdown
  useEffect(() => {
    assemblyService.getAssemblies()
      .then((data) => {
        setAllAssemblies(data);
        setAssemblies(data);
      })
      .catch((err) => console.error("Error loading assemblies in navbar:", err));
      
    // Sync dark mode state from document class
    if (typeof window !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleDarkMode = () => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
        localStorage.setItem("theme", "light");
        setIsDarkMode(false);
      } else {
        root.classList.add("dark");
        localStorage.setItem("theme", "dark");
        setIsDarkMode(true);
      }
    }
  };

  const filteredAssemblies = assemblies.filter((asm) =>
    asm.assembly_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asm.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/20">
              ന
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">
                Nammude Kerala
              </h1>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                Reddit for Kerala Civic Issues
              </p>
            </div>
          </Link>
        </div>

        {/* Search / Constituency Selector Dropdown */}
        <div className="relative hidden max-w-md flex-1 px-12 md:block">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search assemblies (e.g. Kazhakuttom)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full rounded-xl border border-border bg-slate-100 py-2 pl-10 pr-4 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800 dark:focus:bg-slate-900 transition-all duration-200"
            />
            {showDropdown && (searchTerm || filteredAssemblies.length > 0) && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <ul className="absolute left-0 mt-2 z-20 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-2xl">
                  <li className="px-3 py-1.5 text-xs font-semibold text-slate-500">
                    Kerala Assembly Constituencies
                  </li>
                  {filteredAssemblies.slice(0, 8).map((asm) => (
                    <li key={asm.id}>
                      <Link
                        href={`/assembly/${asm.slug}`}
                        onClick={() => {
                          setSelectedAssembly(asm.assembly_name);
                          setShowDropdown(false);
                          setSearchTerm("");
                        }}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="font-medium text-foreground">@{asm.assembly_name}</p>
                          <p className="text-xs text-slate-500">{asm.district} District</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                  {filteredAssemblies.length === 0 && (
                    <li className="px-3 py-4 text-center text-sm text-slate-500">
                      No constituency found
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-4">
          {/* Map Icon Link */}
          <Link
            href="/explore"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Explore Civic Map"
          >
            <MapPin className="h-5 w-5" />
          </Link>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                  {user.username}
                  {user.role === "representative" && (
                    <span className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Verified MLA
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
              <img
                src={user.profile_image || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}
                alt={user.username}
                className="h-10 w-10 rounded-xl border border-emerald-500/20 bg-slate-100"
              />
              <button
                onClick={logout}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/10"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;

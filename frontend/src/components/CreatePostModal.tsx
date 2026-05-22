"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Shield, Image as ImageIcon, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const { token, user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Roads");
  const [assemblyTag, setAssemblyTag] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [assemblies, setAssemblies] = useState<{ id: number; assembly_name: string }[]>([]);
  
  // Unsplash presets for testing to make the demo beautiful instantly
  const presets = [
    { name: "Pothole / Road damage", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop" },
    { name: "Waste / Garbage dumping", url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600&auto=format&fit=crop" },
    { name: "Flooded street / Waterlogging", url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=600&auto=format&fit=crop" },
    { name: "Water leak / Pipe burst", url: "https://images.unsplash.com/photo-1514730071087-0babd903dcb1?q=80&w=600&auto=format&fit=crop" }
  ];

  useEffect(() => {
    if (isOpen) {
      fetch("http://localhost:8000/api/assemblies")
        .then((res) => res.json())
        .then((data) => {
          setAssemblies(data);
          // Set default assembly to user's constituency if available
          if (user && user.constituency_id) {
            const found = data.find((a: any) => a.id === user.constituency_id);
            if (found) setAssemblyTag(found.assembly_name);
          } else {
            setAssemblyTag(data[0]?.assembly_name || "");
          }
        })
        .catch((err) => console.error("Error loading assemblies:", err));
    }
  }, [isOpen, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMediaUrl(data.url);
      }
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          category,
          assembly_tag: assemblyTag,
          is_anonymous: isAnonymous,
          media_url: mediaUrl || null,
        }),
      });

      if (res.ok) {
        onPostCreated();
        setTitle("");
        setContent("");
        setMediaUrl("");
        setIsAnonymous(false);
        onClose();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to create post. Please try again.");
      }
    } catch (err) {
      console.error("Post creation error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            🚨 Report a Civic Issue
          </h2>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Issue Headline
            </label>
            <input
              type="text"
              required
              placeholder="E.g., Large pothole at Technopark bypass curve..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
            />
          </div>

          {/* District Selector & Category Selector */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Target Assembly Constituency
              </label>
              <select
                value={assemblyTag}
                onChange={(e) => setAssemblyTag(e.target.value)}
                className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
              >
                {assemblies.map((asm) => (
                  <option key={asm.id} value={asm.assembly_name}>
                    @{asm.assembly_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Problem Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
              >
                <option value="Roads">Roads & Potholes</option>
                <option value="Waste">Waste Dumping & Garbage</option>
                <option value="Water">Water Supply & Leakage</option>
                <option value="Electricity">Electricity & Streetlights</option>
                <option value="Flooding">Flooding & Drainage</option>
                <option value="Corruption">Public Bribery & Corruption</option>
                <option value="Traffic">Traffic & Safety</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Detailed Description
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide exact details of the location, why it is dangerous, and what actions you expect from authorities..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2 text-sm text-foreground focus:border-emerald-500 focus:bg-card focus:outline-none dark:bg-slate-800/40"
            />
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Attach Proof (Photos/Videos)
            </label>
            <div className="flex gap-4">
              {/* File Uploader */}
              <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50 p-4 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 transition-colors">
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-500">
                  {uploading ? "Uploading to server..." : "Upload local image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {/* Preset Selector */}
              <div className="flex-1 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Or pick a beautiful preset
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setMediaUrl(p.url)}
                      className={`rounded-lg border p-1 text-[10px] font-semibold text-left truncate transition-colors ${
                        mediaUrl === p.url
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {mediaUrl && (
              <div className="relative mt-2 overflow-hidden rounded-xl border border-border h-36 flex items-center justify-center bg-slate-100">
                <img
                  src={mediaUrl}
                  alt="Proof Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setMediaUrl("")}
                  className="absolute top-2 right-2 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-900/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Anonymity Checkbox */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-slate-50 p-3 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-foreground">Post Anonymously</p>
                <p className="text-[10px] text-slate-400">
                  Protect your identity for corruption reports or sensitive issues.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50"
            >
              Submit Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreatePostModal;

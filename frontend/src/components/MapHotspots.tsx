"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";

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

interface MapHotspotsProps {
  posts: Post[];
}

export const MapHotspots: React.FC<MapHotspotsProps> = ({ posts }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if it doesn't exist
    if (!leafletMap.current) {
      // Coordinates centering Kerala: Latitude ~10.5, Longitude ~76.5
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([10.15, 76.6], 7.5);

      // Add Voyager themed map layer which fits modern UI perfectly
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 18,
      }).addTo(leafletMap.current);
    }

    const map = leafletMap.current;

    // Clear any existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Category hex color mapping
    const getCategoryColor = (cat: string) => {
      switch (cat.toLowerCase()) {
        case "roads": return "#f59e0b";      // Amber
        case "water": return "#0ea5e9";      // Sky Blue
        case "waste": return "#10b981";      // Emerald Green
        case "flooding": return "#3b82f6";   // Blue
        case "corruption": return "#a855f7"; // Purple
        default: return "#64748b";           // Slate Gray
      }
    };

    // Populate markers
    posts.forEach((post) => {
      if (post.latitude && post.longitude) {
        const markerColor = getCategoryColor(post.category);
        
        // Render sleek custom circular div markers instead of default blue pins
        const icon = L.divIcon({
          className: "custom-marker-wrapper",
          html: `<div class="custom-marker" style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); display: flex; items-center justify-content: center; color: white; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -15]
        });

        // Safe HTML injection representing the hotspot preview card
        const popupContent = `
          <div style="font-family: inherit; padding: 4px; min-width: 200px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 9px; font-weight: 700; background-color: ${markerColor}15; color: ${markerColor}; border: 1px solid ${markerColor}30; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;">
                ${post.category}
              </span>
              <span style="font-size: 9px; font-weight: 700; background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;">
                ${post.status}
              </span>
            </div>
            <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 4px 0; line-height: 1.3;">
              <a href="/posts/${post.id}" style="color: #059669; text-decoration: none; font-weight: bold; hover: underline;">
                ${post.title}
              </a>
            </h4>
            <p style="font-size: 11px; color: #475569; margin: 0 0 8px 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4;">
              ${post.content}
            </p>
            <div style="font-size: 10px; font-weight: 700; color: #ea580c; display: flex; align-items: center; gap: 4px;">
              📍 @${post.assembly_name} Assembly
            </div>
          </div>
        `;

        L.marker([post.latitude, post.longitude], { icon })
          .addTo(map)
          .bindPopup(popupContent);
      }
    });

    // Resize map when browser bounds shift
    const handleResize = () => {
      if (leafletMap.current) leafletMap.current.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [posts]);

  return (
    <div className="relative h-[550px] w-full overflow-hidden rounded-2xl border border-border shadow-md">
      <div ref={mapRef} className="h-full w-full" />
      {posts.length === 0 && (
        <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2 w-11/12 max-w-md rounded-2xl border border-emerald-500/20 bg-slate-900/90 dark:bg-slate-950/90 p-4 text-center text-white shadow-xl backdrop-blur-md transition-all">
          <p className="text-sm font-black flex items-center justify-center gap-2 text-emerald-400">
            📍 Kerala Civic Map Active
          </p>
          <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
            No active civic reports found. Be the pioneer in your constituency—report a road pothole, waste dumping, or water leak to pin the very first hotspot!
          </p>
        </div>
      )}
    </div>
  );
};
export default MapHotspots;

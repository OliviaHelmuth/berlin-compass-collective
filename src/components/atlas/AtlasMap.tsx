/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import type { LocationCategory } from "@/lib/categories";
import { CATEGORY_LABEL } from "@/lib/categories";

export type AtlasLocation = {
  id: string;
  name: string;
  category: LocationCategory;
  lat: number | string;
  lng: number | string;
  district: string | null;
  address: string | null;
  muted?: boolean;
};


const BERLIN_CENTER = { lat: 52.520008, lng: 13.404954 };
const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

// Singleton loader for Google Maps JS API
let mapsPromise: Promise<typeof google> | null = null;
function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (mapsPromise) return mapsPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("Missing Google Maps browser key"));

  mapsPromise = new Promise((resolve, reject) => {
    (window as any).__lovableInitMap = () => resolve((window as any).google);
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__lovableInitMap",
      v: "weekly",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

// Brutalist purple theme
const MAP_STYLE_LIGHT: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f3ff" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3b2470" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ede9fe" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ddd6fe" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c7f73b" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3b2470" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#faf8ff" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#6d28d9" }] },
];

const MAP_STYLE_DARK: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1429" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c7f73b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f0a1a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a1f42" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#352656" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4a3478" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f0a1a" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#13091f" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c7f73b" }] },
];

function isDarkMode() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function markerIcon(active: boolean, muted?: boolean): google.maps.Symbol {
  if (muted) {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: "#9ca3af",
      fillOpacity: 0.7,
      strokeColor: "#ffffff",
      strokeWeight: 1.5,
    };
  }
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: active ? 13 : 9,
    fillColor: active ? "#c7f73b" : "#6d28d9",
    fillOpacity: 1,
    strokeColor: active ? "#6d28d9" : "#ffffff",
    strokeWeight: active ? 3 : 2,
  };
}


export function AtlasMap({
  locations,
  selectedId,
  onSelect,
}: {
  locations: AtlasLocation[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Init map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new g.maps.Map(containerRef.current, {
          center: BERLIN_CENTER,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          styles: isDarkMode() ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
          backgroundColor: isDarkMode() ? "#0f0a1a" : "#f5f3ff",
        });
        infoRef.current = new g.maps.InfoWindow();
        setReady(true);
      })
      .catch((e) => setError(e.message ?? "Map failed to load"));
    return () => {
      cancelled = true;
    };
  }, []);

  // React to theme changes
  useEffect(() => {
    if (!ready) return;
    const observer = new MutationObserver(() => {
      mapRef.current?.setOptions({
        styles: isDarkMode() ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
        backgroundColor: isDarkMode() ? "#0f0a1a" : "#f5f3ff",
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [ready]);

  // Sync markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const existing = markersRef.current;

    // remove stale
    existing.forEach((m, id) => {
      if (!locations.find((l) => l.id === id)) {
        m.setMap(null);
        existing.delete(id);
      }
    });

    const bounds = new google.maps.LatLngBounds();
    locations.forEach((loc) => {
      const pos = { lat: Number(loc.lat), lng: Number(loc.lng) };
      if (!isFinite(pos.lat) || !isFinite(pos.lng)) return;
      bounds.extend(pos);
      let marker = existing.get(loc.id);
      if (!marker) {
        marker = new google.maps.Marker({
          position: pos,
          map,
          title: loc.name,
          icon: markerIcon(selectedId === loc.id, loc.muted),
        });
        marker.addListener("click", () => {
          onSelect?.(loc.id);
          if (infoRef.current) {
            infoRef.current.setContent(
              `<div style="font-family:Inter,sans-serif;min-width:180px">
                <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:14px;color:#1a1429">${escapeHtml(loc.name)}</div>
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6d28d9;margin-top:2px">${CATEGORY_LABEL[loc.category]} · ${escapeHtml(loc.district ?? "Berlin")}</div>
                <a href="/location/${loc.id}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#6d28d9">View details →</a>
              </div>`,
            );
            infoRef.current.open({ map, anchor: marker });
          }
        });
        existing.set(loc.id, marker);
      } else {
        marker.setPosition(pos);
        marker.setIcon(markerIcon(selectedId === loc.id));
      }
    });

    if (locations.length > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds, 60);
      const listener = google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if ((map.getZoom() ?? 12) > 14) map.setZoom(14);
      });
      return () => google.maps.event.removeListener(listener);
    }
  }, [ready, locations, selectedId, onSelect]);

  // Update icon on selection change without rebuilding markers
  useEffect(() => {
    if (!ready) return;
    markersRef.current.forEach((m, id) => {
      m.setIcon(markerIcon(selectedId === id));
    });
  }, [selectedId, ready]);

  if (error) {
    return (
      <div className="h-full w-full rounded-2xl border-2 border-outline bg-surface-container flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Map failed to load: {error}
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full rounded-2xl overflow-hidden" style={{ minHeight: 300 }} />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

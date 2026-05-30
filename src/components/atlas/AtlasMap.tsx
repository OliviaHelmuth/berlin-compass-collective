import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { LocationCategory } from "@/lib/categories";
import { CATEGORIES } from "@/lib/categories";

export type AtlasLocation = {
  id: string;
  name: string;
  category: LocationCategory;
  lat: number | string;
  lng: number | string;
  district: string | null;
  address: string | null;
};

const BERLIN_CENTER: [number, number] = [52.520008, 13.404954];

function pinIcon(category: LocationCategory, active = false) {
  const icon = CATEGORIES.find((c) => c.id === category)?.icon ?? "place";
  return L.divIcon({
    className: "atlas-marker",
    html: `<div class="atlas-pin ${active ? "active" : ""}"><span class="material-symbols-rounded" style="font-size:18px">${icon}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function Recenter({ locations }: { locations: AtlasLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((l) => [Number(l.lat), Number(l.lng)] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [locations, map]);
  return null;
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
  return (
    <MapContainer
      center={BERLIN_CENTER}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full rounded-2xl"
      style={{ minHeight: 300 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter locations={locations} />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[Number(loc.lat), Number(loc.lng)]}
          icon={pinIcon(loc.category, selectedId === loc.id)}
          eventHandlers={{ click: () => onSelect?.(loc.id) }}
        >
          <Popup>
            <div className="font-sans">
              <div className="font-display font-bold text-sm">{loc.name}</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {loc.district ?? "Berlin"}
              </div>
              <a
                href={`/location/${loc.id}`}
                className="inline-block mt-2 text-xs font-semibold text-primary"
              >
                View details →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

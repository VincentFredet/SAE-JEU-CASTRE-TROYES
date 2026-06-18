"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Les icônes par défaut de Leaflet cassent sous les bundlers : on pointe vers le CDN.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type MapMarker = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  typeLabel?: string | null;
  address?: string | null;
  stockLabel?: string | null;
  inStock?: boolean;
  href?: string | null;
};

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 1) {
      map.fitBounds(
        markers.map((m) => [m.lat, m.lng] as [number, number]),
        { padding: [48, 48] },
      );
    }
  }, [map, markers]);
  return null;
}

export default function StoresMapInner({
  markers,
  detailsLabel,
}: {
  markers: MapMarker[];
  detailsLabel: string;
}) {
  const center: [number, number] = markers.length
    ? [
        markers.reduce((s, m) => s + m.lat, 0) / markers.length,
        markers.reduce((s, m) => s + m.lng, 0) / markers.length,
      ]
    : [46.6, 2.5]; // centre de la France par défaut
  const zoom = markers.length === 1 ? 13 : markers.length ? 6 : 5;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "transparent" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]}>
          <Popup>
            <div className="min-w-[170px] space-y-1">
              <div className="font-display text-[15px] font-semibold text-ink">{m.name}</div>
              {m.typeLabel ? (
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
                  {m.typeLabel}
                </div>
              ) : null}
              {m.address ? <div className="text-[13px] text-ink-soft">{m.address}</div> : null}
              {m.stockLabel ? (
                <div
                  className={`text-[12px] font-semibold ${m.inStock ? "text-pine" : "text-ink-soft"}`}
                >
                  {m.stockLabel}
                </div>
              ) : null}
              {m.href ? (
                <a
                  href={m.href}
                  className="mt-1 inline-block text-[13px] font-semibold text-clay"
                >
                  {detailsLabel} →
                </a>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
      <FitBounds markers={markers} />
    </MapContainer>
  );
}

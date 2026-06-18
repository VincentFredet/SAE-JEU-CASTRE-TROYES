"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./StoresMapInner";

// Leaflet a besoin du DOM : chargement client uniquement (pas de SSR).
const Inner = dynamic(() => import("./StoresMapInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-parchment/60" />,
});

export function StoresMap({
  markers,
  detailsLabel,
}: {
  markers: MapMarker[];
  detailsLabel: string;
}) {
  return <Inner markers={markers} detailsLabel={detailsLabel} />;
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MapPin,
  Crosshair,
  Layers,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ShieldAlert,
  Loader2,
  Navigation,
} from "lucide-react";
import type { SafetyConcernReport } from "@/lib/safety-reports";

// MapLibre worker configuration for Next.js 15
setWorkerUrl(
  new URL(
    "maplibre-gl/dist/maplibre-gl-worker.mjs",
    import.meta.url,
  ).toString(),
);

interface SafeRouteMapProps {
  reports: SafetyConcernReport[];
  selectedReportId?: string | null;
  onSelectReport?: (reportId: string) => void;
  selectedLocation?: [number, number] | null;
  onLocationSelect?: (coords: [number, number], approxAddress: string) => void;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [75.8321, 25.0499]; // Default Community Hub Center
const DEFAULT_ZOOM = 14;

export default function SafeRouteMap({
  reports,
  selectedReportId,
  onSelectReport,
  selectedLocation,
  onLocationSelect,
  className = "",
}: SafeRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const selectionMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
      const tileUrl = cartoKey
        ? `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?key=${cartoKey}`
        : `https://tile.openstreetmap.org/{z}/{x}/{y}.png`;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "street-tiles": {
              type: "raster",
              tiles: [tileUrl],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: "street-tiles-layer",
              type: "raster",
              source: "street-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
        "top-right"
      );

      map.on("load", () => {
        setMapLoaded(true);
      });

      // Click to choose location on map
      map.on("click", (e) => {
        const coords: [number, number] = [
          Math.round(e.lngLat.lng * 1000) / 1000,
          Math.round(e.lngLat.lat * 1000) / 1000,
        ];
        const approxName = `Coordinates [${coords[1].toFixed(3)}°N, ${coords[0].toFixed(3)}°E]`;
        if (onLocationSelect) {
          onLocationSelect(coords, approxName);
        }
      });

      mapInstanceRef.current = map;
    } catch (err: any) {
      console.error("MapLibre GL failed to initialize:", err);
      setMapError("Map container could not be initialized in this environment. Using map-style list view.");
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update report markers whenever reports or map change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Remove obsolete markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!reports.some((r) => r.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    reports.forEach((report) => {
      if (markersRef.current[report.id]) {
        return; // already rendered
      }

      // Create custom DOM element for marker
      const el = document.createElement("div");
      el.className = "cursor-pointer group transition-transform hover:scale-110";
      
      const isResolved = report.status === "Resolved";
      const isVerified = report.status === "Verified";

      const bgClass = isResolved
        ? "bg-emerald-600"
        : isVerified
        ? "bg-red-600"
        : "bg-amber-600";

      el.innerHTML = `
        <div class="flex items-center justify-center w-7 h-7 rounded-full ${bgClass} text-white shadow-md border-2 border-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <div style="font-weight: bold; color: #0F172A;">${report.category}</div>
          <div style="color: #64748B; margin-top: 2px;">${report.locationName}</div>
          <div style="margin-top: 4px; font-weight: 600; color: ${
            isResolved ? "#059669" : isVerified ? "#DC2626" : "#D97706"
          };">${report.status}</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(report.coordinates)
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        if (onSelectReport) {
          onSelectReport(report.id);
        }
      });

      markersRef.current[report.id] = marker;
    });
  }, [reports, mapLoaded, onSelectReport]);

  // Update selected location pin (when user clicks on map or selects location)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    if (!selectedLocation) {
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.remove();
        selectionMarkerRef.current = null;
      }
      return;
    }

    if (!selectionMarkerRef.current) {
      const pinEl = document.createElement("div");
      pinEl.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `;
      selectionMarkerRef.current = new maplibregl.Marker({ element: pinEl })
        .setLngLat(selectedLocation)
        .addTo(map);
    } else {
      selectionMarkerRef.current.setLngLat(selectedLocation);
    }
  }, [selectedLocation, mapLoaded]);

  // Focus map when selectedReportId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedReportId) return;

    const targetReport = reports.find((r) => r.id === selectedReportId);
    if (targetReport) {
      map.flyTo({
        center: targetReport.coordinates,
        zoom: 15,
        speed: 1.2,
      });
      const marker = markersRef.current[selectedReportId];
      if (marker && !marker.getPopup().isOpen()) {
        marker.togglePopup();
      }
    }
  }, [selectedReportId, reports]);

  // Geolocation Request Handler (asking permission before access)
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGeoNotice("Geolocation is not supported by your browser. Please enter location manually.");
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const coords: [number, number] = [
          Math.round(position.coords.longitude * 1000) / 1000,
          Math.round(position.coords.latitude * 1000) / 1000,
        ];
        const approxName = `Near GPS [${coords[1].toFixed(3)}°N, ${coords[0].toFixed(3)}°E]`;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({ center: coords, zoom: 15 });
        }

        if (onLocationSelect) {
          onLocationSelect(coords, approxName);
        }
        setGeoNotice("Location detected. Pin placed on map.");
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoNotice("Location permission was denied. You can manually enter the street location below or tap on the map.");
        } else {
          setGeoNotice("Unable to retrieve current location. Please enter your location manually.");
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  if (mapError) {
    return (
      <div className={`p-6 rounded-2xl bg-slate-100 dark:bg-[#131C2E] border border-slate-200 dark:border-[#1E293B] text-center space-y-3 ${className}`}>
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
          Location Map Standby
        </div>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {mapError}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[360px] sm:h-[460px] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1E293B] shadow-inner ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls & Overlays */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateUser}
          disabled={isLocating}
          className="p-2.5 rounded-xl bg-white dark:bg-[#131C2E] text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors flex items-center gap-1.5 text-xs font-bold"
          title="Detect Current Location"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
          ) : (
            <Crosshair className="w-4 h-4 text-sky-600" />
          )}
          <span className="hidden sm:inline">Use My Location</span>
        </button>
      </div>

      {/* Legend & Instructions overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 dark:border-[#1E293B] shadow-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-600 dark:text-slate-300">Concern Map:</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
              <span>Verified Concern</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
              <span>Unverified</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Resolved</span>
            </span>
          </div>

          <span className="text-slate-500 font-medium">
            💡 Tap anywhere on map to drop a report pin
          </span>
        </div>
      </div>

      {/* Geo Notice Toast */}
      {geoNotice && (
        <div className="absolute top-3 right-14 z-10 max-w-xs bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-lg border border-slate-700 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <span>{geoNotice}</span>
            <button
              onClick={() => setGeoNotice(null)}
              className="text-slate-400 hover:text-white font-bold ml-1"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

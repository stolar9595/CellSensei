import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, Navigation, ChevronUp, ChevronDown, Signal, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNavigation } from "@/components/bottom-navigation";
import { type CellTower } from "@shared/schema";
import { getCurrentLocation } from "@/lib/geolocation";

declare global {
  interface Window {
    L: any;
  }
}

const carrierConfig: Record<string, { color: string; bg: string; text: string; border: string }> = {
  SaskTel: { color: "#16a34a", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Bell: { color: "#2563eb", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Telus: { color: "#7c3aed", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Rogers: { color: "#dc2626", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function getCarrierStyle(carrier: string) {
  return carrierConfig[carrier] || { color: "#6b7280", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
}

export default function TowerMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [listExpanded, setListExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: towers = [] } = useQuery<CellTower[]>({
    queryKey: ["/api/cell-towers"],
  });

  const filteredTowers = (selectedCarrier === "all"
    ? towers
    : towers.filter((tower) => tower.carrier === selectedCarrier)
  ).filter((tower) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tower.carrier.toLowerCase().includes(q) ||
      tower.towerId.toLowerCase().includes(q) ||
      (tower.address && tower.address.toLowerCase().includes(q)) ||
      tower.networkTypes.some((t) => t.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    getCurrentLocation().then((location) => {
      if (location) {
        setUserLocation({ lat: location.latitude, lng: location.longitude });
      }
    });
  }, []);

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.L) {
        setTimeout(initializeMap, 100);
        return;
      }

      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const container = mapRef.current;
        if (container.offsetHeight === 0) {
          container.style.height = "400px";
        }

        const map = window.L.map(container, {
          center: [52.1332, -106.67],
          zoom: 10,
          scrollWheelZoom: true,
          dragging: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;

        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 18,
        }).addTo(map);

        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 100);

        if (userLocation) {
          const userMarker = window.L.circleMarker([userLocation.lat, userLocation.lng], {
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 0.8,
            radius: 8,
          }).addTo(map);
          userMarker.bindPopup("Your Location");
          map.setView([userLocation.lat, userLocation.lng], 12);
        }
      } catch (error) {
        console.error("Map initialization failed:", error);
        setTimeout(initializeMap, 500);
      }
    };

    setTimeout(initializeMap, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer.options && layer.options.towerMarker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    filteredTowers.forEach((tower) => {
      const style = getCarrierStyle(tower.carrier);

      const marker = window.L.circleMarker([tower.latitude, tower.longitude], {
        color: style.color,
        fillColor: style.color,
        fillOpacity: 0.7,
        radius: 6,
        towerMarker: true,
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 140px;">
          <div style="font-weight: 600; font-size: 14px; color: ${style.color}; margin-bottom: 4px;">${tower.carrier}</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">${tower.towerId}</div>
          <div style="font-size: 12px; color: #374151;">${tower.networkTypes.join(", ")}</div>
          ${tower.address ? `<div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">${tower.address}</div>` : ""}
        </div>
      `);
    });
  }, [filteredTowers]);

  const goToTower = (tower: CellTower) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([tower.latitude, tower.longitude], 16, {
        animate: true,
        duration: 0.5,
      });

      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer.options && layer.options.towerMarker) {
          const latlng = layer.getLatLng();
          if (
            Math.abs(latlng.lat - tower.latitude) < 0.0001 &&
            Math.abs(latlng.lng - tower.longitude) < 0.0001
          ) {
            layer.openPopup();
          }
        }
      });

      if (listExpanded) {
        setListExpanded(false);
      }
    }
  };

  const carrierCounts = towers.reduce((acc, tower) => {
    acc[tower.carrier] = (acc[tower.carrier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative flex flex-col">
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-5 py-5">
        <h1 className="text-xl font-bold">Tower Map</h1>
        <p className="text-blue-100 text-sm mt-0.5">Cell towers across Saskatchewan</p>
      </div>

      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search towers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-gray-50 border-gray-200"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setSelectedCarrier("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCarrier === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({towers.length})
          </button>
          {Object.entries(carrierCounts).map(([carrier, count]) => {
            const style = getCarrierStyle(carrier);
            const isActive = selectedCarrier === carrier;
            return (
              <button
                key={carrier}
                onClick={() => setSelectedCarrier(carrier)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? `${style.bg} ${style.text} ring-1 ${style.border}`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: style.color }}
                />
                {carrier} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex-1">
        <div
          ref={mapRef}
          className="w-full bg-gray-100"
          style={{ height: listExpanded ? "250px" : "400px", transition: "height 0.3s ease" }}
        />

        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-red-200" />
            <span className="text-[11px] text-gray-600">You</span>
          </div>
          {Object.entries(carrierConfig).map(([carrier, cfg]) => (
            <div key={carrier} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-[11px] text-gray-600">{carrier}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 flex flex-col" style={{ maxHeight: listExpanded ? "50vh" : "auto" }}>
        <button
          onClick={() => {
            setListExpanded(!listExpanded);
            setTimeout(() => {
              mapInstanceRef.current?.invalidateSize();
            }, 350);
          }}
          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Radio size={15} className="text-primary" />
            <span className="font-semibold text-sm text-gray-900">
              Nearby Towers
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredTowers.length}
            </span>
          </div>
          {listExpanded ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronUp size={16} className="text-gray-400" />
          )}
        </button>

        {listExpanded && (
          <div className="overflow-y-auto flex-1 px-3 pb-24">
            {filteredTowers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No towers found
              </div>
            ) : (
              <div className="space-y-2 pb-2">
                {filteredTowers.map((tower) => {
                  const style = getCarrierStyle(tower.carrier);
                  return (
                    <div
                      key={tower.id}
                      className={`rounded-lg border ${style.border} ${style.bg} p-3 transition-all hover:shadow-sm`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: style.color + "18" }}
                          >
                            <Signal size={14} style={{ color: style.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-semibold text-sm ${style.text}`}>
                                {tower.carrier}
                              </span>
                              <span className="text-[11px] text-gray-400 font-mono truncate">
                                {tower.towerId}
                              </span>
                            </div>
                            {tower.address && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {tower.address}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {tower.networkTypes.map((type) => (
                                <span
                                  key={type}
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/80 text-gray-600 border border-gray-200/60"
                                >
                                  {type}
                                </span>
                              ))}
                              {tower.range && (
                                <span className="text-[10px] text-gray-400 ml-1">
                                  {tower.range} km
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => goToTower(tower)}
                          className="shrink-0 w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow transition-all active:scale-95"
                          title="Go to tower location"
                        >
                          <Navigation size={14} className="text-primary" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}

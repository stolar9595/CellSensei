import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Layers, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNavigation } from "@/components/bottom-navigation";
import { CarrierDot } from "@/components/carrier-colors";
import { type CellTower } from "@shared/schema";
import { getCurrentLocation } from "@/lib/geolocation";

declare global {
  interface Window {
    L: any;
  }
}

export default function TowerMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const { data: towers = [] } = useQuery<CellTower[]>({
    queryKey: ["/api/cell-towers"],
  });

  const filteredTowers = selectedCarrier === "all" 
    ? towers 
    : towers.filter(tower => tower.carrier === selectedCarrier);

  const carrierColors = {
    SaskTel: "#2E7D32",
    Bell: "#1565C0", 
    Telus: "#7B1FA2",
    Rogers: "#D32F2F",
  };

  useEffect(() => {
    getCurrentLocation().then(location => {
      if (location) {
        setUserLocation({
          lat: location.latitude,
          lng: location.longitude
        });
      }
    });
  }, []);

  useEffect(() => {
    // Add a small delay to ensure Leaflet is fully loaded
    const initializeMap = () => {
      if (!mapRef.current || !window.L) {
        setTimeout(initializeMap, 100);
        return;
      }

      // Clear any existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Initialize map centered on Saskatchewan
      const map = window.L.map(mapRef.current).setView([52.1332, -106.6700], 10);
      mapInstanceRef.current = map;

    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add user location if available
    if (userLocation) {
      const userMarker = window.L.circleMarker([userLocation.lat, userLocation.lng], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.8,
        radius: 8
      }).addTo(map);
      
      userMarker.bindPopup("Your Location");
      
      // Center map on user location
      map.setView([userLocation.lat, userLocation.lng], 12);
    }

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    };

    initializeMap();
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    // Clear existing tower markers
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer.options && layer.options.towerMarker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add tower markers
    filteredTowers.forEach(tower => {
      const color = carrierColors[tower.carrier as keyof typeof carrierColors] || "#666666";
      
      const marker = window.L.circleMarker([tower.latitude, tower.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: 6,
        towerMarker: true
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div>
          <strong>${tower.carrier} Tower</strong><br>
          <small>${tower.towerId}</small><br>
          ${tower.networkTypes.join(", ")}<br>
          ${tower.address || ""}
        </div>
      `);
    });
  }, [filteredTowers]);

  const carrierCounts = towers.reduce((acc, tower) => {
    acc[tower.carrier] = (acc[tower.carrier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-6">
        <h1 className="text-2xl font-bold mb-2">Tower Map</h1>
        <p className="text-blue-100">Cell towers across Saskatchewan</p>
      </div>

      {/* Controls */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex items-center space-x-2 mb-3">
          <Search size={16} className="text-gray-400" />
          <Input 
            placeholder="Search location..." 
            className="flex-1"
          />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto">
          <Button
            variant={selectedCarrier === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCarrier("all")}
          >
            All ({towers.length})
          </Button>
          {Object.entries(carrierCounts).map(([carrier, count]) => (
            <Button
              key={carrier}
              variant={selectedCarrier === carrier ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCarrier(carrier)}
              className="whitespace-nowrap"
            >
              <CarrierDot carrier={carrier} className="mr-1" />
              {carrier} ({count})
            </Button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapRef} className="h-96 w-full" />
        
        {/* Map Legend */}
        <Card className="absolute top-4 right-4 z-10">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs">Your Location</span>
              </div>
              {Object.entries(carrierColors).map(([carrier, color]) => (
                <div key={carrier} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs">{carrier}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tower List */}
      <div className="px-4 py-4 pb-24 space-y-3 max-h-48 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 sticky top-0 bg-white py-2">
          Nearby Towers ({filteredTowers.length})
        </h3>
        
        {filteredTowers.map(tower => (
          <Card key={tower.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CarrierDot carrier={tower.carrier} />
                  <div>
                    <div className="font-medium text-sm">{tower.carrier} Tower</div>
                    <div className="text-xs text-gray-500">{tower.towerId}</div>
                    <div className="text-xs text-gray-500">{tower.address}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{tower.networkTypes.join(", ")}</div>
                  <div className="text-xs text-gray-500">
                    {tower.range && `${tower.range} km range`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Signal, Wifi } from "lucide-react";
import { type NetworkInfo } from "@shared/schema";
import { CarrierDot } from "./carrier-colors";

export function NetworkStatus() {
  const { data: networkInfo } = useQuery<NetworkInfo>({
    queryKey: ["/api/network-info/latest"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!networkInfo) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Current Network</span>
          <span className="text-xs bg-gray-500/20 text-gray-100 px-2 py-1 rounded-full">Detecting...</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-blue-200">Carrier</div>
            <div className="font-semibold">Detecting...</div>
          </div>
          <div>
            <div className="text-xs text-blue-200">Signal</div>
            <div className="font-semibold">-- dBm</div>
          </div>
        </div>
      </div>
    );
  }

  const getSignalQuality = (strength: number) => {
    if (strength >= -70) return "Excellent";
    if (strength >= -85) return "Good";
    if (strength >= -100) return "Fair";
    return "Poor";
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Current Network</span>
        <span className="text-xs bg-green-500/20 text-green-100 px-2 py-1 rounded-full">Connected</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-blue-200">Carrier</div>
          <div className="flex items-center space-x-2">
            <CarrierDot carrier={networkInfo.carrier} />
            <span className="font-semibold">{networkInfo.carrier} {networkInfo.networkType}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-blue-200">Signal</div>
          <div className="font-semibold">{networkInfo.signalStrength} dBm</div>
          <div className="text-xs text-blue-200">{getSignalQuality(networkInfo.signalStrength)}</div>
        </div>
      </div>
    </div>
  );
}

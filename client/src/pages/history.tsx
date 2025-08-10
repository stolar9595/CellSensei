import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, Download, Upload, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { CarrierDot } from "@/components/carrier-colors";
import { type SpeedTest } from "@shared/schema";

export default function History() {
  const [selectedCarrier, setSelectedCarrier] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("week");

  const { data: allTests = [], isLoading } = useQuery<SpeedTest[]>({
    queryKey: ["/api/speed-tests"],
  });

  const filteredTests = allTests.filter(test => {
    if (selectedCarrier !== "all" && test.carrier !== selectedCarrier) {
      return false;
    }

    const testDate = new Date(test.timestamp);
    const now = new Date();
    const timeDiff = now.getTime() - testDate.getTime();
    
    switch (timeRange) {
      case "day":
        return timeDiff <= 24 * 60 * 60 * 1000;
      case "week":
        return timeDiff <= 7 * 24 * 60 * 60 * 1000;
      case "month":
        return timeDiff <= 30 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  });

  const getStats = () => {
    if (filteredTests.length === 0) return null;

    const downloadSpeeds = filteredTests.map(test => test.downloadSpeed);
    const uploadSpeeds = filteredTests.map(test => test.uploadSpeed);
    const pings = filteredTests.map(test => test.ping);

    return {
      avgDownload: downloadSpeeds.reduce((a, b) => a + b, 0) / downloadSpeeds.length,
      maxDownload: Math.max(...downloadSpeeds),
      avgUpload: uploadSpeeds.reduce((a, b) => a + b, 0) / uploadSpeeds.length,
      maxUpload: Math.max(...uploadSpeeds),
      avgPing: pings.reduce((a, b) => a + b, 0) / pings.length,
      minPing: Math.min(...pings),
      testCount: filteredTests.length,
    };
  };

  const stats = getStats();

  const getTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const testTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - testTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const formatDate = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const carriers = [...new Set(allTests.map(test => test.carrier))];

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Test History</h1>
        <p className="text-blue-100">Your network performance over time</p>
      </div>

      <div className="px-6 py-6 pb-24 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Time Range Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Time Range</label>
                <div className="flex space-x-2">
                  {[
                    { value: "day", label: "24h" },
                    { value: "week", label: "1 Week" },
                    { value: "month", label: "1 Month" },
                    { value: "all", label: "All Time" },
                  ].map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={timeRange === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Carrier Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Carrier</label>
                <div className="flex space-x-2 overflow-x-auto">
                  <Button
                    variant={selectedCarrier === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCarrier("all")}
                  >
                    All
                  </Button>
                  {carriers.map(carrier => (
                    <Button
                      key={carrier}
                      variant={selectedCarrier === carrier ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCarrier(carrier)}
                      className="whitespace-nowrap"
                    >
                      <CarrierDot carrier={carrier} className="mr-1" />
                      {carrier}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Download className="text-green-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">Download</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.avgDownload.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Avg • Peak {stats.maxDownload.toFixed(1)} Mbps</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Upload className="text-blue-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">Upload</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.avgUpload.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Avg • Peak {stats.maxUpload.toFixed(1)} Mbps</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="text-orange-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">Latency</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.avgPing.toFixed(0)}</div>
                <div className="text-xs text-gray-500">Avg • Best {stats.minPing}ms</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="text-purple-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">Tests</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.testCount}</div>
                <div className="text-xs text-gray-500">Total in period</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Loading test history...</div>
            ) : filteredTests.length > 0 ? (
              <div className="space-y-0">
                {filteredTests.map((test) => (
                  <div key={test.id} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CarrierDot carrier={test.carrier} />
                        <span className="font-medium text-sm">{test.carrier}</span>
                        <span className="text-xs text-gray-500">{test.networkType}</span>
                      </div>
                      <span className="text-xs text-gray-500">{getTimeAgo(test.timestamp)}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <div>
                        <div className="text-xs text-gray-500">Download</div>
                        <div className="font-semibold text-green-600">{test.downloadSpeed.toFixed(1)} Mbps</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Upload</div>
                        <div className="font-semibold text-blue-600">{test.uploadSpeed.toFixed(1)} Mbps</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Ping</div>
                        <div className="font-semibold text-orange-600">{test.ping}ms</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {test.location || "Unknown location"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(test.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No tests found for the selected filters. 
                {selectedCarrier !== "all" || timeRange !== "all" ? (
                  <div className="mt-2">
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSelectedCarrier("all");
                        setTimeRange("all");
                      }}
                      className="text-primary"
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}

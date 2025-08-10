import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { CarrierDot } from "@/components/carrier-colors";

interface CarrierComparison {
  carrier: string;
  avgDownload: number;
  avgUpload: number;
  avgPing: number;
  totalTests: number;
  coveragePoints: number;
  activeOutages: number;
  reliabilityScore: number;
}

export default function Comparison() {
  const { data: comparison = [], isLoading } = useQuery<CarrierComparison[]>({
    queryKey: ["/api/carrier-comparison"],
    refetchInterval: 60000, // Refresh every minute
  });

  const getBestCarrier = (metric: keyof CarrierComparison) => {
    if (comparison.length === 0) return null;
    
    if (metric === "avgPing" || metric === "activeOutages") {
      // Lower is better for these metrics
      return comparison.reduce((best, current) => 
        current[metric] < best[metric] ? current : best
      );
    } else {
      // Higher is better for other metrics
      return comparison.reduce((best, current) => 
        current[metric] > best[metric] ? current : best
      );
    }
  };

  const getMetricColor = (carrier: CarrierComparison, metric: keyof CarrierComparison) => {
    const best = getBestCarrier(metric);
    return best && best.carrier === carrier.carrier ? "text-green-600" : "text-gray-700";
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-8">
        <div className="flex items-center mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2 mr-3">
              <ChevronLeft className="text-white" size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Carrier Comparison</h1>
        </div>
        <p className="text-blue-100">Compare performance across all carriers in Saskatchewan</p>
      </div>

      <div className="px-6 py-6 pb-24 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading carrier data...</p>
          </div>
        ) : (
          <>
            {/* Performance Overview */}
            <div className="grid grid-cols-2 gap-4">
              {comparison.map(carrier => (
                <Card key={carrier.carrier}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CarrierDot carrier={carrier.carrier} />
                        <span className="font-semibold text-sm">{carrier.carrier}</span>
                      </div>
                      <span className="text-xs text-gray-500">{carrier.totalTests} tests</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Download</span>
                          <span className={getMetricColor(carrier, "avgDownload")}>
                            {carrier.avgDownload} Mbps
                          </span>
                        </div>
                        <Progress value={(carrier.avgDownload / 100) * 100} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Upload</span>
                          <span className={getMetricColor(carrier, "avgUpload")}>
                            {carrier.avgUpload} Mbps
                          </span>
                        </div>
                        <Progress value={(carrier.avgUpload / 50) * 100} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Ping</span>
                          <span className={getMetricColor(carrier, "avgPing")}>
                            {carrier.avgPing} ms
                          </span>
                        </div>
                        <Progress value={100 - (carrier.avgPing / 100) * 100} className="h-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Reliability Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Network Reliability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comparison
                  .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
                  .map(carrier => (
                    <div key={carrier.carrier} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CarrierDot carrier={carrier.carrier} />
                        <span className="font-medium text-sm">{carrier.carrier}</span>
                        {carrier.activeOutages > 0 && (
                          <AlertTriangle className="text-orange-500" size={14} />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-700">
                          {carrier.reliabilityScore}%
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                            style={{ width: `${carrier.reliabilityScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Coverage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coverage Data Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {comparison
                    .sort((a, b) => b.coveragePoints - a.coveragePoints)
                    .map(carrier => (
                      <div key={carrier.carrier} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CarrierDot carrier={carrier.carrier} />
                          <span className="text-sm">{carrier.carrier}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          {carrier.coveragePoints.toLocaleString()} points
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Winner Summary */}
            {comparison.length > 0 && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Best Performers</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fastest Download:</span>
                      <span className="font-semibold">{getBestCarrier("avgDownload")?.carrier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lowest Latency:</span>
                      <span className="font-semibold">{getBestCarrier("avgPing")?.carrier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Most Reliable:</span>
                      <span className="font-semibold">{getBestCarrier("reliabilityScore")?.carrier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best Coverage:</span>
                      <span className="font-semibold">{getBestCarrier("coveragePoints")?.carrier}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
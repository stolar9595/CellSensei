import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { SpeedTestModal } from "@/components/speed-test-modal";
import { CarrierDot } from "@/components/carrier-colors";
import { type SpeedTest } from "@shared/schema";

export default function SpeedTest() {
  const [isSpeedTestOpen, setIsSpeedTestOpen] = useState(false);

  const { data: speedTests = [], isLoading } = useQuery<SpeedTest[]>({
    queryKey: ["/api/speed-tests"],
  });

  const latestTest = speedTests[0];
  const recentTests = speedTests.slice(0, 5);

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

  const getSpeedQuality = (speed: number) => {
    if (speed >= 50) return { text: "Excellent", color: "text-green-600" };
    if (speed >= 25) return { text: "Good", color: "text-blue-600" };
    if (speed >= 10) return { text: "Fair", color: "text-orange-600" };
    return { text: "Poor", color: "text-red-600" };
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Speed Test</h1>
        <p className="text-blue-100">Test your network performance</p>
      </div>

      <div className="px-6 py-6 pb-24 space-y-6">
        {/* Speed Test Controls */}
        <Card>
          <CardContent className="p-6 text-center">
            {latestTest ? (
              <div className="space-y-4">
                <div className="text-6xl font-bold text-primary mb-2">
                  {latestTest.downloadSpeed.toFixed(1)}
                </div>
                <div className="text-gray-600 mb-4">Mbps Download</div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{latestTest.downloadSpeed.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Download</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{latestTest.uploadSpeed.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Upload</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{latestTest.ping}</div>
                    <div className="text-xs text-gray-500">Ping (ms)</div>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                  <CarrierDot carrier={latestTest.carrier} />
                  <span>{latestTest.carrier}</span>
                  <span>•</span>
                  <span>{getTimeAgo(latestTest.timestamp)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl font-bold text-gray-300 mb-2">--</div>
                <div className="text-gray-600 mb-4">No tests yet</div>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={() => setIsSpeedTestOpen(true)}
                className="w-full bg-orange-500 hover:bg-orange-600"
                size="lg"
              >
                <Play className="mr-2" size={20} />
                Start New Test
              </Button>
              {latestTest && (
                <Button 
                  onClick={() => setIsSpeedTestOpen(true)}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="mr-2" size={16} />
                  Run Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Tests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Loading tests...</div>
            ) : recentTests.length > 0 ? (
              <div className="space-y-0">
                {recentTests.map((test, index) => {
                  const quality = getSpeedQuality(test.downloadSpeed);
                  return (
                    <div key={test.id} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CarrierDot carrier={test.carrier} />
                          <div>
                            <div className="font-medium text-sm">{test.carrier}</div>
                            <div className="text-xs text-gray-500">{getTimeAgo(test.timestamp)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${quality.color}`}>
                            {test.downloadSpeed.toFixed(1)} Mbps
                          </div>
                          <div className="text-xs text-gray-500">
                            ↑{test.uploadSpeed.toFixed(1)} • {test.ping}ms
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No speed tests yet. Run your first test to see results here.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Speed Test Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tips for Accurate Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Close other apps that might use data during the test
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Connect to Wi-Fi or use mobile data, not both
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Test from different locations for comprehensive results
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="text-sm text-gray-700">
                Test at different times of day for varied network conditions
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
      <SpeedTestModal isOpen={isSpeedTestOpen} onClose={() => setIsSpeedTestOpen(false)} />
    </div>
  );
}

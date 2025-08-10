import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Gauge, Map, User, Signal, Wifi, LogOut, TrendingUp, AlertTriangle, Clock, PieChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { NetworkStatus } from "@/components/network-status";
import { SpeedTestModal } from "@/components/speed-test-modal";
import { CarrierDot } from "@/components/carrier-colors";
import { useAuth } from "@/hooks/useAuth";
import { type SpeedTest, type CellTower } from "@shared/schema";

export default function Home() {
  const [isSpeedTestOpen, setIsSpeedTestOpen] = useState(false);
  const { user } = useAuth();

  // Get latest speed test
  const { data: speedTests } = useQuery<SpeedTest[]>({
    queryKey: ["/api/speed-tests"],
    select: (data) => data?.slice(0, 1) || [],
  });

  // Get nearby towers
  const { data: towers } = useQuery<CellTower[]>({
    queryKey: ["/api/cell-towers"],
    select: (data) => data?.slice(0, 3) || [],
  });

  const latestTest = speedTests?.[0];

  const getTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const testTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - testTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  const getSignalQuality = (strength: number) => {
    if (strength >= -70) return { text: "Excellent", color: "text-green-600" };
    if (strength >= -85) return { text: "Good", color: "text-blue-600" };
    if (strength >= -100) return { text: "Fair", color: "text-orange-600" };
    return { text: "Poor", color: "text-red-600" };
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Status Bar */}
      <div className="bg-primary text-white px-4 py-2 flex justify-between items-center text-sm">
        <div className="flex items-center space-x-2">
          <span>SaskTel</span>
          <div className="flex">
            <div className="w-1 h-3 bg-white mr-0.5 rounded-sm"></div>
            <div className="w-1 h-3 bg-white mr-0.5 rounded-sm"></div>
            <div className="w-1 h-3 bg-white/60 mr-0.5 rounded-sm"></div>
            <div className="w-1 h-3 bg-white/30 rounded-sm"></div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span>89%</span>
          <div className="w-6 h-3 border border-white rounded-sm">
            <div className="w-4/5 h-full bg-white rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">SaskNet</h1>
              {user && (
                <p className="text-sm text-blue-200">
                  Welcome back{user.firstName ? `, ${user.firstName}` : ''}!
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full bg-white/20"
                  style={{ objectFit: 'cover' } as any}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={16} />
                </div>
              )}
              <a href="/api/logout">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30"
                >
                  <LogOut size={16} />
                </Button>
              </a>
            </div>
          </div>
          <p className="text-blue-100 mb-6">Network Diagnostics & Performance</p>
          
          <NetworkStatus />
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              onClick={() => setIsSpeedTestOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-xl shadow-lg h-auto flex flex-col space-y-2 pulse-animation"
            >
              <Gauge className="text-2xl" />
              <div className="font-semibold">Speed Test</div>
              <div className="text-xs opacity-90">Run Diagnostics</div>
            </Button>
            
            <Link href="/tower-map">
              <Button className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl shadow-lg h-auto flex flex-col space-y-2 w-full">
                <Map className="text-2xl" />
                <div className="font-semibold">Tower Map</div>
                <div className="text-xs opacity-90">Find Towers</div>
              </Button>
            </Link>
          </div>

          {/* New Features Grid */}
          <h3 className="font-semibold text-gray-900 mb-3">More Features</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/comparison">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <TrendingUp className="text-primary mb-2" size={20} />
                  <h4 className="font-medium text-sm">Compare</h4>
                  <p className="text-xs text-gray-600">Carrier analysis</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/outages">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <AlertTriangle className="text-orange-500 mb-2" size={20} />
                  <h4 className="font-medium text-sm">Outages</h4>
                  <p className="text-xs text-gray-600">Report issues</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/schedule">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <Clock className="text-blue-500 mb-2" size={20} />
                  <h4 className="font-medium text-sm">Schedule</h4>
                  <p className="text-xs text-gray-600">Auto tests</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/data-usage">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <PieChart className="text-purple-500 mb-2" size={20} />
                  <h4 className="font-medium text-sm">Data Usage</h4>
                  <p className="text-xs text-gray-600">Track usage</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Latest Speed Test */}
        {latestTest && (
          <div className="px-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Latest Speed Test</h3>
                  <span className="text-xs text-gray-500">{getTimeAgo(latestTest.timestamp)}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Download</div>
                    <div className="text-lg font-bold text-green-600">{latestTest.downloadSpeed.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Mbps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Upload</div>
                    <div className="text-lg font-bold text-blue-600">{latestTest.uploadSpeed.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">Mbps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Ping</div>
                    <div className="text-lg font-bold text-orange-600">{latestTest.ping}</div>
                    <div className="text-xs text-gray-500">ms</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <CarrierDot carrier={latestTest.carrier} />
                    <span className="text-sm text-gray-600">{latestTest.carrier}</span>
                  </div>
                  <Link href="/history">
                    <Button variant="link" className="text-primary text-sm font-medium p-0">
                      View History
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Carrier Comparison */}
        <div className="px-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Carrier Performance</h3>
              
              {["SaskTel", "Bell", "Telus", "Rogers"].map((carrier) => {
                const carrierTests = speedTests?.filter(test => test.carrier === carrier) || [];
                const avgSpeed = carrierTests.length > 0 
                  ? carrierTests.reduce((sum, test) => sum + test.downloadSpeed, 0) / carrierTests.length
                  : null;

                return (
                  <div key={carrier} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <CarrierDot carrier={carrier} />
                      <div>
                        <div className="font-medium text-sm">{carrier}</div>
                        <div className="text-xs text-gray-500">4G LTE</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {avgSpeed ? (
                        <>
                          <div className="text-sm font-semibold text-green-600">{avgSpeed.toFixed(1)} Mbps</div>
                          <div className="text-xs text-gray-500">Avg Speed</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-semibold text-gray-600">No Data</div>
                          <div className="text-xs text-gray-500">Test to Compare</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Nearby Towers */}
        <div className="px-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Nearby Towers</h3>
                <Link href="/tower-map">
                  <Button variant="link" className="text-primary text-sm font-medium p-0">
                    View Map
                  </Button>
                </Link>
              </div>
              
              {/* Mini Map Preview */}
              <div className="relative bg-gray-100 rounded-lg h-40 mb-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100"></div>
                
                {/* Current Location */}
                <div className="absolute top-16 left-16 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg pulse-animation"></div>
                <div className="absolute top-14 left-14 w-8 h-8 bg-red-500/20 rounded-full"></div>
              </div>

              {/* Tower List */}
              <div className="space-y-3">
                {towers?.map((tower, index) => {
                  const distances = ["0.8 km NE", "1.2 km SW", "2.1 km N"];
                  const signalStrengths = [-68, -84, -91];
                  const quality = getSignalQuality(signalStrengths[index]);

                  return (
                    <div key={tower.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CarrierDot carrier={tower.carrier} />
                        <div>
                          <div className="text-sm font-medium">{tower.carrier} Tower {tower.towerId}</div>
                          <div className="text-xs text-gray-500">{distances[index]}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{signalStrengths[index]} dBm</div>
                        <div className={`text-xs ${quality.color}`}>{quality.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Signal className="text-green-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">Signal Quality</span>
                </div>
                <div className="text-xl font-bold text-gray-900">Excellent</div>
                <div className="text-xs text-gray-500">-68 dBm</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Wifi className="text-blue-500" size={16} />
                  <span className="text-sm font-medium text-gray-700">Network Type</span>
                </div>
                <div className="text-xl font-bold text-gray-900">4G LTE</div>
                <div className="text-xs text-gray-500">Band 4 (1700)</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BottomNavigation />
      <SpeedTestModal isOpen={isSpeedTestOpen} onClose={() => setIsSpeedTestOpen(false)} />
    </div>
  );
}

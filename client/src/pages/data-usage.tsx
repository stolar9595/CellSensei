import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Smartphone, Wifi, TrendingUp, PieChart, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BottomNavigation } from "@/components/bottom-navigation";
import { type DataUsage } from "@shared/schema";

interface AppUsage {
  appName: string;
  totalUsage: number;
}

export default function DataUsagePage() {
  const { data: usage = [], isLoading: usageLoading } = useQuery<DataUsage[]>({
    queryKey: ["/api/data-usage"],
  });

  const { data: appUsage = [], isLoading: appLoading } = useQuery<AppUsage[]>({
    queryKey: ["/api/data-usage/by-app"],
  });

  const totalUsage = usage.reduce((sum, u) => sum + u.dataConsumed, 0);
  const cellularUsage = usage.filter(u => u.connectionType === "cellular").reduce((sum, u) => sum + u.dataConsumed, 0);
  const wifiUsage = usage.filter(u => u.connectionType === "wifi").reduce((sum, u) => sum + u.dataConsumed, 0);

  const formatDataSize = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const getAppIcon = (appName: string) => {
    const name = appName.toLowerCase();
    if (name.includes("video") || name.includes("youtube") || name.includes("netflix")) return "📺";
    if (name.includes("social") || name.includes("facebook") || name.includes("instagram")) return "💬";
    if (name.includes("music") || name.includes("spotify")) return "🎵";
    if (name.includes("game")) return "🎮";
    if (name.includes("browser") || name.includes("chrome") || name.includes("safari")) return "🌐";
    if (name.includes("email") || name.includes("mail")) return "📧";
    return "📱";
  };

  const getUsageRecommendation = (app: AppUsage) => {
    const percentage = (app.totalUsage / totalUsage) * 100;
    if (percentage > 30) {
      return { text: "High usage - Consider WiFi", color: "text-red-600" };
    } else if (percentage > 15) {
      return { text: "Moderate usage", color: "text-orange-600" };
    }
    return { text: "Low usage", color: "text-green-600" };
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
          <h1 className="text-2xl font-bold">Data Usage Optimizer</h1>
        </div>
        <p className="text-blue-100">Track and optimize your data consumption</p>
      </div>

      <div className="px-6 py-6 pb-24 space-y-6">
        {/* Total Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">30-Day Usage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {formatDataSize(totalUsage)}
              </div>
              <p className="text-gray-600 text-sm">Total data used this month</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Wifi className="text-blue-600" size={20} />
                  <span className="text-sm font-semibold text-blue-600">
                    {((wifiUsage / totalUsage) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDataSize(wifiUsage)}
                </div>
                <p className="text-xs text-gray-600">WiFi Usage</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Smartphone className="text-orange-600" size={20} />
                  <span className="text-sm font-semibold text-orange-600">
                    {((cellularUsage / totalUsage) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDataSize(cellularUsage)}
                </div>
                <p className="text-xs text-gray-600">Cellular Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Usage Breakdown */}
        {appUsage.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <PieChart className="mr-2" size={20} />
                Apps Using Most Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {appUsage.slice(0, 5).map((app, index) => {
                const recommendation = getUsageRecommendation(app);
                const percentage = (app.totalUsage / totalUsage) * 100;
                
                return (
                  <div key={app.appName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getAppIcon(app.appName)}</span>
                        <div>
                          <p className="font-medium text-sm">{app.appName}</p>
                          <p className={`text-xs ${recommendation.color}`}>
                            {recommendation.text}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatDataSize(app.totalUsage)}</p>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Optimization Tips */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="mr-2 text-green-600" size={20} />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cellularUsage > wifiUsage && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Use WiFi More Often</p>
                  <p className="text-xs text-gray-600">
                    You're using more cellular data than WiFi. Connect to WiFi when available to save data.
                  </p>
                </div>
              </div>
            )}
            
            {appUsage.length > 0 && appUsage[0].totalUsage > totalUsage * 0.3 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Limit {appUsage[0].appName} on Cellular
                  </p>
                  <p className="text-xs text-gray-600">
                    This app uses {((appUsage[0].totalUsage / totalUsage) * 100).toFixed(0)}% of your data. 
                    Consider using it only on WiFi.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Enable Data Saver</p>
                <p className="text-xs text-gray-600">
                  Turn on data saver mode in your apps to reduce consumption by up to 30%.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Download Content on WiFi</p>
                <p className="text-xs text-gray-600">
                  Download videos, music, and large files when connected to WiFi for offline use.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carrier Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Plan for You</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Based on your {formatDataSize(totalUsage)} monthly usage:
            </p>
            <div className="space-y-2">
              {totalUsage < 5120 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-semibold text-sm">SaskTel 5GB Plan</p>
                  <p className="text-xs text-gray-600">Perfect for your current usage with room to grow</p>
                </div>
              )}
              {totalUsage >= 5120 && totalUsage < 10240 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-semibold text-sm">Bell 10GB Plan</p>
                  <p className="text-xs text-gray-600">Good coverage for your usage pattern</p>
                </div>
              )}
              {totalUsage >= 10240 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-semibold text-sm">Telus Unlimited Plan</p>
                  <p className="text-xs text-gray-600">Best value for heavy data users</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
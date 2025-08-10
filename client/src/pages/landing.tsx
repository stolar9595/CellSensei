import { Link } from "wouter";
import { Gauge, Map, BarChart3, Signal, Wifi, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">SaskNet</h1>
          <p className="text-xl text-blue-100 mb-2">Network Diagnostics & Performance</p>
          <p className="text-blue-200 text-sm">
            Track and analyze carrier performance across Saskatchewan
          </p>
        </div>
        
        {/* App Preview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">4</div>
              <div className="text-xs text-blue-200">Major Carriers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Real-time</div>
              <div className="text-xs text-blue-200">Diagnostics</div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-6 text-blue-100">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-sasktel rounded-full"></div>
              <div className="text-xs">SaskTel</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-bell rounded-full"></div>
              <div className="text-xs">Bell</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-telus rounded-full"></div>
              <div className="text-xs">Telus</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-rogers rounded-full"></div>
              <div className="text-xs">Rogers</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/api/login">
            <Button 
              className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl shadow-lg"
              size="lg"
            >
              Get Started
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          What You Can Do
        </h2>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Gauge className="text-orange-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Speed Testing</h3>
                  <p className="text-gray-600 text-sm">
                    Run comprehensive network speed tests with detailed results for download, upload, and latency
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Map className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tower Mapping</h3>
                  <p className="text-gray-600 text-sm">
                    Find nearby cell towers and visualize coverage areas across Saskatchewan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BarChart3 className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Performance History</h3>
                  <p className="text-gray-600 text-sm">
                    Track your network performance over time with detailed analytics and comparisons
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Signal className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real-time Monitoring</h3>
                  <p className="text-gray-600 text-sm">
                    Monitor signal strength, network type, and carrier information in real-time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-6 py-8 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Perfect for Saskatchewan
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-gray-700">Compare all major carriers in one place</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-gray-700">Optimize your plan based on real data</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-gray-700">Find the best coverage in your area</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-gray-700">Track performance improvements</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-xl"
            size="lg"
          >
            Start Testing Your Network
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 text-center">
        <div className="text-xs text-gray-500 mb-2">
          Built for Saskatchewan residents
        </div>
        <div className="text-xs text-gray-400">
          Track SaskTel, Bell, Telus, and Rogers performance
        </div>
      </div>
    </div>
  );
}
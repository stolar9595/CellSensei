import { useState } from "react";
import { Bell, MapPin, Download, Shield, HelpCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BottomNavigation } from "@/components/bottom-navigation";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [autoTests, setAutoTests] = useState(false);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-blue-100">Customize your SaskNet experience</p>
      </div>

      <div className="px-6 py-6 pb-24 space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell size={20} />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-gray-500">Get notified about network issues and test results</div>
              </div>
              <Switch 
                checked={notifications} 
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin size={20} />
              <span>Privacy & Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Location Tracking</div>
                <div className="text-sm text-gray-500">Allow location access for tower mapping and better results</div>
              </div>
              <Switch 
                checked={locationTracking} 
                onCheckedChange={setLocationTracking}
              />
            </div>
            
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2" size={16} />
                Privacy Policy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Testing Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download size={20} />
              <span>Testing Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Automatic Speed Tests</div>
                <div className="text-sm text-gray-500">Run tests automatically when network changes</div>
              </div>
              <Switch 
                checked={autoTests} 
                onCheckedChange={setAutoTests}
              />
            </div>

            <div className="pt-4 border-t space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Export Test Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Clear Test History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support & Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle size={20} />
              <span>Support & Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Help & FAQ
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Contact Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Report a Problem
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Info className="mr-2" size={16} />
              About SaskNet
            </Button>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary mb-2">SaskNet</div>
            <div className="text-sm text-gray-500 mb-2">Version 1.0.0</div>
            <div className="text-xs text-gray-400">
              Network diagnostics for Saskatchewan's mobile carriers
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Built with ❤️ for Saskatchewan residents
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}

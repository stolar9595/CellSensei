import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle, MapPin, Clock, ChevronLeft, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { CarrierDot } from "@/components/carrier-colors";
import { type OutageReport } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCurrentLocation } from "@/lib/geolocation";

export default function Outages() {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("SaskTel");
  const [issueType, setIssueType] = useState("slow_speed");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const { data: outages = [], isLoading } = useQuery<OutageReport[]>({
    queryKey: ["/api/outage-reports"],
  });

  const createOutageReport = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/outage-reports", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outage-reports"] });
      setShowReportDialog(false);
      setDescription("");
      toast({
        title: "Outage reported",
        description: "Thank you for reporting the network issue.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to report outage",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleReportOutage = async () => {
    const location = await getCurrentLocation();
    if (!location) {
      toast({
        title: "Location required",
        description: "Please enable location services to report an outage.",
        variant: "destructive",
      });
      return;
    }

    createOutageReport.mutate({
      carrier: selectedCarrier,
      latitude: location.latitude,
      longitude: location.longitude,
      issueType,
      description,
    });
  };

  const activeOutages = outages.filter(o => !o.resolved);
  const resolvedOutages = outages.filter(o => o.resolved);

  const getTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const reportTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - reportTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case "no_signal": return "No Signal";
      case "slow_speed": return "Slow Speed";
      case "intermittent": return "Intermittent Connection";
      default: return type;
    }
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
          <h1 className="text-2xl font-bold">Network Outages</h1>
        </div>
        <p className="text-blue-100">Community-reported network issues</p>
      </div>

      <div className="px-6 py-6 pb-24 space-y-6">
        {/* Report Button */}
        <Button 
          onClick={() => setShowReportDialog(true)}
          className="w-full bg-red-500 hover:bg-red-600"
          size="lg"
        >
          <AlertTriangle className="mr-2" size={20} />
          Report Network Issue
        </Button>

        {/* Active Outages */}
        {activeOutages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="text-red-500 mr-2" size={20} />
                Active Issues ({activeOutages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeOutages.map(outage => (
                <div key={outage.id} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <CarrierDot carrier={outage.carrier} />
                      <span className="font-semibold text-sm">{outage.carrier}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {getIssueTypeLabel(outage.issueType)}
                    </Badge>
                  </div>
                  {outage.description && (
                    <p className="text-sm text-gray-600 mb-1">{outage.description}</p>
                  )}
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      {getTimeAgo(outage.timestamp)}
                    </span>
                    <span className="flex items-center">
                      <MapPin size={12} className="mr-1" />
                      {outage.latitude.toFixed(2)}, {outage.longitude.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Resolved Outages */}
        {resolvedOutages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="text-green-500 mr-2" size={20} />
                Recently Resolved ({resolvedOutages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resolvedOutages.slice(0, 5).map(outage => (
                <div key={outage.id} className="border-l-4 border-green-500 pl-4 py-2 opacity-75">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <CarrierDot carrier={outage.carrier} />
                      <span className="font-medium text-sm">{outage.carrier}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-green-600">
                      Resolved
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {getIssueTypeLabel(outage.issueType)} • {getTimeAgo(outage.timestamp)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Outages Message */}
        {!isLoading && activeOutages.length === 0 && resolvedOutages.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
              <h3 className="font-semibold text-gray-900 mb-2">All Networks Operational</h3>
              <p className="text-gray-600 text-sm">No network issues reported in your area</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Outage Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Network Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Carrier</Label>
              <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SaskTel">SaskTel</SelectItem>
                  <SelectItem value="Bell">Bell</SelectItem>
                  <SelectItem value="Telus">Telus</SelectItem>
                  <SelectItem value="Rogers">Rogers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Issue Type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_signal">No Signal</SelectItem>
                  <SelectItem value="slow_speed">Slow Speed</SelectItem>
                  <SelectItem value="intermittent">Intermittent Connection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Description (Optional)</Label>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional details about the issue..."
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowReportDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReportOutage}
                className="flex-1 bg-red-500 hover:bg-red-600"
                disabled={createOutageReport.isPending}
              >
                Report Issue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
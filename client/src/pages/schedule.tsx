import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Clock, Play, Pause, Plus, ChevronLeft, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type ScheduledTest } from "@shared/schema";

export default function Schedule() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const { toast } = useToast();

  const { data: scheduledTests = [], isLoading } = useQuery<ScheduledTest[]>({
    queryKey: ["/api/scheduled-tests"],
  });

  const createScheduledTest = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/scheduled-tests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-tests"] });
      setShowCreateDialog(false);
      toast({
        title: "Test schedule created",
        description: "Automated tests will run according to your schedule.",
      });
    },
  });

  const updateScheduledTest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/scheduled-tests/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-tests"] });
      toast({
        title: "Schedule updated",
        description: "Your test schedule has been updated.",
      });
    },
  });

  const handleToggleSchedule = (test: ScheduledTest) => {
    updateScheduledTest.mutate({
      id: test.id,
      updates: { enabled: !test.enabled },
    });
  };

  const handleCreateSchedule = () => {
    const times = frequency === "hourly" 
      ? ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
      : frequency === "daily" 
      ? ["09:00", "12:00", "15:00", "18:00", "21:00"]
      : ["Monday 12:00", "Wednesday 12:00", "Friday 12:00"];

    createScheduledTest.mutate({
      frequency,
      times,
      enabled: true,
      nextRun: new Date(Date.now() + 3600000), // 1 hour from now
    });
  };

  const getNextRunTime = (test: ScheduledTest) => {
    if (!test.nextRun) return "Not scheduled";
    const next = new Date(test.nextRun);
    const now = new Date();
    const diffInHours = Math.floor((next.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Within an hour";
    if (diffInHours < 24) return `In ${diffInHours} hours`;
    return next.toLocaleDateString();
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "hourly": return "Every Hour";
      case "daily": return "Daily";
      case "weekly": return "Weekly";
      default: return freq;
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
          <h1 className="text-2xl font-bold">Automated Testing</h1>
        </div>
        <p className="text-blue-100">Schedule automatic speed tests to track performance over time</p>
      </div>

      <div className="px-6 py-6 pb-24 space-y-6">
        {/* Create Schedule Button */}
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="w-full bg-green-500 hover:bg-green-600"
          size="lg"
        >
          <Plus className="mr-2" size={20} />
          Create Test Schedule
        </Button>

        {/* Scheduled Tests */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading schedules...</p>
          </div>
        ) : scheduledTests.length > 0 ? (
          <div className="space-y-4">
            {scheduledTests.map(test => (
              <Card key={test.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="mr-2" size={20} />
                      {getFrequencyLabel(test.frequency)}
                    </CardTitle>
                    <Switch 
                      checked={test.enabled}
                      onCheckedChange={() => handleToggleSchedule(test)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <Badge variant={test.enabled ? "default" : "secondary"}>
                        {test.enabled ? (
                          <>
                            <Play size={12} className="mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause size={12} className="mr-1" />
                            Paused
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Next Run</span>
                      <span className="font-medium">{getNextRunTime(test)}</span>
                    </div>
                    
                    {test.lastRun && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Run</span>
                        <span className="font-medium">
                          {new Date(test.lastRun).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {test.times && test.times.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">Test Times:</p>
                        <div className="flex flex-wrap gap-1">
                          {test.times.slice(0, 5).map((time, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {time}
                            </Badge>
                          ))}
                          {test.times.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{test.times.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="text-gray-400 mx-auto mb-4" size={48} />
              <h3 className="font-semibold text-gray-900 mb-2">No Schedules Yet</h3>
              <p className="text-gray-600 text-sm">
                Create a test schedule to automatically track network performance
              </p>
            </CardContent>
          </Card>
        )}

        {/* Benefits Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Why Schedule Tests?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">
                Track network performance patterns throughout the day
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">
                Identify peak congestion times and slow periods
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">
                Build comprehensive data for network analysis
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">
                Get notifications about significant performance changes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Test Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Test Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily (5 times)</SelectItem>
                  <SelectItem value="weekly">Weekly (3 times)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                {frequency === "hourly" && "Tests will run every hour, 24 times per day"}
                {frequency === "daily" && "Tests will run 5 times daily at 9am, 12pm, 3pm, 6pm, and 9pm"}
                {frequency === "weekly" && "Tests will run 3 times per week on Monday, Wednesday, and Friday"}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSchedule}
                className="flex-1 bg-green-500 hover:bg-green-600"
                disabled={createScheduledTest.isPending}
              >
                Create Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
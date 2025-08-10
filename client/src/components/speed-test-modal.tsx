import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, detectNetworkInfo } from "@/lib/geolocation";

interface SpeedTestResult {
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  jitter: number;
}

interface SpeedTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpeedTestModal({ isOpen, onClose }: SpeedTestModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<"download" | "upload" | "ping" | "complete">("download");
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [results, setResults] = useState<Partial<SpeedTestResult>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveSpeedTest = useMutation({
    mutationFn: async (testData: any) => {
      return apiRequest("POST", "/api/speed-tests", testData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/speed-tests"] });
      toast({
        title: "Speed test saved",
        description: "Your speed test results have been recorded.",
      });
    },
  });

  const runSpeedTest = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/speed-test/run");
      return response.json();
    },
  });

  const startSpeedTest = async () => {
    setIsRunning(true);
    setPhase("download");
    setProgress(0);
    setCurrentSpeed(0);
    setResults({});

    try {
      // Get location and network info
      const location = await getCurrentLocation();
      const networkInfo = await detectNetworkInfo();

      // Simulate speed test phases
      await simulateDownloadTest();
      await simulateUploadTest();
      await simulatePingTest();

      // Get final results from server
      const testResults = await runSpeedTest.mutateAsync();
      
      setResults(testResults);
      setPhase("complete");

      // Save results to database
      await saveSpeedTest.mutateAsync({
        ...testResults,
        carrier: networkInfo.carrier,
        networkType: networkInfo.networkType,
        signalStrength: networkInfo.signalStrength,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

    } catch (error) {
      toast({
        title: "Speed test failed",
        description: "Unable to complete the speed test. Please try again.",
        variant: "destructive",
      });
      setIsRunning(false);
    }
  };

  const simulateDownloadTest = async () => {
    setPhase("download");
    for (let i = 0; i <= 100; i += 2) {
      setProgress(i / 3);
      setCurrentSpeed(Math.random() * 80 + 20);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const simulateUploadTest = async () => {
    setPhase("upload");
    for (let i = 0; i <= 100; i += 2) {
      setProgress(33 + i / 3);
      setCurrentSpeed(Math.random() * 30 + 10);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const simulatePingTest = async () => {
    setPhase("ping");
    for (let i = 0; i <= 100; i += 5) {
      setProgress(66 + i / 3);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const handleClose = () => {
    if (!isRunning) {
      onClose();
      setResults({});
      setProgress(0);
      setCurrentSpeed(0);
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case "download": return "Testing Download Speed...";
      case "upload": return "Testing Upload Speed...";
      case "ping": return "Testing Latency...";
      case "complete": return "Test Complete!";
      default: return "Initializing...";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm p-8">
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Speed Test</h3>
          <p className="text-gray-600 text-sm">{getPhaseText()}</p>
        </div>

        {/* Speed Test Progress Circle */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div 
            className="speed-circle w-full h-full rounded-full flex items-center justify-center"
            style={{ "--progress": `${(progress / 100) * 360}deg` } as any}
          >
            <div className="bg-white w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-inner">
              <div className="text-3xl font-bold text-gray-900">
                {phase === "complete" ? results.downloadSpeed?.toFixed(1) : currentSpeed.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">
                {phase === "ping" ? "ms" : "Mbps"}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Test Results Preview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Down</div>
            <div className="font-bold text-green-600">
              {results.downloadSpeed ? `${results.downloadSpeed.toFixed(1)}` : "--"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Up</div>
            <div className="font-bold text-blue-600">
              {results.uploadSpeed ? `${results.uploadSpeed.toFixed(1)}` : "--"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Ping</div>
            <div className="font-bold text-orange-600">
              {results.ping ? `${results.ping}` : "--"}
            </div>
          </div>
        </div>

        {!isRunning ? (
          <div className="space-y-2">
            {phase !== "complete" && (
              <Button onClick={startSpeedTest} className="w-full">
                Start Speed Test
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="w-full"
            >
              {phase === "complete" ? "Close" : "Cancel"}
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => {
              setIsRunning(false);
              handleClose();
            }}
            className="w-full"
          >
            Cancel Test
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

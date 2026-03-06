import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, detectNetworkInfo } from "@/lib/geolocation";
import { X, Download, Upload, Clock, ArrowDown, ArrowUp, Zap, CheckCircle2, Loader2 } from "lucide-react";

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
  const [phase, setPhase] = useState<"idle" | "download" | "upload" | "ping" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [results, setResults] = useState<Partial<SpeedTestResult>>({});
  const cancelledRef = useRef(false);
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
    cancelledRef.current = false;
    setIsRunning(true);
    setPhase("download");
    setProgress(0);
    setCurrentSpeed(0);
    setResults({});

    try {
      const location = await getCurrentLocation();
      const networkInfo = await detectNetworkInfo();

      await simulateDownloadTest();
      if (cancelledRef.current) return;
      await simulateUploadTest();
      if (cancelledRef.current) return;
      await simulatePingTest();
      if (cancelledRef.current) return;

      const testResults = await runSpeedTest.mutateAsync();
      if (cancelledRef.current) return;

      setResults(testResults);
      setPhase("complete");

      await saveSpeedTest.mutateAsync({
        ...testResults,
        carrier: networkInfo.carrier,
        networkType: networkInfo.networkType,
        signalStrength: networkInfo.signalStrength,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      setIsRunning(false);
    } catch (error) {
      if (cancelledRef.current) return;
      toast({
        title: "Speed test failed",
        description: "Unable to complete the speed test. Please try again.",
        variant: "destructive",
      });
      setIsRunning(false);
      setPhase("idle");
    }
  };

  const cancelTest = () => {
    cancelledRef.current = true;
    setIsRunning(false);
    setPhase("idle");
    setProgress(0);
    setCurrentSpeed(0);
  };

  const simulateDownloadTest = async () => {
    setPhase("download");
    for (let i = 0; i <= 100; i += 2) {
      if (cancelledRef.current) return;
      setProgress(i / 3);
      setCurrentSpeed(Math.random() * 80 + 20);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  const simulateUploadTest = async () => {
    setPhase("upload");
    for (let i = 0; i <= 100; i += 2) {
      if (cancelledRef.current) return;
      setProgress(33 + i / 3);
      setCurrentSpeed(Math.random() * 30 + 10);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  const simulatePingTest = async () => {
    setPhase("ping");
    for (let i = 0; i <= 100; i += 5) {
      if (cancelledRef.current) return;
      setProgress(66 + i / 3);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  const handleClose = () => {
    if (!isRunning) {
      onClose();
      setResults({});
      setProgress(0);
      setCurrentSpeed(0);
      setPhase("idle");
    }
  };

  const phaseLabel = () => {
    switch (phase) {
      case "download": return "Testing download...";
      case "upload": return "Testing upload...";
      case "ping": return "Measuring latency...";
      case "complete": return "Test complete";
      default: return "Ready to test";
    }
  };

  const displayValue = () => {
    if (phase === "complete") return results.downloadSpeed?.toFixed(1) || "0";
    if (phase === "idle") return "--";
    return currentSpeed.toFixed(1);
  };

  const displayUnit = () => {
    if (phase === "ping") return "ms";
    return "Mbps";
  };

  const progressPct = Math.min(100, Math.max(0, progress));
  const strokeDasharray = 2 * Math.PI * 88;
  const strokeDashoffset = strokeDasharray - (progressPct / 100) * strokeDasharray;

  const phaseColor = () => {
    switch (phase) {
      case "download": return "#22c55e";
      case "upload": return "#3b82f6";
      case "ping": return "#f59e0b";
      case "complete": return "#22c55e";
      default: return "#d1d5db";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[360px] p-0 gap-0 rounded-2xl overflow-hidden border-0 shadow-2xl [&>button]:hidden">
        <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 text-white px-6 pt-5 pb-8">
          <button
            onClick={handleClose}
            disabled={isRunning}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
          >
            <X size={16} className="text-white" />
          </button>

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold tracking-tight">Speed Test</h3>
            <p className="text-sm text-gray-400 mt-0.5">{phaseLabel()}</p>
          </div>

          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
              />
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke={phaseColor()}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={phase === "idle" ? strokeDasharray : strokeDashoffset}
                className="transition-all duration-300 ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${phaseColor()}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isRunning && phase !== "complete" ? (
                <>
                  <span className="text-4xl font-bold tabular-nums tracking-tight">
                    {displayValue()}
                  </span>
                  <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                    {displayUnit()}
                  </span>
                </>
              ) : phase === "complete" ? (
                <>
                  <CheckCircle2 size={20} className="text-green-400 mb-1" />
                  <span className="text-4xl font-bold tabular-nums tracking-tight">
                    {displayValue()}
                  </span>
                  <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                    Mbps
                  </span>
                </>
              ) : (
                <>
                  <Zap size={28} className="text-gray-500 mb-1" />
                  <span className="text-sm text-gray-500">Tap Start</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white px-6 py-5">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-3 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowDown size={12} className="text-green-600" />
                <span className="text-[10px] uppercase tracking-wider text-green-600 font-medium">Down</span>
              </div>
              <span className="text-lg font-bold text-green-700 tabular-nums">
                {results.downloadSpeed ? results.downloadSpeed.toFixed(1) : "--"}
              </span>
              <span className="text-[10px] text-green-500 block">Mbps</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowUp size={12} className="text-blue-600" />
                <span className="text-[10px] uppercase tracking-wider text-blue-600 font-medium">Up</span>
              </div>
              <span className="text-lg font-bold text-blue-700 tabular-nums">
                {results.uploadSpeed ? results.uploadSpeed.toFixed(1) : "--"}
              </span>
              <span className="text-[10px] text-blue-500 block">Mbps</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock size={12} className="text-amber-600" />
                <span className="text-[10px] uppercase tracking-wider text-amber-600 font-medium">Ping</span>
              </div>
              <span className="text-lg font-bold text-amber-700 tabular-nums">
                {results.ping ? results.ping : "--"}
              </span>
              <span className="text-[10px] text-amber-500 block">ms</span>
            </div>
          </div>

          {!isRunning && phase !== "complete" && (
            <Button
              onClick={startSpeedTest}
              className="w-full h-12 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Zap size={16} className="mr-2" />
              Start Speed Test
            </Button>
          )}

          {isRunning && (
            <Button
              variant="outline"
              onClick={cancelTest}
              className="w-full h-12 rounded-xl text-sm font-medium border-gray-200"
            >
              Cancel Test
            </Button>
          )}

          {!isRunning && phase === "complete" && (
            <div className="flex gap-2">
              <Button
                onClick={startSpeedTest}
                variant="outline"
                className="flex-1 h-12 rounded-xl text-sm font-medium border-gray-200"
              >
                <Loader2 size={14} className="mr-1.5" />
                Run Again
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 h-12 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

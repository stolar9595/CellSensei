import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import SpeedTest from "@/pages/speed-test";
import TowerMap from "@/pages/tower-map";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import Comparison from "@/pages/comparison";
import Outages from "@/pages/outages";
import Schedule from "@/pages/schedule";
import DataUsagePage from "@/pages/data-usage";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/speed-test" component={SpeedTest} />
          <Route path="/tower-map" component={TowerMap} />
          <Route path="/history" component={History} />
          <Route path="/comparison" component={Comparison} />
          <Route path="/outages" component={Outages} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/data-usage" component={DataUsagePage} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

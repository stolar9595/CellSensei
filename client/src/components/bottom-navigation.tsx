import { Link, useLocation } from "wouter";
import { Home, Gauge, Map, BarChart3, Settings } from "lucide-react";

const navigationItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/speed-test", icon: Gauge, label: "Speed Test" },
  { path: "/tower-map", icon: Map, label: "Map" },
  { path: "/history", icon: BarChart3, label: "History" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
      <div className="grid grid-cols-5 py-2">
        {navigationItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <button className={`flex flex-col items-center py-2 px-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'
              }`}>
                <Icon className="text-lg mb-1" size={20} />
                <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

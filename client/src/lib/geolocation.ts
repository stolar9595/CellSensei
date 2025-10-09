export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface NetworkInfoData {
  carrier: string;
  networkType: string;
  signalStrength: number;
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Return null for graceful degradation when location access is denied
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

export async function detectNetworkInfo(): Promise<NetworkInfoData> {
  // Try to detect network information using browser APIs
  let carrier = "Unknown";
  let networkType = "Unknown";
  let signalStrength = -999;

  try {
    // Check if we're in Canada (Saskatchewan) and try to detect carrier
    const location = await getCurrentLocation();
    if (location) {
      // Saskatchewan coordinates roughly: lat 49-60, lng -102 to -109
      if (location.latitude >= 49 && location.latitude <= 60 && 
          location.longitude >= -109 && location.longitude <= -102) {
        
        // Simulate carrier detection based on common patterns
        // In a real app, this would use actual network APIs
        const carriers = ["SaskTel", "Bell", "Telus", "Rogers"];
        carrier = carriers[Math.floor(Math.random() * carriers.length)];
      }
    }

    // Try to get network information from navigator
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        // Map connection types to carrier network types
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            networkType = '2G';
            break;
          case '3g':
            networkType = '3G';
            break;
          case '4g':
            networkType = '4G LTE';
            break;
          default:
            networkType = '4G LTE'; // Default assumption
        }

        // Estimate signal strength based on connection quality
        if (connection.downlink) {
          if (connection.downlink > 10) signalStrength = -60; // Excellent
          else if (connection.downlink > 5) signalStrength = -75; // Good
          else if (connection.downlink > 1) signalStrength = -90; // Fair
          else signalStrength = -110; // Poor
        }
      }
    }

    // Fallback values if detection fails
    if (carrier === "Unknown") carrier = "SaskTel"; // Default for Saskatchewan
    if (networkType === "Unknown") networkType = "4G LTE";
    if (signalStrength === -999) signalStrength = -75; // Reasonable default

  } catch (error) {
    console.error("Network detection error:", error);
    // Use fallback values
    carrier = "SaskTel";
    networkType = "4G LTE";
    signalStrength = -75;
  }

  return {
    carrier,
    networkType,
    signalStrength,
  };
}

export function watchLocation(callback: (location: LocationData) => void): () => void {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by this browser");
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => {
      console.error("Geolocation watch error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

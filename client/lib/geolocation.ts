/**
 * Geolocation Service for Whistle App
 * Handles location capture and management
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export interface GeolocationError {
  code: number;
  message: string;
}

/**
 * Get current user location using HTML5 Geolocation API
 */
export function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: "Geolocation is not supported by this browser",
      });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        resolve(locationData);
      },
      (error) => {
        const geolocationError: GeolocationError = {
          code: error.code,
          message: getGeolocationErrorMessage(error.code),
        };
        reject(geolocationError);
      },
      options,
    );
  });
}

/**
 * Get user-friendly error messages for geolocation errors
 */
function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location access denied by user";
    case 2:
      return "Location information unavailable";
    case 3:
      return "Location request timeout";
    default:
      return "Unknown error occurred while getting location";
  }
}

/**
 * Reverse geocoding using OpenStreetMap Nominatim API
 * Note: In production, consider using a paid service for better reliability
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Whistle Anonymous Reporting App",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Geocoding service unavailable");
    }

    const data = await response.json();

    if (data && data.display_name) {
      return data.display_name;
    } else {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  } catch (error) {
    console.warn("Reverse geocoding failed:", error);
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

/**
 * Check if geolocation is available and permissions
 */
export async function checkGeolocationSupport(): Promise<{
  supported: boolean;
  permissionState?: PermissionState;
}> {
  if (!navigator.geolocation) {
    return { supported: false };
  }

  try {
    // Check permission status if available
    if ("permissions" in navigator) {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      return {
        supported: true,
        permissionState: permission.state,
      };
    }

    return { supported: true };
  } catch (error) {
    return { supported: true }; // Assume supported if permission check fails
  }
}

/**
 * Watch position changes (for continuous tracking if needed)
 */
export function watchLocation(
  onLocationUpdate: (location: LocationData) => void,
  onError: (error: GeolocationError) => void,
): number | null {
  if (!navigator.geolocation) {
    onError({
      code: 0,
      message: "Geolocation is not supported",
    });
    return null;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000, // 1 minute
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
      onLocationUpdate(locationData);
    },
    (error) => {
      const geolocationError: GeolocationError = {
        code: error.code,
        message: getGeolocationErrorMessage(error.code),
      };
      onError(geolocationError);
    },
    options,
  );
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Format location for display
 */
export function formatLocation(location: LocationData): string {
  const lat = location.latitude.toFixed(6);
  const lon = location.longitude.toFixed(6);
  let accuracy = Math.round(location.accuracy);

  // Handle extremely poor accuracy values (likely GPS errors)
  if (accuracy > 100000) {
    // If accuracy is worse than 100km, it's likely a GPS error
    accuracy = Math.min(accuracy, 50); // Cap at reasonable 50m for display
    return `${lat}, ${lon} (±${accuracy}m*)`;
  } else if (accuracy > 1000) {
    // Show in kilometers for large values
    const accuracyKm = (accuracy / 1000).toFixed(1);
    return `${lat}, ${lon} (±${accuracyKm}km)`;
  }

  return `${lat}, ${lon} (±${accuracy}m)`;
}

/**
 * Calculate distance between two locations (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

/**
 * Check if location is within a certain radius of another location
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number,
): boolean {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
}

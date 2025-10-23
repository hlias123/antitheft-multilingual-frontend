import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Location } from '@/types';
import { LOCATION_CONFIG } from '@/utils/constants';
import { generateId, isValidCoordinate } from '@/utils/helpers';
import StorageService from './StorageService';
import NetworkService from './NetworkService';

/**
 * Location Service for high-precision GPS tracking
 */
class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private isTracking = false;
  private locationHistory: Location[] = [];
  private lastKnownLocation: Location | null = null;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Initialize location service
   */
  public async initialize(): Promise<void> {
    try {
      // Configure Geolocation
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
        enableBackgroundLocationUpdates: true,
        locationProvider: 'auto',
      });

      // Load location history from storage
      await this.loadLocationHistory();

      console.log('✅ LocationService initialized');
    } catch (error) {
      console.error('❌ LocationService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Request location permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        ]);

        const fineLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted';
        const coarseLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === 'granted';

        return fineLocationGranted && coarseLocationGranted;
      }

      // iOS permissions are handled automatically
      return true;
    } catch (error) {
      console.error('❌ Location permission request failed:', error);
      return false;
    }
  }

  /**
   * Start location tracking
   */
  public async startTracking(): Promise<void> {
    try {
      if (this.isTracking) {
        console.log('⚠️ Location tracking already active');
        return;
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permissions not granted');
      }

      // Start watching position
      this.watchId = Geolocation.watchPosition(
        (position) => {
          this.handleLocationUpdate(position);
        },
        (error) => {
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 1000,
          distanceFilter: 1, // Update every 1 meter
          interval: LOCATION_CONFIG.UPDATE_INTERVAL,
          fastestInterval: 5000,
        }
      );

      this.isTracking = true;
      console.log('✅ Location tracking started');
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      throw error;
    }
  }

  /**
   * Stop location tracking
   */
  public async stopTracking(): Promise<void> {
    try {
      if (this.watchId !== null) {
        Geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      this.isTracking = false;
      console.log('✅ Location tracking stopped');
    } catch (error) {
      console.error('❌ Failed to stop location tracking:', error);
      throw error;
    }
  }

  /**
   * Get current location
   */
  public async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location = this.createLocationObject(position);
          resolve(location);
        },
        (error) => {
          console.error('❌ Failed to get current location:', error);
          reject(new Error('Failed to get current location'));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    });
  }

  /**
   * Handle location update
   */
  private handleLocationUpdate(position: GeolocationPosition): void {
    try {
      const location = this.createLocationObject(position);

      // Validate location accuracy
      if (location.accuracy > LOCATION_CONFIG.HIGH_ACCURACY_THRESHOLD) {
        console.log(`⚠️ Location accuracy too low: ${location.accuracy}m`);
        return;
      }

      // Validate coordinates
      if (!isValidCoordinate(location.latitude, location.longitude)) {
        console.log('⚠️ Invalid coordinates received');
        return;
      }

      // Update last known location
      this.lastKnownLocation = location;

      // Add to history
      this.addToHistory(location);

      // Send to backend
      this.sendLocationUpdate(location);

      console.log(`📍 Location updated: ${location.latitude}, ${location.longitude} (±${location.accuracy}m)`);
    } catch (error) {
      console.error('❌ Error handling location update:', error);
    }
  }

  /**
   * Handle location error
   */
  private handleLocationError(error: GeolocationError): void {
    console.error('❌ Location error:', error);
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        console.error('Location permission denied');
        break;
      case 2: // POSITION_UNAVAILABLE
        console.error('Location position unavailable');
        break;
      case 3: // TIMEOUT
        console.error('Location request timeout');
        break;
      default:
        console.error('Unknown location error');
    }
  }

  /**
   * Create location object from position
   */
  private createLocationObject(position: GeolocationPosition): Location {
    return {
      id: generateId(),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy || 0,
      altitude: position.coords.altitude || 0,
      speed: position.coords.speed || 0,
      heading: position.coords.heading || 0,
      timestamp: new Date(position.timestamp),
      address: '', // Will be filled by reverse geocoding
      deviceId: '', // Will be filled by device service
    };
  }

  /**
   * Add location to history
   */
  private addToHistory(location: Location): void {
    this.locationHistory.unshift(location);

    // Keep only recent locations
    if (this.locationHistory.length > LOCATION_CONFIG.MAX_LOCATION_HISTORY) {
      this.locationHistory = this.locationHistory.slice(0, LOCATION_CONFIG.MAX_LOCATION_HISTORY);
    }

    // Save to storage periodically
    this.saveLocationHistory();
  }

  /**
   * Send location update to backend
   */
  private async sendLocationUpdate(location: Location): Promise<void> {
    try {
      await NetworkService.post('/location/update', {
        location,
        timestamp: location.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('❌ Failed to send location update:', error);
      // Queue for later retry
      this.queueLocationUpdate(location);
    }
  }

  /**
   * Queue location update for retry
   */
  private async queueLocationUpdate(location: Location): Promise<void> {
    try {
      const queue = await StorageService.getObject<Location[]>('location_queue') || [];
      queue.push(location);
      
      // Keep only last 100 queued locations
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }
      
      await StorageService.setObject('location_queue', queue);
    } catch (error) {
      console.error('❌ Failed to queue location update:', error);
    }
  }

  /**
   * Process queued location updates
   */
  public async processQueuedUpdates(): Promise<void> {
    try {
      const queue = await StorageService.getObject<Location[]>('location_queue') || [];
      
      if (queue.length === 0) {
        return;
      }

      // Send queued locations
      for (const location of queue) {
        try {
          await NetworkService.post('/location/update', {
            location,
            timestamp: location.timestamp.toISOString(),
          });
        } catch (error) {
          console.error('❌ Failed to send queued location:', error);
          break; // Stop processing if network is still unavailable
        }
      }

      // Clear processed queue
      await StorageService.removeItem('location_queue');
      console.log(`✅ Processed ${queue.length} queued location updates`);
    } catch (error) {
      console.error('❌ Failed to process queued updates:', error);
    }
  }

  /**
   * Get location history
   */
  public getLocationHistory(): Location[] {
    return [...this.locationHistory];
  }

  /**
   * Get last known location
   */
  public getLastKnownLocation(): Location | null {
    return this.lastKnownLocation;
  }

  /**
   * Clear location history
   */
  public async clearLocationHistory(): Promise<void> {
    try {
      this.locationHistory = [];
      await StorageService.removeItem('location_history');
      console.log('✅ Location history cleared');
    } catch (error) {
      console.error('❌ Failed to clear location history:', error);
      throw error;
    }
  }

  /**
   * Save location history to storage
   */
  private async saveLocationHistory(): Promise<void> {
    try {
      // Save only recent locations to avoid storage bloat
      const recentHistory = this.locationHistory.slice(0, 500);
      await StorageService.setObject('location_history', recentHistory);
    } catch (error) {
      console.error('❌ Failed to save location history:', error);
    }
  }

  /**
   * Load location history from storage
   */
  private async loadLocationHistory(): Promise<void> {
    try {
      const history = await StorageService.getObject<Location[]>('location_history');
      if (history) {
        this.locationHistory = history;
        
        // Set last known location
        if (history.length > 0) {
          this.lastKnownLocation = history[0];
        }
      }
    } catch (error) {
      console.error('❌ Failed to load location history:', error);
    }
  }

  /**
   * Get tracking status
   */
  public isLocationTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Calculate distance between two locations
   */
  public calculateDistance(location1: Location, location2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (location1.latitude * Math.PI) / 180;
    const φ2 = (location2.latitude * Math.PI) / 180;
    const Δφ = ((location2.latitude - location1.latitude) * Math.PI) / 180;
    const Δλ = ((location2.longitude - location1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Get location statistics
   */
  public getLocationStats(): {
    totalLocations: number;
    averageAccuracy: number;
    lastUpdate: Date | null;
    trackingDuration: number;
  } {
    const totalLocations = this.locationHistory.length;
    const averageAccuracy = totalLocations > 0
      ? this.locationHistory.reduce((sum, loc) => sum + loc.accuracy, 0) / totalLocations
      : 0;
    
    const lastUpdate = this.lastKnownLocation?.timestamp || null;
    
    const trackingDuration = totalLocations > 1
      ? this.locationHistory[0].timestamp.getTime() - this.locationHistory[totalLocations - 1].timestamp.getTime()
      : 0;

    return {
      totalLocations,
      averageAccuracy,
      lastUpdate,
      trackingDuration,
    };
  }
}

// Export singleton instance
export default LocationService.getInstance();
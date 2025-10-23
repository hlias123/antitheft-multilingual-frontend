import { Location } from '@/types';
import StorageService from './StorageService';
import NetworkService from './NetworkService';

interface GeocodingResult {
  address: string;
  city: string;
  country: string;
  postalCode: string;
  region: string;
}

interface GeocodingCache {
  [key: string]: {
    result: GeocodingResult;
    timestamp: number;
  };
}

/**
 * Geocoding Service for converting coordinates to addresses
 */
class GeocodingService {
  private static instance: GeocodingService;
  private cache: GeocodingCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_KEY = 'geocoding_cache';

  public static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Initialize geocoding service
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadCache();
      console.log('✅ GeocodingService initialized');
    } catch (error) {
      console.error('❌ GeocodingService initialization failed:', error);
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  public async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      
      // Check cache first
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        return this.formatAddress(cachedResult);
      }

      // Try multiple geocoding services
      let result: GeocodingResult | null = null;

      // Try Google Geocoding API first
      try {
        result = await this.googleReverseGeocode(latitude, longitude);
      } catch (error) {
        console.log('Google geocoding failed, trying alternative...');
      }

      // Fallback to OpenStreetMap Nominatim
      if (!result) {
        try {
          result = await this.nominatimReverseGeocode(latitude, longitude);
        } catch (error) {
          console.log('Nominatim geocoding failed');
        }
      }

      // Fallback to basic coordinate display
      if (!result) {
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      // Cache the result
      this.cacheResult(cacheKey, result);

      return this.formatAddress(result);
    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  /**
   * Google Geocoding API
   */
  private async googleReverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with actual API key
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}&language=ar`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('Google geocoding failed');
    }

    const result = data.results[0];
    const components = result.address_components;

    return {
      address: result.formatted_address,
      city: this.extractComponent(components, 'locality') || 
            this.extractComponent(components, 'administrative_area_level_2') || '',
      country: this.extractComponent(components, 'country') || '',
      postalCode: this.extractComponent(components, 'postal_code') || '',
      region: this.extractComponent(components, 'administrative_area_level_1') || '',
    };
  }

  /**
   * OpenStreetMap Nominatim API
   */
  private async nominatimReverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SecureGuardApp/1.0',
      },
    });

    const data = await response.json();

    if (!data || data.error) {
      throw new Error('Nominatim geocoding failed');
    }

    return {
      address: data.display_name || '',
      city: data.address?.city || data.address?.town || data.address?.village || '',
      country: data.address?.country || '',
      postalCode: data.address?.postcode || '',
      region: data.address?.state || data.address?.region || '',
    };
  }

  /**
   * Extract component from Google geocoding result
   */
  private extractComponent(components: any[], type: string): string {
    const component = components.find(comp => comp.types.includes(type));
    return component ? component.long_name : '';
  }

  /**
   * Format address for display
   */
  private formatAddress(result: GeocodingResult): string {
    const parts = [];

    if (result.address) {
      // If we have a full formatted address, use it
      return result.address;
    }

    // Otherwise, build address from components
    if (result.city) parts.push(result.city);
    if (result.region && result.region !== result.city) parts.push(result.region);
    if (result.country) parts.push(result.country);

    return parts.join(', ') || 'عنوان غير معروف';
  }

  /**
   * Get cached result
   */
  private getCachedResult(key: string): GeocodingResult | null {
    const cached = this.cache[key];
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      delete this.cache[key];
      return null;
    }

    return cached.result;
  }

  /**
   * Cache geocoding result
   */
  private cacheResult(key: string, result: GeocodingResult): void {
    this.cache[key] = {
      result,
      timestamp: Date.now(),
    };

    // Save cache to storage
    this.saveCache();
  }

  /**
   * Load cache from storage
   */
  private async loadCache(): Promise<void> {
    try {
      const cached = await StorageService.getObject<GeocodingCache>(this.CACHE_KEY);
      if (cached) {
        this.cache = cached;
        
        // Clean expired entries
        this.cleanExpiredCache();
      }
    } catch (error) {
      console.error('❌ Failed to load geocoding cache:', error);
    }
  }

  /**
   * Save cache to storage
   */
  private async saveCache(): Promise<void> {
    try {
      await StorageService.setObject(this.CACHE_KEY, this.cache);
    } catch (error) {
      console.error('❌ Failed to save geocoding cache:', error);
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, cached] of Object.entries(this.cache)) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      delete this.cache[key];
    });

    if (keysToDelete.length > 0) {
      this.saveCache();
      console.log(`🧹 Cleaned ${keysToDelete.length} expired geocoding cache entries`);
    }
  }

  /**
   * Clear all cache
   */
  public async clearCache(): Promise<void> {
    try {
      this.cache = {};
      await StorageService.removeItem(this.CACHE_KEY);
      console.log('✅ Geocoding cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear geocoding cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalEntries: number;
    cacheSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = Object.values(this.cache);
    const totalEntries = entries.length;
    
    if (totalEntries === 0) {
      return {
        totalEntries: 0,
        cacheSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }

    const timestamps = entries.map(entry => entry.timestamp);
    const oldestTimestamp = Math.min(...timestamps);
    const newestTimestamp = Math.max(...timestamps);

    // Estimate cache size in bytes
    const cacheSize = JSON.stringify(this.cache).length;

    return {
      totalEntries,
      cacheSize,
      oldestEntry: new Date(oldestTimestamp),
      newestEntry: new Date(newestTimestamp),
    };
  }

  /**
   * Batch reverse geocode multiple locations
   */
  public async batchReverseGeocode(locations: Location[]): Promise<Location[]> {
    const results: Location[] = [];

    for (const location of locations) {
      try {
        const address = await this.reverseGeocode(location.latitude, location.longitude);
        results.push({
          ...location,
          address,
        });
      } catch (error) {
        console.error(`❌ Failed to geocode location ${location.id}:`, error);
        results.push({
          ...location,
          address: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        });
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Preload geocoding for a location
   */
  public async preloadGeocode(latitude: number, longitude: number): Promise<void> {
    try {
      await this.reverseGeocode(latitude, longitude);
    } catch (error) {
      console.error('❌ Failed to preload geocoding:', error);
    }
  }
}

// Export singleton instance
export default GeocodingService.getInstance();
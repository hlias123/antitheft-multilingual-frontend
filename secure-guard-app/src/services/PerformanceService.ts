import { AppState, DeviceEventEmitter } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import StorageService from './StorageService';
import LocationService from './LocationService';

/**
 * Performance Service for optimizing app performance and battery usage
 */
class PerformanceService {
  private static instance: PerformanceService;
  private isInitialized = false;
  private performanceMetrics: PerformanceMetrics = {
    memoryUsage: 0,
    cpuUsage: 0,
    batteryLevel: 1.0,
    networkUsage: 0,
    locationUpdates: 0,
    photosProcessed: 0,
    startTime: new Date(),
  };
  
  private optimizationSettings: OptimizationSettings = {
    lowPowerMode: false,
    backgroundLocationEnabled: true,
    photoCompressionEnabled: true,
    networkOptimizationEnabled: true,
    memoryCleanupEnabled: true,
  };

  private appStateSubscription: any;
  private batterySubscription: any;
  private performanceInterval: NodeJS.Timeout | null = null;

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Initialize performance service
   */
  public async initialize(): Promise<void> {
    try {
      // Load optimization settings
      await this.loadOptimizationSettings();
      
      // Set up app state monitoring
      this.setupAppStateMonitoring();
      
      // Set up battery monitoring
      this.setupBatteryMonitoring();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Apply initial optimizations
      await this.applyOptimizations();
      
      this.isInitialized = true;
      console.log('✅ PerformanceService initialized');
    } catch (error) {
      console.error('❌ PerformanceService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load optimization settings
   */
  private async loadOptimizationSettings(): Promise<void> {
    try {
      const savedSettings = await StorageService.getObject<OptimizationSettings>('optimization_settings');
      if (savedSettings) {
        this.optimizationSettings = { ...this.optimizationSettings, ...savedSettings };
      }
    } catch (error) {
      console.error('❌ Failed to load optimization settings:', error);
    }
  }

  /**
   * Save optimization settings
   */
  private async saveOptimizationSettings(): Promise<void> {
    try {
      await StorageService.setObject('optimization_settings', this.optimizationSettings);
    } catch (error) {
      console.error('❌ Failed to save optimization settings:', error);
    }
  }

  /**
   * Setup app state monitoring
   */
  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      this.handleAppStateChange(nextAppState);
    });
  }

  /**
   * Handle app state changes
   */
  private async handleAppStateChange(nextAppState: string): Promise<void> {
    try {
      switch (nextAppState) {
        case 'background':
          await this.handleAppBackground();
          break;
        case 'active':
          await this.handleAppForeground();
          break;
        case 'inactive':
          await this.handleAppInactive();
          break;
      }
    } catch (error) {
      console.error('❌ App state change handling failed:', error);
    }
  }

  /**
   * Handle app going to background
   */
  private async handleAppBackground(): Promise<void> {
    console.log('📱 App moved to background - applying optimizations');
    
    // Reduce location update frequency
    if (this.optimizationSettings.backgroundLocationEnabled) {
      await this.optimizeBackgroundLocation();
    }
    
    // Clean up memory
    if (this.optimizationSettings.memoryCleanupEnabled) {
      await this.performMemoryCleanup();
    }
    
    // Reduce network activity
    if (this.optimizationSettings.networkOptimizationEnabled) {
      this.optimizeNetworkUsage(true);
    }
  }

  /**
   * Handle app coming to foreground
   */
  private async handleAppForeground(): Promise<void> {
    console.log('📱 App moved to foreground - restoring normal operation');
    
    // Restore normal location updates
    await this.restoreNormalLocation();
    
    // Restore network activity
    this.optimizeNetworkUsage(false);
    
    // Update performance metrics
    await this.updatePerformanceMetrics();
  }

  /**
   * Handle app becoming inactive
   */
  private async handleAppInactive(): Promise<void> {
    console.log('📱 App became inactive');
    // Minimal optimizations for inactive state
  }

  /**
   * Setup battery monitoring
   */
  private setupBatteryMonitoring(): void {
    // Monitor battery level changes
    DeviceInfo.getBatteryLevel().then((batteryLevel) => {
      this.performanceMetrics.batteryLevel = batteryLevel;
      this.handleBatteryLevelChange(batteryLevel);
    });

    // Set up periodic battery checks
    setInterval(async () => {
      try {
        const batteryLevel = await DeviceInfo.getBatteryLevel();
        this.performanceMetrics.batteryLevel = batteryLevel;
        this.handleBatteryLevelChange(batteryLevel);
      } catch (error) {
        console.error('❌ Battery monitoring error:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Handle battery level changes
   */
  private handleBatteryLevelChange(batteryLevel: number): void {
    const previousLowPowerMode = this.optimizationSettings.lowPowerMode;
    
    // Enable low power mode if battery is below 20%
    if (batteryLevel < 0.2 && !this.optimizationSettings.lowPowerMode) {
      this.enableLowPowerMode();
    }
    // Disable low power mode if battery is above 30%
    else if (batteryLevel > 0.3 && this.optimizationSettings.lowPowerMode) {
      this.disableLowPowerMode();
    }
    
    // Log battery level changes
    if (Math.abs(batteryLevel - this.performanceMetrics.batteryLevel) > 0.05) {
      console.log(`🔋 Battery level: ${Math.round(batteryLevel * 100)}%`);
    }
  }

  /**
   * Enable low power mode
   */
  public async enableLowPowerMode(): Promise<void> {
    try {
      console.log('🔋 Enabling low power mode');
      
      this.optimizationSettings.lowPowerMode = true;
      
      // Reduce location update frequency
      await this.setLocationUpdateInterval(30000); // 30 seconds
      
      // Disable photo compression (save CPU)
      this.optimizationSettings.photoCompressionEnabled = false;
      
      // Enable aggressive memory cleanup
      this.optimizationSettings.memoryCleanupEnabled = true;
      
      // Reduce network activity
      this.optimizationSettings.networkOptimizationEnabled = true;
      
      await this.saveOptimizationSettings();
      await this.applyOptimizations();
      
      console.log('✅ Low power mode enabled');
    } catch (error) {
      console.error('❌ Failed to enable low power mode:', error);
    }
  }

  /**
   * Disable low power mode
   */
  public async disableLowPowerMode(): Promise<void> {
    try {
      console.log('🔋 Disabling low power mode');
      
      this.optimizationSettings.lowPowerMode = false;
      
      // Restore normal location updates
      await this.setLocationUpdateInterval(10000); // 10 seconds
      
      // Re-enable photo compression
      this.optimizationSettings.photoCompressionEnabled = true;
      
      await this.saveOptimizationSettings();
      await this.applyOptimizations();
      
      console.log('✅ Low power mode disabled');
    } catch (error) {
      console.error('❌ Failed to disable low power mode:', error);
    }
  }

  /**
   * Optimize background location updates
   */
  private async optimizeBackgroundLocation(): Promise<void> {
    try {
      // Reduce location update frequency in background
      const backgroundInterval = this.optimizationSettings.lowPowerMode ? 60000 : 30000;
      await this.setLocationUpdateInterval(backgroundInterval);
      
      console.log(`📍 Background location optimized: ${backgroundInterval}ms interval`);
    } catch (error) {
      console.error('❌ Background location optimization failed:', error);
    }
  }

  /**
   * Restore normal location updates
   */
  private async restoreNormalLocation(): Promise<void> {
    try {
      const normalInterval = this.optimizationSettings.lowPowerMode ? 20000 : 10000;
      await this.setLocationUpdateInterval(normalInterval);
      
      console.log(`📍 Normal location restored: ${normalInterval}ms interval`);
    } catch (error) {
      console.error('❌ Location restoration failed:', error);
    }
  }

  /**
   * Set location update interval
   */
  private async setLocationUpdateInterval(interval: number): Promise<void> {
    try {
      // This would integrate with LocationService
      // LocationService.setUpdateInterval(interval);
      console.log(`📍 Location update interval set to ${interval}ms`);
    } catch (error) {
      console.error('❌ Failed to set location update interval:', error);
    }
  }

  /**
   * Perform memory cleanup
   */
  private async performMemoryCleanup(): Promise<void> {
    try {
      console.log('🧹 Performing memory cleanup');
      
      // Clear old location history
      await this.cleanupLocationHistory();
      
      // Clear old photos
      await this.cleanupOldPhotos();
      
      // Clear cache
      await this.clearCache();
      
      // Force garbage collection (if available)
      if (global.gc) {
        global.gc();
      }
      
      console.log('✅ Memory cleanup completed');
    } catch (error) {
      console.error('❌ Memory cleanup failed:', error);
    }
  }

  /**
   * Cleanup old location history
   */
  private async cleanupLocationHistory(): Promise<void> {
    try {
      const locationHistory = await StorageService.getObject<any[]>('location_history') || [];
      
      // Keep only last 500 locations
      if (locationHistory.length > 500) {
        const trimmedHistory = locationHistory.slice(0, 500);
        await StorageService.setObject('location_history', trimmedHistory);
        
        console.log(`🧹 Cleaned up ${locationHistory.length - 500} old location records`);
      }
    } catch (error) {
      console.error('❌ Location history cleanup failed:', error);
    }
  }

  /**
   * Cleanup old photos
   */
  private async cleanupOldPhotos(): Promise<void> {
    try {
      const photos = await StorageService.getObject<any[]>('captured_photos') || [];
      
      // Keep only last 100 photos
      if (photos.length > 100) {
        const trimmedPhotos = photos.slice(0, 100);
        await StorageService.setObject('captured_photos', trimmedPhotos);
        
        console.log(`🧹 Cleaned up ${photos.length - 100} old photos`);
      }
    } catch (error) {
      console.error('❌ Photo cleanup failed:', error);
    }
  }

  /**
   * Clear cache
   */
  private async clearCache(): Promise<void> {
    try {
      // Clear various cache items
      const cacheKeys = [
        'geocoding_cache',
        'network_cache',
        'image_cache',
        'temp_data',
      ];
      
      for (const key of cacheKeys) {
        await StorageService.removeItem(key);
      }
      
      console.log('🧹 Cache cleared');
    } catch (error) {
      console.error('❌ Cache clearing failed:', error);
    }
  }

  /**
   * Optimize network usage
   */
  private optimizeNetworkUsage(reduce: boolean): void {
    try {
      if (reduce) {
        console.log('🌐 Reducing network activity');
        // Implement network optimization logic
        // - Batch requests
        // - Reduce sync frequency
        // - Compress data
      } else {
        console.log('🌐 Restoring normal network activity');
        // Restore normal network behavior
      }
    } catch (error) {
      console.error('❌ Network optimization failed:', error);
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.performanceInterval = setInterval(async () => {
      await this.updatePerformanceMetrics();
      await this.analyzePerformance();
    }, 30000); // Every 30 seconds
  }

  /**
   * Update performance metrics
   */
  private async updatePerformanceMetrics(): Promise<void> {
    try {
      // Update battery level
      this.performanceMetrics.batteryLevel = await DeviceInfo.getBatteryLevel();
      
      // Update memory usage (would require native implementation)
      // this.performanceMetrics.memoryUsage = await getMemoryUsage();
      
      // Update other metrics
      this.performanceMetrics.locationUpdates++;
      
      // Store metrics periodically
      await StorageService.setObject('performance_metrics', this.performanceMetrics);
    } catch (error) {
      console.error('❌ Performance metrics update failed:', error);
    }
  }

  /**
   * Analyze performance and apply optimizations
   */
  private async analyzePerformance(): Promise<void> {
    try {
      const metrics = this.performanceMetrics;
      
      // Check if optimizations are needed
      if (metrics.batteryLevel < 0.15 && !this.optimizationSettings.lowPowerMode) {
        await this.enableLowPowerMode();
      }
      
      // Check memory usage (if available)
      if (metrics.memoryUsage > 0.8) {
        await this.performMemoryCleanup();
      }
      
    } catch (error) {
      console.error('❌ Performance analysis failed:', error);
    }
  }

  /**
   * Apply all optimizations
   */
  private async applyOptimizations(): Promise<void> {
    try {
      if (this.optimizationSettings.lowPowerMode) {
        console.log('⚡ Applying low power optimizations');
      }
      
      if (this.optimizationSettings.memoryCleanupEnabled) {
        // Schedule periodic memory cleanup
        setInterval(() => {
          this.performMemoryCleanup();
        }, 10 * 60 * 1000); // Every 10 minutes
      }
      
    } catch (error) {
      console.error('❌ Failed to apply optimizations:', error);
    }
  }

  /**
   * Get performance report
   */
  public async getPerformanceReport(): Promise<PerformanceReport> {
    try {
      const uptime = Date.now() - this.performanceMetrics.startTime.getTime();
      
      return {
        timestamp: new Date(),
        uptime,
        batteryLevel: this.performanceMetrics.batteryLevel,
        memoryUsage: this.performanceMetrics.memoryUsage,
        locationUpdates: this.performanceMetrics.locationUpdates,
        photosProcessed: this.performanceMetrics.photosProcessed,
        lowPowerMode: this.optimizationSettings.lowPowerMode,
        optimizations: this.optimizationSettings,
      };
    } catch (error) {
      console.error('❌ Failed to generate performance report:', error);
      throw error;
    }
  }

  /**
   * Get optimization settings
   */
  public getOptimizationSettings(): OptimizationSettings {
    return { ...this.optimizationSettings };
  }

  /**
   * Update optimization settings
   */
  public async updateOptimizationSettings(settings: Partial<OptimizationSettings>): Promise<void> {
    try {
      this.optimizationSettings = { ...this.optimizationSettings, ...settings };
      await this.saveOptimizationSettings();
      await this.applyOptimizations();
      
      console.log('✅ Optimization settings updated');
    } catch (error) {
      console.error('❌ Failed to update optimization settings:', error);
      throw error;
    }
  }

  /**
   * Cleanup and destroy
   */
  public async destroy(): Promise<void> {
    try {
      // Remove event listeners
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
      }
      
      if (this.batterySubscription) {
        this.batterySubscription.remove();
      }
      
      // Clear intervals
      if (this.performanceInterval) {
        clearInterval(this.performanceInterval);
      }
      
      console.log('✅ PerformanceService destroyed');
    } catch (error) {
      console.error('❌ PerformanceService destruction failed:', error);
    }
  }
}

// Types
interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  batteryLevel: number;
  networkUsage: number;
  locationUpdates: number;
  photosProcessed: number;
  startTime: Date;
}

interface OptimizationSettings {
  lowPowerMode: boolean;
  backgroundLocationEnabled: boolean;
  photoCompressionEnabled: boolean;
  networkOptimizationEnabled: boolean;
  memoryCleanupEnabled: boolean;
}

interface PerformanceReport {
  timestamp: Date;
  uptime: number;
  batteryLevel: number;
  memoryUsage: number;
  locationUpdates: number;
  photosProcessed: number;
  lowPowerMode: boolean;
  optimizations: OptimizationSettings;
}

// Export singleton instance
export default PerformanceService.getInstance();
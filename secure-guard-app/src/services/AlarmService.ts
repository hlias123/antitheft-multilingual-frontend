import { Alert as RNAlert, Vibration, AppState } from 'react-native';
import Sound from 'react-native-sound';
import { Alert, Photo, Location } from '@/types';
import { ALARM_CONFIG } from '@/utils/constants';
import { generateId } from '@/utils/helpers';
import LocationService from './LocationService';
import CameraService from './CameraService';
import NetworkService from './NetworkService';
import StorageService from './StorageService';

/**
 * Alarm Service for theft detection and alert system
 */
class AlarmService {
  private static instance: AlarmService;
  private isAlarmActive = false;
  private alarmSound: Sound | null = null;
  private vibrationInterval: NodeJS.Timeout | null = null;
  private flashInterval: NodeJS.Timeout | null = null;
  private photoInterval: NodeJS.Timeout | null = null;
  private currentAlert: Alert | null = null;
  private capturedPhotos: Photo[] = [];

  public static getInstance(): AlarmService {
    if (!AlarmService.instance) {
      AlarmService.instance = new AlarmService();
    }
    return AlarmService.instance;
  }

  /**
   * Initialize alarm service
   */
  public async initialize(): Promise<void> {
    try {
      // Enable sound playback in silent mode
      Sound.setCategory('Playback');
      
      // Load default alarm sound
      await this.loadAlarmSound('default');
      
      console.log('✅ AlarmService initialized');
    } catch (error) {
      console.error('❌ AlarmService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Activate alarm system
   */
  public async activateAlarm(type: Alert['type']): Promise<void> {
    try {
      if (this.isAlarmActive) {
        console.log('⚠️ Alarm already active');
        return;
      }

      console.log(`🚨 Activating alarm: ${type}`);
      this.isAlarmActive = true;

      // Create alert record
      const currentLocation = LocationService.getLastKnownLocation();
      this.currentAlert = {
        id: generateId(),
        type,
        timestamp: new Date(),
        location: currentLocation || this.getDefaultLocation(),
        photos: [],
        deviceInfo: await this.getDeviceInfo(),
        isResolved: false,
      };

      // Start all alarm components
      await Promise.all([
        this.startAlarmSound(),
        this.startVibration(),
        this.startScreenFlash(),
        this.startPhotoCapture(),
      ]);

      // Send immediate alert to backend
      await this.sendAlertNotification();

      // Keep screen on and prevent app from going to background
      this.preventSleep();

      console.log('🚨 Alarm activated successfully');
    } catch (error) {
      console.error('❌ Failed to activate alarm:', error);
      throw error;
    }
  }

  /**
   * Deactivate alarm system
   */
  public async deactivateAlarm(): Promise<void> {
    try {
      if (!this.isAlarmActive) {
        console.log('⚠️ Alarm not active');
        return;
      }

      console.log('🔇 Deactivating alarm');
      this.isAlarmActive = false;

      // Stop all alarm components
      this.stopAlarmSound();
      this.stopVibration();
      this.stopScreenFlash();
      this.stopPhotoCapture();

      // Mark alert as resolved
      if (this.currentAlert) {
        this.currentAlert.isResolved = true;
        this.currentAlert.photos = [...this.capturedPhotos];
        
        // Save alert to storage
        await this.saveAlert(this.currentAlert);
        
        // Send final alert update
        await this.sendAlertUpdate(this.currentAlert);
      }

      // Reset state
      this.currentAlert = null;
      this.capturedPhotos = [];

      // Allow screen to sleep again
      this.allowSleep();

      console.log('✅ Alarm deactivated successfully');
    } catch (error) {
      console.error('❌ Failed to deactivate alarm:', error);
      throw error;
    }
  }

  /**
   * Start alarm sound
   */
  private async startAlarmSound(): Promise<void> {
    try {
      if (!this.alarmSound) {
        await this.loadAlarmSound('default');
      }

      if (this.alarmSound) {
        this.alarmSound.setVolume(ALARM_CONFIG.MAX_VOLUME);
        this.alarmSound.setNumberOfLoops(-1); // Loop indefinitely
        this.alarmSound.play((success) => {
          if (!success) {
            console.error('❌ Failed to play alarm sound');
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to start alarm sound:', error);
    }
  }

  /**
   * Stop alarm sound
   */
  private stopAlarmSound(): void {
    try {
      if (this.alarmSound) {
        this.alarmSound.stop();
      }
    } catch (error) {
      console.error('❌ Failed to stop alarm sound:', error);
    }
  }

  /**
   * Start vibration
   */
  private startVibration(): void {
    try {
      // Start continuous vibration pattern
      const vibrate = () => {
        if (this.isAlarmActive) {
          Vibration.vibrate(ALARM_CONFIG.VIBRATION_PATTERN);
        }
      };

      vibrate(); // Start immediately
      this.vibrationInterval = setInterval(vibrate, 2000); // Repeat every 2 seconds
    } catch (error) {
      console.error('❌ Failed to start vibration:', error);
    }
  }

  /**
   * Stop vibration
   */
  private stopVibration(): void {
    try {
      Vibration.cancel();
      if (this.vibrationInterval) {
        clearInterval(this.vibrationInterval);
        this.vibrationInterval = null;
      }
    } catch (error) {
      console.error('❌ Failed to stop vibration:', error);
    }
  }

  /**
   * Start screen flash
   */
  private startScreenFlash(): void {
    try {
      let colorIndex = 0;
      
      this.flashInterval = setInterval(() => {
        if (this.isAlarmActive) {
          const color = ALARM_CONFIG.FLASH_COLORS[colorIndex % ALARM_CONFIG.FLASH_COLORS.length];
          this.flashScreen(color);
          colorIndex++;
        }
      }, ALARM_CONFIG.FLASH_DURATION);
    } catch (error) {
      console.error('❌ Failed to start screen flash:', error);
    }
  }

  /**
   * Stop screen flash
   */
  private stopScreenFlash(): void {
    try {
      if (this.flashInterval) {
        clearInterval(this.flashInterval);
        this.flashInterval = null;
      }
    } catch (error) {
      console.error('❌ Failed to stop screen flash:', error);
    }
  }

  /**
   * Flash screen with color
   */
  private flashScreen(color: string): void {
    // This would be implemented with a full-screen overlay component
    // For now, we'll just log the color change
    console.log(`💡 Screen flash: ${color}`);
  }

  /**
   * Start photo capture
   */
  public async startPhotoCapture(): Promise<void> {
    try {
      const capturePhoto = async () => {
        if (this.isAlarmActive) {
          try {
            // Capture from both cameras
            const frontPhoto = await CameraService.capturePhoto('front');
            const backPhoto = await CameraService.capturePhoto('back');
            
            if (frontPhoto) {
              this.capturedPhotos.push(frontPhoto);
            }
            
            if (backPhoto) {
              this.capturedPhotos.push(backPhoto);
            }

            // Upload photos immediately
            if (frontPhoto) await this.uploadPhoto(frontPhoto);
            if (backPhoto) await this.uploadPhoto(backPhoto);
            
          } catch (error) {
            console.error('❌ Failed to capture photos:', error);
          }
        }
      };

      // Capture immediately
      await capturePhoto();
      
      // Set up interval for continuous capture
      this.photoInterval = setInterval(capturePhoto, ALARM_CONFIG.PHOTO_INTERVAL);
    } catch (error) {
      console.error('❌ Failed to start photo capture:', error);
    }
  }

  /**
   * Stop photo capture
   */
  public async stopPhotoCapture(): Promise<void> {
    try {
      if (this.photoInterval) {
        clearInterval(this.photoInterval);
        this.photoInterval = null;
      }
    } catch (error) {
      console.error('❌ Failed to stop photo capture:', error);
    }
  }

  /**
   * Load alarm sound
   */
  private async loadAlarmSound(soundName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Load sound file (should be in assets/sounds/)
        const soundFile = soundName === 'default' ? 'alarm_default.mp3' : `${soundName}.mp3`;
        
        this.alarmSound = new Sound(soundFile, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.error('❌ Failed to load alarm sound:', error);
            reject(error);
          } else {
            console.log('✅ Alarm sound loaded');
            resolve();
          }
        });
      } catch (error) {
        console.error('❌ Error loading alarm sound:', error);
        reject(error);
      }
    });
  }

  /**
   * Upload photo to backend
   */
  private async uploadPhoto(photo: Photo): Promise<void> {
    try {
      await NetworkService.uploadFile('/alerts/photo', photo.url, {
        photoId: photo.id,
        alertId: this.currentAlert?.id,
        camera: photo.camera,
        timestamp: photo.timestamp.toISOString(),
        location: JSON.stringify(photo.location),
      });
    } catch (error) {
      console.error('❌ Failed to upload photo:', error);
      // Queue for later retry
      await this.queuePhotoUpload(photo);
    }
  }

  /**
   * Queue photo for later upload
   */
  private async queuePhotoUpload(photo: Photo): Promise<void> {
    try {
      const queue = await StorageService.getObject<Photo[]>('photo_upload_queue') || [];
      queue.push(photo);
      await StorageService.setObject('photo_upload_queue', queue);
    } catch (error) {
      console.error('❌ Failed to queue photo upload:', error);
    }
  }

  /**
   * Send alert notification to backend
   */
  private async sendAlertNotification(): Promise<void> {
    try {
      if (!this.currentAlert) {
        return;
      }

      await NetworkService.post('/alerts/notification', {
        alert: this.currentAlert,
        timestamp: new Date().toISOString(),
        priority: 'high',
      });
    } catch (error) {
      console.error('❌ Failed to send alert notification:', error);
    }
  }

  /**
   * Send alert update to backend
   */
  private async sendAlertUpdate(alert: Alert): Promise<void> {
    try {
      await NetworkService.put(`/alerts/${alert.id}`, {
        alert,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Failed to send alert update:', error);
    }
  }

  /**
   * Save alert to local storage
   */
  private async saveAlert(alert: Alert): Promise<void> {
    try {
      const alerts = await StorageService.getObject<Alert[]>('saved_alerts') || [];
      alerts.unshift(alert);
      
      // Keep only last 100 alerts
      if (alerts.length > 100) {
        alerts.splice(100);
      }
      
      await StorageService.setObject('saved_alerts', alerts);
    } catch (error) {
      console.error('❌ Failed to save alert:', error);
    }
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    try {
      // This would use react-native-device-info
      return {
        id: await StorageService.getItem('device_id') || generateId(),
        model: 'Unknown',
        brand: 'Unknown',
        systemVersion: 'Unknown',
        batteryLevel: 1.0,
        networkType: 'Unknown',
        isRooted: false,
      };
    } catch (error) {
      console.error('❌ Failed to get device info:', error);
      return {};
    }
  }

  /**
   * Get default location when GPS is unavailable
   */
  private getDefaultLocation(): Location {
    return {
      id: generateId(),
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      altitude: 0,
      speed: 0,
      heading: 0,
      timestamp: new Date(),
      address: 'موقع غير معروف',
      deviceId: '',
    };
  }

  /**
   * Prevent device from sleeping
   */
  private preventSleep(): void {
    // This would use react-native-keep-awake or similar
    console.log('🔒 Preventing device sleep');
  }

  /**
   * Allow device to sleep
   */
  private allowSleep(): void {
    // This would use react-native-keep-awake or similar
    console.log('😴 Allowing device sleep');
  }

  /**
   * Check if alarm is active
   */
  public isAlarmCurrentlyActive(): boolean {
    return this.isAlarmActive;
  }

  /**
   * Get current alert
   */
  public getCurrentAlert(): Alert | null {
    return this.currentAlert;
  }

  /**
   * Get captured photos
   */
  public getCapturedPhotos(): Photo[] {
    return [...this.capturedPhotos];
  }

  /**
   * Set custom alarm sound
   */
  public async setCustomAlarmSound(soundPath: string): Promise<void> {
    try {
      if (this.alarmSound) {
        this.alarmSound.release();
      }
      
      await this.loadAlarmSound(soundPath);
      console.log('✅ Custom alarm sound set');
    } catch (error) {
      console.error('❌ Failed to set custom alarm sound:', error);
      throw error;
    }
  }

  /**
   * Test alarm system
   */
  public async testAlarm(duration: number = 5000): Promise<void> {
    try {
      console.log('🧪 Testing alarm system');
      
      await this.activateAlarm('manual_trigger');
      
      // Stop after specified duration
      setTimeout(async () => {
        await this.deactivateAlarm();
        console.log('✅ Alarm test completed');
      }, duration);
    } catch (error) {
      console.error('❌ Alarm test failed:', error);
      throw error;
    }
  }

  /**
   * Get alarm statistics
   */
  public async getAlarmStats(): Promise<{
    totalAlerts: number;
    lastAlert: Date | null;
    photosCaptured: number;
    averageResponseTime: number;
  }> {
    try {
      const alerts = await StorageService.getObject<Alert[]>('saved_alerts') || [];
      const totalAlerts = alerts.length;
      const lastAlert = alerts.length > 0 ? alerts[0].timestamp : null;
      const photosCaptured = alerts.reduce((sum, alert) => sum + alert.photos.length, 0);
      
      // Calculate average response time (placeholder)
      const averageResponseTime = 0;

      return {
        totalAlerts,
        lastAlert,
        photosCaptured,
        averageResponseTime,
      };
    } catch (error) {
      console.error('❌ Failed to get alarm stats:', error);
      return {
        totalAlerts: 0,
        lastAlert: null,
        photosCaptured: 0,
        averageResponseTime: 0,
      };
    }
  }
}

// Export singleton instance
export default AlarmService.getInstance();
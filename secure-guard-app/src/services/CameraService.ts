import { Platform, PermissionsAndroid } from 'react-native';
import { launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { Photo, Location } from '@/types';
import { generateId } from '@/utils/helpers';
import LocationService from './LocationService';
import StorageService from './StorageService';

interface CameraOptions {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  includeBase64: boolean;
  saveToPhotos: boolean;
}

/**
 * Camera Service for automatic photo capture during security events
 */
class CameraService {
  private static instance: CameraService;
  private isInitialized = false;
  private defaultOptions: CameraOptions = {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    includeBase64: false,
    saveToPhotos: false,
  };

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Initialize camera service
   */
  public async initialize(): Promise<void> {
    try {
      // Request camera permissions
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permissions not granted');
      }

      this.isInitialized = true;
      console.log('✅ CameraService initialized');
    } catch (error) {
      console.error('❌ CameraService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Request camera permissions
   */
  public async requestCameraPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted';
        const storageGranted = granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === 'granted';

        return cameraGranted && storageGranted;
      }

      // iOS permissions are handled automatically by the camera library
      return true;
    } catch (error) {
      console.error('❌ Camera permission request failed:', error);
      return false;
    }
  }

  /**
   * Capture photo from specified camera
   */
  public async capturePhoto(camera: 'front' | 'back'): Promise<Photo | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const options = {
        mediaType: 'photo' as MediaType,
        quality: this.defaultOptions.quality,
        maxWidth: this.defaultOptions.maxWidth,
        maxHeight: this.defaultOptions.maxHeight,
        includeBase64: this.defaultOptions.includeBase64,
        saveToPhotos: this.defaultOptions.saveToPhotos,
        cameraType: camera,
      };

      return new Promise((resolve) => {
        launchCamera(options, (response: ImagePickerResponse) => {
          if (response.didCancel || response.errorMessage) {
            console.error('❌ Camera capture failed:', response.errorMessage);
            resolve(null);
            return;
          }

          if (response.assets && response.assets.length > 0) {
            const asset = response.assets[0];
            const photo = this.createPhotoObject(asset, camera);
            resolve(photo);
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('❌ Photo capture failed:', error);
      return null;
    }
  }

  /**
   * Capture photos from both cameras
   */
  public async captureBothCameras(): Promise<{ front: Photo | null; back: Photo | null }> {
    try {
      const [frontPhoto, backPhoto] = await Promise.all([
        this.capturePhoto('front'),
        this.capturePhoto('back'),
      ]);

      return {
        front: frontPhoto,
        back: backPhoto,
      };
    } catch (error) {
      console.error('❌ Failed to capture from both cameras:', error);
      return {
        front: null,
        back: null,
      };
    }
  }

  /**
   * Capture multiple photos with interval
   */
  public async captureMultiplePhotos(
    camera: 'front' | 'back',
    count: number,
    interval: number = 1000
  ): Promise<Photo[]> {
    const photos: Photo[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const photo = await this.capturePhoto(camera);
        if (photo) {
          photos.push(photo);
        }

        // Wait for interval before next capture (except for last photo)
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        console.error(`❌ Failed to capture photo ${i + 1}:`, error);
      }
    }

    return photos;
  }

  /**
   * Start continuous photo capture
   */
  public startContinuousCapture(
    camera: 'front' | 'back',
    interval: number = 5000,
    onPhotoCapture?: (photo: Photo) => void
  ): NodeJS.Timeout {
    const captureInterval = setInterval(async () => {
      try {
        const photo = await this.capturePhoto(camera);
        if (photo && onPhotoCapture) {
          onPhotoCapture(photo);
        }
      } catch (error) {
        console.error('❌ Continuous capture error:', error);
      }
    }, interval);

    return captureInterval;
  }

  /**
   * Stop continuous photo capture
   */
  public stopContinuousCapture(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }

  /**
   * Create photo object from camera response
   */
  private createPhotoObject(asset: any, camera: 'front' | 'back'): Photo {
    const currentLocation = LocationService.getLastKnownLocation();
    
    return {
      id: generateId(),
      url: asset.uri,
      camera,
      timestamp: new Date(),
      location: currentLocation || this.getDefaultLocation(),
    };
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
   * Compress photo for upload
   */
  public async compressPhoto(photoUri: string, quality: number = 0.7): Promise<string> {
    try {
      // This would use a library like react-native-image-resizer
      // For now, return the original URI
      return photoUri;
    } catch (error) {
      console.error('❌ Photo compression failed:', error);
      return photoUri;
    }
  }

  /**
   * Save photo to device storage
   */
  public async savePhotoToStorage(photo: Photo): Promise<void> {
    try {
      const photos = await StorageService.getObject<Photo[]>('captured_photos') || [];
      photos.unshift(photo);
      
      // Keep only last 500 photos
      if (photos.length > 500) {
        photos.splice(500);
      }
      
      await StorageService.setObject('captured_photos', photos);
    } catch (error) {
      console.error('❌ Failed to save photo to storage:', error);
    }
  }

  /**
   * Get saved photos from storage
   */
  public async getSavedPhotos(): Promise<Photo[]> {
    try {
      return await StorageService.getObject<Photo[]>('captured_photos') || [];
    } catch (error) {
      console.error('❌ Failed to get saved photos:', error);
      return [];
    }
  }

  /**
   * Delete photo from storage
   */
  public async deletePhoto(photoId: string): Promise<void> {
    try {
      const photos = await StorageService.getObject<Photo[]>('captured_photos') || [];
      const filteredPhotos = photos.filter(photo => photo.id !== photoId);
      await StorageService.setObject('captured_photos', filteredPhotos);
    } catch (error) {
      console.error('❌ Failed to delete photo:', error);
    }
  }

  /**
   * Clear all saved photos
   */
  public async clearAllPhotos(): Promise<void> {
    try {
      await StorageService.removeItem('captured_photos');
      console.log('✅ All photos cleared');
    } catch (error) {
      console.error('❌ Failed to clear photos:', error);
    }
  }

  /**
   * Get photo statistics
   */
  public async getPhotoStats(): Promise<{
    totalPhotos: number;
    frontCameraPhotos: number;
    backCameraPhotos: number;
    lastPhotoDate: Date | null;
    totalStorageSize: number;
  }> {
    try {
      const photos = await this.getSavedPhotos();
      const totalPhotos = photos.length;
      const frontCameraPhotos = photos.filter(p => p.camera === 'front').length;
      const backCameraPhotos = photos.filter(p => p.camera === 'back').length;
      const lastPhotoDate = photos.length > 0 ? photos[0].timestamp : null;
      
      // Estimate storage size (placeholder)
      const totalStorageSize = photos.length * 500000; // ~500KB per photo estimate

      return {
        totalPhotos,
        frontCameraPhotos,
        backCameraPhotos,
        lastPhotoDate,
        totalStorageSize,
      };
    } catch (error) {
      console.error('❌ Failed to get photo stats:', error);
      return {
        totalPhotos: 0,
        frontCameraPhotos: 0,
        backCameraPhotos: 0,
        lastPhotoDate: null,
        totalStorageSize: 0,
      };
    }
  }

  /**
   * Check camera availability
   */
  public async checkCameraAvailability(): Promise<{
    frontCamera: boolean;
    backCamera: boolean;
    hasPermission: boolean;
  }> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      
      // This would check actual camera hardware availability
      // For now, assume both cameras are available if permissions are granted
      return {
        frontCamera: hasPermission,
        backCamera: hasPermission,
        hasPermission,
      };
    } catch (error) {
      console.error('❌ Failed to check camera availability:', error);
      return {
        frontCamera: false,
        backCamera: false,
        hasPermission: false,
      };
    }
  }

  /**
   * Set camera options
   */
  public setCameraOptions(options: Partial<CameraOptions>): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options,
    };
  }

  /**
   * Get camera options
   */
  public getCameraOptions(): CameraOptions {
    return { ...this.defaultOptions };
  }

  /**
   * Test camera functionality
   */
  public async testCamera(camera: 'front' | 'back'): Promise<boolean> {
    try {
      const photo = await this.capturePhoto(camera);
      return photo !== null;
    } catch (error) {
      console.error(`❌ Camera test failed for ${camera} camera:`, error);
      return false;
    }
  }

  /**
   * Batch process photos
   */
  public async batchProcessPhotos(
    photos: Photo[],
    processor: (photo: Photo) => Promise<Photo>
  ): Promise<Photo[]> {
    const processedPhotos: Photo[] = [];

    for (const photo of photos) {
      try {
        const processedPhoto = await processor(photo);
        processedPhotos.push(processedPhoto);
      } catch (error) {
        console.error(`❌ Failed to process photo ${photo.id}:`, error);
        processedPhotos.push(photo); // Keep original if processing fails
      }
    }

    return processedPhotos;
  }
}

// Export singleton instance
export default CameraService.getInstance();
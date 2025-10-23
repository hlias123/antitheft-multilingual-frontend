import { Platform, PermissionsAndroid } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { store } from '@/store';
import { loadSettings } from '@/store/slices/settingsSlice';
import { checkAuthStatus } from '@/store/slices/authSlice';
import StorageService from './StorageService';
import { APP_CONFIG } from '@/utils/constants';

/**
 * Initialize the app with required configurations and services
 */
export const initializeApp = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing SecureGuard Pro...');

    // Initialize storage service
    await StorageService.initialize();

    // Configure Google Sign-In
    await configureGoogleSignIn();

    // Load app settings
    await loadAppSettings();

    // Check authentication status
    await checkAuthentication();

    // Request required permissions
    await requestPermissions();

    console.log('✅ App initialization completed successfully');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    throw error;
  }
};

/**
 * Configure Google Sign-In
 */
const configureGoogleSignIn = async (): Promise<void> => {
  try {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with actual web client ID
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
      accountName: '',
      iosClientId: 'YOUR_IOS_CLIENT_ID', // Replace with actual iOS client ID
      googleServicePlistPath: '',
    });

    console.log('✅ Google Sign-In configured');
  } catch (error) {
    console.error('❌ Google Sign-In configuration failed:', error);
    throw error;
  }
};

/**
 * Load app settings from storage
 */
const loadAppSettings = async (): Promise<void> => {
  try {
    store.dispatch(loadSettings());
    console.log('✅ App settings loaded');
  } catch (error) {
    console.error('❌ Failed to load app settings:', error);
    throw error;
  }
};

/**
 * Check authentication status
 */
const checkAuthentication = async (): Promise<void> => {
  try {
    store.dispatch(checkAuthStatus());
    console.log('✅ Authentication status checked');
  } catch (error) {
    console.error('❌ Failed to check authentication status:', error);
    throw error;
  }
};

/**
 * Request required permissions
 */
const requestPermissions = async (): Promise<void> => {
  try {
    if (Platform.OS === 'android') {
      await requestAndroidPermissions();
    }
    // iOS permissions are handled automatically when features are used
    console.log('✅ Permissions requested');
  } catch (error) {
    console.error('❌ Failed to request permissions:', error);
    throw error;
  }
};

/**
 * Request Android-specific permissions
 */
const requestAndroidPermissions = async (): Promise<void> => {
  const permissions = [
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    PermissionsAndroid.PERMISSIONS.VIBRATE,
    PermissionsAndroid.PERMISSIONS.WAKE_LOCK,
    PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW,
  ];

  try {
    const granted = await PermissionsAndroid.requestMultiple(permissions);
    
    const deniedPermissions = Object.keys(granted).filter(
      permission => granted[permission] !== PermissionsAndroid.RESULTS.GRANTED
    );

    if (deniedPermissions.length > 0) {
      console.warn('⚠️ Some permissions were denied:', deniedPermissions);
    }
  } catch (error) {
    console.error('❌ Error requesting Android permissions:', error);
    throw error;
  }
};
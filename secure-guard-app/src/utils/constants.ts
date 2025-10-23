// App Constants
export const APP_CONFIG = {
  NAME: 'SecureGuard Pro',
  VERSION: '1.0.0',
  API_BASE_URL: 'https://api.secureguard.app',
  WEBSOCKET_URL: 'wss://ws.secureguard.app',
};

// Secret Access Configuration
export const SECRET_ACCESS = {
  REQUIRED_TAPS: 5,
  TAP_TIMEOUT: 3000, // 3 seconds
  CORNER_SIZE: 50, // 50x50 pixels
  VIBRATION_DURATION: 50, // milliseconds
};

// PIN Configuration
export const PIN_CONFIG = {
  LENGTH: 4,
  MAX_ATTEMPTS: 3,
  LOCKOUT_DURATION: 300000, // 5 minutes
  STRONG_VIBRATION: [100, 100, 100],
  LIGHT_VIBRATION: [50],
};

// Location Tracking
export const LOCATION_CONFIG = {
  UPDATE_INTERVAL: 10000, // 10 seconds
  HIGH_ACCURACY_THRESHOLD: 3, // meters
  MEDIUM_ACCURACY_THRESHOLD: 10, // meters
  MAX_LOCATION_HISTORY: 1000,
  CLEANUP_INTERVAL: 86400000, // 24 hours
};

// Alarm System
export const ALARM_CONFIG = {
  PHOTO_INTERVAL: 5000, // 5 seconds
  FLASH_COLORS: ['#FF0000', '#FFFFFF', '#0000FF'], // Red, White, Blue
  FLASH_DURATION: 500, // milliseconds
  MAX_VOLUME: 1.0,
  VIBRATION_PATTERN: [1000, 1000, 1000, 1000], // Strong pattern
};

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  'ar', 'en', 'fr', 'es', 'de', 'it', 'pt', 'ru',
  'zh', 'ja', 'ko', 'hi', 'tr', 'pl', 'nl', 'sv',
  'da', 'no', 'fi', 'cs', 'sk', 'hu', 'ro', 'bg',
  'hr', 'sl', 'et', 'lv', 'lt'
];

// Storage Keys
export const STORAGE_KEYS = {
  USER_PIN: 'user_pin_encrypted',
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SETTINGS: 'app_settings',
  LOCATION_HISTORY: 'location_history',
  LANGUAGE: 'selected_language',
  FIRST_LAUNCH: 'first_launch',
};

// Permissions
export const REQUIRED_PERMISSIONS = {
  CAMERA: 'camera',
  LOCATION: 'location',
  MICROPHONE: 'microphone',
  STORAGE: 'storage',
  PHONE: 'phone',
};

// Network Configuration
export const NETWORK_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  UPLOAD_CHUNK_SIZE: 1024 * 1024, // 1MB
};
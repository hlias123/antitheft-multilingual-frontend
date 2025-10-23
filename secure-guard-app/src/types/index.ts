// Main types and interfaces for the app

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL: string;
  isEmailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  pin: string;
  secretAccessEnabled: boolean;
  gpsAccuracy: 'high' | 'medium' | 'low';
  locationUpdateInterval: number;
  alarmSound: string;
  vibrationIntensity: number;
  language: string;
}

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  address: string;
  deviceId: string;
}

export interface Alert {
  id: string;
  type: 'theft_attempt' | 'unauthorized_access' | 'manual_trigger';
  timestamp: Date;
  location: Location;
  photos: Photo[];
  deviceInfo: DeviceInfo;
  isResolved: boolean;
}

export interface Photo {
  id: string;
  url: string;
  camera: 'front' | 'back';
  timestamp: Date;
  location: Location;
}

export interface DeviceInfo {
  id: string;
  model: string;
  brand: string;
  systemVersion: string;
  batteryLevel: number;
  networkType: string;
  isRooted: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LocationState {
  currentLocation: Location | null;
  locationHistory: Location[];
  isTracking: boolean;
  accuracy: number;
  error: string | null;
}

export interface AlarmState {
  isActive: boolean;
  type: Alert['type'] | null;
  startTime: Date | null;
  photos: Photo[];
  isRecording: boolean;
}

export interface AppState {
  auth: AuthState;
  location: LocationState;
  alarm: AlarmState;
  settings: UserSettings;
}
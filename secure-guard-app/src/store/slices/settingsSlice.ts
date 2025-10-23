import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserSettings } from '@/types';
import StorageService from '@/services/StorageService';
import { STORAGE_KEYS } from '@/utils/constants';

// Default settings
const defaultSettings: UserSettings = {
  pin: '',
  secretAccessEnabled: true,
  gpsAccuracy: 'high',
  locationUpdateInterval: 10000, // 10 seconds
  alarmSound: 'default',
  vibrationIntensity: 1,
  language: 'ar',
};

// Initial state
const initialState: UserSettings = defaultSettings;

// Async thunks
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async () => {
    const settings = await StorageService.getItem(STORAGE_KEYS.SETTINGS);
    if (settings) {
      return JSON.parse(settings) as UserSettings;
    }
    return defaultSettings;
  }
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: UserSettings) => {
    await StorageService.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }
);

export const updatePIN = createAsyncThunk(
  'settings/updatePIN',
  async (newPIN: string) => {
    // PIN should be encrypted before storage
    await StorageService.setItem(STORAGE_KEYS.USER_PIN, newPIN);
    return newPIN;
  }
);

// Settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSetting: <K extends keyof UserSettings>(
      state: UserSettings,
      action: PayloadAction<{ key: K; value: UserSettings[K] }>
    ) => {
      const { key, value } = action.payload;
      state[key] = value;
      
      // Auto-save to storage
      StorageService.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state));
    },
    resetSettings: () => defaultSettings,
  },
  extraReducers: (builder) => {
    builder
      // Load settings
      .addCase(loadSettings.fulfilled, (state, action) => {
        return action.payload;
      })
      
      // Save settings
      .addCase(saveSettings.fulfilled, (state, action) => {
        return action.payload;
      })
      
      // Update PIN
      .addCase(updatePIN.fulfilled, (state, action) => {
        state.pin = action.payload;
      });
  },
});

export const { updateSetting, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
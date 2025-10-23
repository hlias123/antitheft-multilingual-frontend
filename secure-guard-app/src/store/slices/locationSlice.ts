import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LocationState, Location } from '@/types';
import LocationService from '@/services/LocationService';

// Initial state
const initialState: LocationState = {
  currentLocation: null,
  locationHistory: [],
  isTracking: false,
  accuracy: 0,
  error: null,
};

// Async thunks
export const startLocationTracking = createAsyncThunk(
  'location/startTracking',
  async () => {
    await LocationService.startTracking();
    return true;
  }
);

export const stopLocationTracking = createAsyncThunk(
  'location/stopTracking',
  async () => {
    await LocationService.stopTracking();
    return false;
  }
);

export const getCurrentLocation = createAsyncThunk(
  'location/getCurrentLocation',
  async () => {
    return await LocationService.getCurrentLocation();
  }
);

export const loadLocationHistory = createAsyncThunk(
  'location/loadHistory',
  async () => {
    return await LocationService.getLocationHistory();
  }
);

// Location slice
const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    updateCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
      state.accuracy = action.payload.accuracy;
      
      // Add to history if accuracy is good enough
      if (action.payload.accuracy <= 10) {
        state.locationHistory.unshift(action.payload);
        
        // Keep only last 1000 locations
        if (state.locationHistory.length > 1000) {
          state.locationHistory = state.locationHistory.slice(0, 1000);
        }
      }
    },
    clearLocationHistory: (state) => {
      state.locationHistory = [];
    },
    setTrackingStatus: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
    setLocationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Start tracking
      .addCase(startLocationTracking.fulfilled, (state) => {
        state.isTracking = true;
        state.error = null;
      })
      .addCase(startLocationTracking.rejected, (state, action) => {
        state.isTracking = false;
        state.error = action.error.message || 'Failed to start location tracking';
      })
      
      // Stop tracking
      .addCase(stopLocationTracking.fulfilled, (state) => {
        state.isTracking = false;
        state.error = null;
      })
      
      // Get current location
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.currentLocation = action.payload;
        state.accuracy = action.payload.accuracy;
        state.error = null;
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to get current location';
      })
      
      // Load location history
      .addCase(loadLocationHistory.fulfilled, (state, action) => {
        state.locationHistory = action.payload;
      });
  },
});

export const {
  updateCurrentLocation,
  clearLocationHistory,
  setTrackingStatus,
  setLocationError,
} = locationSlice.actions;

export default locationSlice.reducer;
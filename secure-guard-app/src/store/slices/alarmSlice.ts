import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AlarmState, Alert, Photo } from '@/types';
import AlarmService from '@/services/AlarmService';

// Initial state
const initialState: AlarmState = {
  isActive: false,
  type: null,
  startTime: null,
  photos: [],
  isRecording: false,
};

// Async thunks
export const activateAlarm = createAsyncThunk(
  'alarm/activate',
  async (type: Alert['type']) => {
    await AlarmService.activateAlarm(type);
    return {
      type,
      startTime: new Date(),
    };
  }
);

export const deactivateAlarm = createAsyncThunk(
  'alarm/deactivate',
  async () => {
    await AlarmService.deactivateAlarm();
    return true;
  }
);

export const startPhotoCapture = createAsyncThunk(
  'alarm/startPhotoCapture',
  async () => {
    await AlarmService.startPhotoCapture();
    return true;
  }
);

export const stopPhotoCapture = createAsyncThunk(
  'alarm/stopPhotoCapture',
  async () => {
    await AlarmService.stopPhotoCapture();
    return false;
  }
);

// Alarm slice
const alarmSlice = createSlice({
  name: 'alarm',
  initialState,
  reducers: {
    addPhoto: (state, action: PayloadAction<Photo>) => {
      state.photos.push(action.payload);
    },
    clearPhotos: (state) => {
      state.photos = [];
    },
    setRecordingStatus: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    resetAlarmState: (state) => {
      state.isActive = false;
      state.type = null;
      state.startTime = null;
      state.photos = [];
      state.isRecording = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Activate alarm
      .addCase(activateAlarm.fulfilled, (state, action) => {
        state.isActive = true;
        state.type = action.payload.type;
        state.startTime = action.payload.startTime;
        state.photos = [];
      })
      .addCase(activateAlarm.rejected, (state) => {
        state.isActive = false;
        state.type = null;
        state.startTime = null;
      })
      
      // Deactivate alarm
      .addCase(deactivateAlarm.fulfilled, (state) => {
        state.isActive = false;
        state.type = null;
        state.startTime = null;
        state.isRecording = false;
      })
      
      // Start photo capture
      .addCase(startPhotoCapture.fulfilled, (state) => {
        state.isRecording = true;
      })
      
      // Stop photo capture
      .addCase(stopPhotoCapture.fulfilled, (state) => {
        state.isRecording = false;
      });
  },
});

export const {
  addPhoto,
  clearPhotos,
  setRecordingStatus,
  resetAlarmState,
} = alarmSlice.actions;

export default alarmSlice.reducer;
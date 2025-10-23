import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types';
import StorageService from '@/services/StorageService';
import { STORAGE_KEYS } from '@/utils/constants';

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async () => {
    const token = await StorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const userData = await StorageService.getItem(STORAGE_KEYS.USER_DATA);
    
    if (token && userData) {
      return {
        token,
        user: JSON.parse(userData) as User,
      };
    }
    
    return null;
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ user, token }: { user: User; token: string }) => {
    await StorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await StorageService.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    
    return { user, token };
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    await StorageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await StorageService.removeItem(STORAGE_KEYS.USER_DATA);
    await StorageService.removeItem(STORAGE_KEYS.USER_PIN);
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        StorageService.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to check auth status';
      })
      
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      
      // Logout user
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Logout failed';
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
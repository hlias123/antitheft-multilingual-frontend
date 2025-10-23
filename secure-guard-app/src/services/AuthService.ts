import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { User } from '@/types';
import StorageService from './StorageService';
import NetworkService from './NetworkService';
import { STORAGE_KEYS, APP_CONFIG } from '@/utils/constants';
import { generateId } from '@/utils/helpers';

/**
 * Authentication Service for Google Sign-In and user management
 */
class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize Google Sign-In configuration
   */
  public async initialize(): Promise<void> {
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

      console.log('✅ AuthService initialized');
    } catch (error) {
      console.error('❌ AuthService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  public async signInWithGoogle(): Promise<{ user: User; token: string }> {
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Sign in
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.user) {
        throw new Error('No user information received from Google');
      }

      // Create user object
      const user: User = {
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.name || '',
        photoURL: userInfo.user.photo || '',
        isEmailVerified: false, // Will be verified separately
        createdAt: new Date(),
        lastLoginAt: new Date(),
        settings: {
          pin: '',
          secretAccessEnabled: true,
          gpsAccuracy: 'high',
          locationUpdateInterval: 10000,
          alarmSound: 'default',
          vibrationIntensity: 1,
          language: 'ar',
        },
      };

      // Get access token
      const tokens = await GoogleSignin.getTokens();
      const token = tokens.accessToken;

      // Send user data to backend for verification
      await this.registerUserWithBackend(user, token);

      // Store user data locally
      await StorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await StorageService.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      console.log('✅ Google Sign-In successful');
      return { user, token };
    } catch (error) {
      console.error('❌ Google Sign-In failed:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('تم إلغاء تسجيل الدخول');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('تسجيل الدخول قيد التقدم');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('خدمات Google Play غير متوفرة');
      } else {
        throw new Error('فشل في تسجيل الدخول مع Google');
      }
    }
  }

  /**
   * Create new account with Google
   */
  public async createAccountWithGoogle(): Promise<{ user: User; token: string }> {
    try {
      // Same as sign in, but with additional account creation logic
      const result = await this.signInWithGoogle();
      
      // Send email verification
      await this.sendEmailVerification(result.user.email);
      
      console.log('✅ Account created successfully');
      return result;
    } catch (error) {
      console.error('❌ Account creation failed:', error);
      throw error;
    }
  }

  /**
   * Send email verification
   */
  public async sendEmailVerification(email: string): Promise<void> {
    try {
      const response = await NetworkService.post('/auth/send-verification', {
        email,
        language: 'ar',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send verification email');
      }

      console.log('✅ Verification email sent');
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('فشل في إرسال بريد التأكيد');
    }
  }

  /**
   * Check email verification status
   */
  public async checkEmailVerification(email: string): Promise<boolean> {
    try {
      const response = await NetworkService.get(`/auth/check-verification/${email}`);
      return response.verified || false;
    } catch (error) {
      console.error('❌ Failed to check email verification:', error);
      return false;
    }
  }

  /**
   * Resend verification email
   */
  public async resendVerificationEmail(email: string): Promise<void> {
    try {
      await this.sendEmailVerification(email);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out
   */
  public async signOut(): Promise<void> {
    try {
      // Sign out from Google
      await GoogleSignin.signOut();
      
      // Clear local storage
      await StorageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await StorageService.removeItem(STORAGE_KEYS.USER_DATA);
      await StorageService.removeItem(STORAGE_KEYS.USER_PIN);
      
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw new Error('فشل في تسجيل الخروج');
    }
  }

  /**
   * Check if user is signed in
   */
  public async isSignedIn(): Promise<boolean> {
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('❌ Failed to check sign-in status:', error);
      return false;
    }
  }

  /**
   * Get current user info
   */
  public async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await StorageService.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        return JSON.parse(userData) as User;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  public async refreshToken(): Promise<string> {
    try {
      const tokens = await GoogleSignin.getTokens();
      const newToken = tokens.accessToken;
      
      await StorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
      
      console.log('✅ Token refreshed');
      return newToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw new Error('فشل في تحديث رمز المصادقة');
    }
  }

  /**
   * Validate current session
   */
  public async validateSession(): Promise<boolean> {
    try {
      const token = await StorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        return false;
      }

      // Validate token with backend
      const response = await NetworkService.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.valid || false;
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return false;
    }
  }

  /**
   * Register user with backend
   */
  private async registerUserWithBackend(user: User, token: string): Promise<void> {
    try {
      const response = await NetworkService.post('/auth/register', {
        user,
        token,
        deviceId: await this.getDeviceId(),
      });

      if (!response.success) {
        throw new Error(response.message || 'Backend registration failed');
      }

      console.log('✅ User registered with backend');
    } catch (error) {
      console.error('❌ Backend registration failed:', error);
      // Don't throw error here, allow local registration to proceed
    }
  }

  /**
   * Get device ID for registration
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await StorageService.getItem('device_id');
      if (!deviceId) {
        deviceId = generateId();
        await StorageService.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('❌ Failed to get device ID:', error);
      return generateId();
    }
  }

  /**
   * Update user profile
   */
  public async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user found');
      }

      const updatedUser = { ...currentUser, ...updates };
      await StorageService.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

      // Update backend
      const token = await StorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        await NetworkService.put('/auth/profile', updatedUser, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      console.log('✅ User profile updated');
      return updatedUser;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw new Error('فشل في تحديث الملف الشخصي');
    }
  }
}

// Export singleton instance
export default AuthService.getInstance();
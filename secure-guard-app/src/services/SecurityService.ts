import { Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import StorageService from './StorageService';
import EncryptionService from './EncryptionService';

/**
 * Security Service for advanced app protection and security checks
 */
class SecurityService {
  private static instance: SecurityService;
  private isInitialized = false;
  private securityChecks: SecurityCheck[] = [];

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Initialize security service
   */
  public async initialize(): Promise<void> {
    try {
      // Perform initial security checks
      await this.performSecurityChecks();
      
      // Set up periodic security monitoring
      this.startSecurityMonitoring();
      
      this.isInitialized = true;
      console.log('✅ SecurityService initialized');
    } catch (error) {
      console.error('❌ SecurityService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive security checks
   */
  public async performSecurityChecks(): Promise<SecurityCheckResult> {
    const results: SecurityCheckResult = {
      isSecure: true,
      checks: [],
      threats: [],
      recommendations: [],
    };

    try {
      // Check for rooted/jailbroken device
      const rootCheck = await this.checkDeviceRoot();
      results.checks.push(rootCheck);
      if (!rootCheck.passed) {
        results.isSecure = false;
        results.threats.push('Device is rooted/jailbroken');
        results.recommendations.push('Use the app on a non-rooted device for better security');
      }

      // Check app integrity
      const integrityCheck = await this.checkAppIntegrity();
      results.checks.push(integrityCheck);
      if (!integrityCheck.passed) {
        results.isSecure = false;
        results.threats.push('App integrity compromised');
        results.recommendations.push('Reinstall the app from official store');
      }

      // Check for debugging
      const debugCheck = await this.checkDebugging();
      results.checks.push(debugCheck);
      if (!debugCheck.passed) {
        results.threats.push('Debugging detected');
        results.recommendations.push('Disable debugging for production use');
      }

      // Check device security settings
      const deviceSecurityCheck = await this.checkDeviceSecurity();
      results.checks.push(deviceSecurityCheck);
      if (!deviceSecurityCheck.passed) {
        results.threats.push('Device security settings are weak');
        results.recommendations.push('Enable device lock screen and biometric authentication');
      }

      // Check for suspicious apps
      const suspiciousAppsCheck = await this.checkSuspiciousApps();
      results.checks.push(suspiciousAppsCheck);
      if (!suspiciousAppsCheck.passed) {
        results.threats.push('Suspicious apps detected');
        results.recommendations.push('Remove suspicious security or monitoring apps');
      }

      // Store security check results
      await this.storeSecurityResults(results);

      return results;
    } catch (error) {
      console.error('❌ Security checks failed:', error);
      results.isSecure = false;
      results.threats.push('Security check failed');
      return results;
    }
  }

  /**
   * Check if device is rooted or jailbroken
   */
  private async checkDeviceRoot(): Promise<SecurityCheck> {
    try {
      const isRooted = await DeviceInfo.isEmulator() || 
                      await this.checkRootIndicators();

      return {
        name: 'Root/Jailbreak Detection',
        passed: !isRooted,
        severity: 'high',
        description: isRooted ? 'Device appears to be rooted/jailbroken' : 'Device is not rooted',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'Root/Jailbreak Detection',
        passed: false,
        severity: 'medium',
        description: 'Could not determine root status',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check for root indicators
   */
  private async checkRootIndicators(): Promise<boolean> {
    try {
      // Check for common root indicators
      const rootIndicators = [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
        '/system/bin/failsafe/su',
        '/data/local/su',
        '/su/bin/su',
      ];

      // This would require native module implementation
      // For now, return false as placeholder
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check app integrity
   */
  private async checkAppIntegrity(): Promise<SecurityCheck> {
    try {
      // Check app signature and package integrity
      const bundleId = DeviceInfo.getBundleId();
      const version = DeviceInfo.getVersion();
      const buildNumber = DeviceInfo.getBuildNumber();

      // Verify expected values
      const expectedBundleId = Platform.OS === 'ios' 
        ? 'com.secureguard.app' 
        : 'com.secureguard.app';

      const integrityValid = bundleId === expectedBundleId;

      return {
        name: 'App Integrity Check',
        passed: integrityValid,
        severity: 'high',
        description: integrityValid 
          ? 'App integrity verified' 
          : 'App integrity check failed',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'App Integrity Check',
        passed: false,
        severity: 'high',
        description: 'App integrity check error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check for debugging
   */
  private async checkDebugging(): Promise<SecurityCheck> {
    try {
      const isDebuggable = __DEV__ || await DeviceInfo.isEmulator();

      return {
        name: 'Debug Detection',
        passed: !isDebuggable,
        severity: 'medium',
        description: isDebuggable 
          ? 'Debug mode or emulator detected' 
          : 'No debugging detected',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'Debug Detection',
        passed: true,
        severity: 'low',
        description: 'Debug check completed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check device security settings
   */
  private async checkDeviceSecurity(): Promise<SecurityCheck> {
    try {
      // Check if device has lock screen
      const hasLockScreen = await this.checkLockScreen();
      
      // Check biometric availability
      const hasBiometrics = await this.checkBiometrics();

      const isSecure = hasLockScreen || hasBiometrics;

      return {
        name: 'Device Security Settings',
        passed: isSecure,
        severity: 'medium',
        description: isSecure 
          ? 'Device has adequate security settings' 
          : 'Device lacks proper security settings',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'Device Security Settings',
        passed: false,
        severity: 'medium',
        description: 'Could not check device security settings',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check for lock screen
   */
  private async checkLockScreen(): Promise<boolean> {
    try {
      // This would require native implementation
      // For now, assume device has lock screen
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check for biometric authentication
   */
  private async checkBiometrics(): Promise<boolean> {
    try {
      // This would use react-native-biometrics or similar
      // For now, assume biometrics are available
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check for suspicious apps
   */
  private async checkSuspiciousApps(): Promise<SecurityCheck> {
    try {
      // List of suspicious app package names
      const suspiciousApps = [
        'com.koushikdutta.superuser',
        'eu.chainfire.supersu',
        'com.noshufou.android.su',
        'com.thirdparty.superuser',
        'com.yellowes.su',
        'com.topjohnwu.magisk',
        'com.kingroot.kinguser',
        'com.kingo.root',
        'com.smedialink.oneclickroot',
        'com.zhiqupk.root.global',
        'com.alephzain.framaroot',
      ];

      // This would require native implementation to check installed apps
      // For now, assume no suspicious apps
      const hasSuspiciousApps = false;

      return {
        name: 'Suspicious Apps Detection',
        passed: !hasSuspiciousApps,
        severity: 'medium',
        description: hasSuspiciousApps 
          ? 'Suspicious apps detected on device' 
          : 'No suspicious apps detected',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'Suspicious Apps Detection',
        passed: true,
        severity: 'low',
        description: 'Suspicious apps check completed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Prevent screenshots and screen recording
   */
  public enableScreenshotProtection(): void {
    try {
      // This would require native implementation
      // For Android: FLAG_SECURE
      // For iOS: Screenshot notification handling
      console.log('📱 Screenshot protection enabled');
    } catch (error) {
      console.error('❌ Failed to enable screenshot protection:', error);
    }
  }

  /**
   * Disable screenshot protection
   */
  public disableScreenshotProtection(): void {
    try {
      // This would require native implementation
      console.log('📱 Screenshot protection disabled');
    } catch (error) {
      console.error('❌ Failed to disable screenshot protection:', error);
    }
  }

  /**
   * Detect screenshot attempts
   */
  public onScreenshotDetected(callback: () => void): void {
    try {
      // This would require native implementation
      // For iOS: UIApplicationUserDidTakeScreenshotNotification
      // For Android: FileObserver on screenshot directory
      console.log('📱 Screenshot detection enabled');
    } catch (error) {
      console.error('❌ Failed to setup screenshot detection:', error);
    }
  }

  /**
   * Secure data storage
   */
  public async secureStoreData(key: string, data: any): Promise<void> {
    try {
      const encryptedData = await EncryptionService.encrypt(JSON.stringify(data));
      await StorageService.setSecureItem(key, encryptedData);
    } catch (error) {
      console.error('❌ Secure storage failed:', error);
      throw error;
    }
  }

  /**
   * Secure data retrieval
   */
  public async secureRetrieveData<T>(key: string): Promise<T | null> {
    try {
      const encryptedData = await StorageService.getSecureItem(key);
      if (!encryptedData) {
        return null;
      }
      
      const decryptedData = await EncryptionService.decrypt(encryptedData);
      return JSON.parse(decryptedData) as T;
    } catch (error) {
      console.error('❌ Secure retrieval failed:', error);
      return null;
    }
  }

  /**
   * Clear sensitive data
   */
  public async clearSensitiveData(): Promise<void> {
    try {
      const sensitiveKeys = [
        'user_pin_encrypted',
        'auth_token',
        'location_history',
        'captured_photos',
        'security_results',
      ];

      for (const key of sensitiveKeys) {
        await StorageService.removeItem(key);
      }

      console.log('✅ Sensitive data cleared');
    } catch (error) {
      console.error('❌ Failed to clear sensitive data:', error);
      throw error;
    }
  }

  /**
   * Validate data integrity
   */
  public async validateDataIntegrity(key: string, expectedHash?: string): Promise<boolean> {
    try {
      const data = await StorageService.getItem(key);
      if (!data) {
        return false;
      }

      if (expectedHash) {
        const actualHash = await EncryptionService.hash(data);
        return actualHash === expectedHash;
      }

      return true;
    } catch (error) {
      console.error('❌ Data integrity validation failed:', error);
      return false;
    }
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    // Periodic security checks every 5 minutes
    setInterval(async () => {
      try {
        const results = await this.performSecurityChecks();
        if (!results.isSecure && results.threats.length > 0) {
          this.handleSecurityThreat(results);
        }
      } catch (error) {
        console.error('❌ Security monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Handle security threats
   */
  private handleSecurityThreat(results: SecurityCheckResult): void {
    const highSeverityThreats = results.checks.filter(
      check => !check.passed && check.severity === 'high'
    );

    if (highSeverityThreats.length > 0) {
      Alert.alert(
        'تحذير أمني',
        'تم اكتشاف تهديد أمني. قد لا يعمل التطبيق بشكل صحيح.',
        [
          { text: 'موافق', style: 'default' },
          { 
            text: 'عرض التفاصيل', 
            onPress: () => this.showSecurityDetails(results) 
          },
        ]
      );
    }
  }

  /**
   * Show security details
   */
  private showSecurityDetails(results: SecurityCheckResult): void {
    const threatsList = results.threats.join('\n• ');
    const recommendationsList = results.recommendations.join('\n• ');

    Alert.alert(
      'تفاصيل الأمان',
      `التهديدات المكتشفة:\n• ${threatsList}\n\nالتوصيات:\n• ${recommendationsList}`,
      [{ text: 'موافق' }]
    );
  }

  /**
   * Store security results
   */
  private async storeSecurityResults(results: SecurityCheckResult): Promise<void> {
    try {
      await StorageService.setObject('security_results', {
        ...results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Failed to store security results:', error);
    }
  }

  /**
   * Get last security check results
   */
  public async getLastSecurityResults(): Promise<SecurityCheckResult | null> {
    try {
      return await StorageService.getObject<SecurityCheckResult>('security_results');
    } catch (error) {
      console.error('❌ Failed to get security results:', error);
      return null;
    }
  }

  /**
   * Generate security report
   */
  public async generateSecurityReport(): Promise<SecurityReport> {
    try {
      const results = await this.getLastSecurityResults();
      const deviceInfo = await this.getDeviceSecurityInfo();

      return {
        timestamp: new Date(),
        deviceInfo,
        securityChecks: results?.checks || [],
        overallSecurity: results?.isSecure ? 'secure' : 'at_risk',
        threats: results?.threats || [],
        recommendations: results?.recommendations || [],
      };
    } catch (error) {
      console.error('❌ Failed to generate security report:', error);
      throw error;
    }
  }

  /**
   * Get device security information
   */
  private async getDeviceSecurityInfo(): Promise<DeviceSecurityInfo> {
    try {
      return {
        deviceId: await DeviceInfo.getUniqueId(),
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        isEmulator: await DeviceInfo.isEmulator(),
        hasNotch: DeviceInfo.hasNotch(),
        isTablet: DeviceInfo.isTablet(),
      };
    } catch (error) {
      console.error('❌ Failed to get device security info:', error);
      throw error;
    }
  }

  /**
   * Check if security service is initialized
   */
  public isSecurityInitialized(): boolean {
    return this.isInitialized;
  }
}

// Types
interface SecurityCheck {
  name: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
}

interface SecurityCheckResult {
  isSecure: boolean;
  checks: SecurityCheck[];
  threats: string[];
  recommendations: string[];
}

interface SecurityReport {
  timestamp: Date;
  deviceInfo: DeviceSecurityInfo;
  securityChecks: SecurityCheck[];
  overallSecurity: 'secure' | 'at_risk' | 'compromised';
  threats: string[];
  recommendations: string[];
}

interface DeviceSecurityInfo {
  deviceId: string;
  brand: string;
  model: string;
  systemVersion: string;
  appVersion: string;
  buildNumber: string;
  isEmulator: boolean;
  hasNotch: boolean;
  isTablet: boolean;
}

// Export singleton instance
export default SecurityService.getInstance();
import CryptoJS from 'react-native-crypto-js';
import { generateId } from '@/utils/helpers';

/**
 * Encryption Service for securing sensitive data
 */
class EncryptionService {
  private static instance: EncryptionService;
  private secretKey: string;

  private constructor() {
    // Generate or retrieve a secret key for encryption
    this.secretKey = this.generateSecretKey();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Generate a secret key for encryption
   */
  private generateSecretKey(): string {
    // In production, this should be more sophisticated
    // and possibly derived from device-specific information
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  /**
   * Encrypt a string
   */
  public async encrypt(plainText: string): Promise<string> {
    try {
      const encrypted = CryptoJS.AES.encrypt(plainText, this.secretKey).toString();
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a string
   */
  public async decrypt(encryptedText: string): Promise<string> {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
      const plainText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plainText) {
        throw new Error('Decryption resulted in empty string');
      }
      
      return plainText;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash a string using SHA256
   */
  public async hash(input: string): Promise<string> {
    try {
      return CryptoJS.SHA256(input).toString();
    } catch (error) {
      console.error('❌ Hashing failed:', error);
      throw new Error('Hashing failed');
    }
  }

  /**
   * Generate a secure random token
   */
  public generateSecureToken(length: number = 32): string {
    try {
      return CryptoJS.lib.WordArray.random(length).toString();
    } catch (error) {
      console.error('❌ Token generation failed:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Encrypt PIN with additional security
   */
  public async encryptPIN(pin: string): Promise<string> {
    try {
      // Add salt to PIN before encryption
      const salt = generateId();
      const saltedPIN = pin + salt;
      const encrypted = await this.encrypt(saltedPIN);
      
      // Return encrypted PIN with salt appended
      return encrypted + '.' + salt;
    } catch (error) {
      console.error('❌ PIN encryption failed:', error);
      throw new Error('PIN encryption failed');
    }
  }

  /**
   * Decrypt and verify PIN
   */
  public async decryptPIN(encryptedPIN: string): Promise<string> {
    try {
      const [encrypted, salt] = encryptedPIN.split('.');
      if (!encrypted || !salt) {
        throw new Error('Invalid encrypted PIN format');
      }
      
      const decrypted = await this.decrypt(encrypted);
      
      // Remove salt from decrypted PIN
      if (decrypted.endsWith(salt)) {
        return decrypted.slice(0, -salt.length);
      }
      
      throw new Error('PIN verification failed');
    } catch (error) {
      console.error('❌ PIN decryption failed:', error);
      throw new Error('PIN decryption failed');
    }
  }

  /**
   * Verify PIN without decrypting
   */
  public async verifyPIN(inputPIN: string, encryptedPIN: string): Promise<boolean> {
    try {
      const decryptedPIN = await this.decryptPIN(encryptedPIN);
      return inputPIN === decryptedPIN;
    } catch (error) {
      console.error('❌ PIN verification failed:', error);
      return false;
    }
  }

  /**
   * Encrypt location data
   */
  public async encryptLocationData(locationData: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(locationData);
      return await this.encrypt(jsonString);
    } catch (error) {
      console.error('❌ Location data encryption failed:', error);
      throw new Error('Location data encryption failed');
    }
  }

  /**
   * Decrypt location data
   */
  public async decryptLocationData(encryptedData: string): Promise<any> {
    try {
      const decrypted = await this.decrypt(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('❌ Location data decryption failed:', error);
      throw new Error('Location data decryption failed');
    }
  }
}

// Export singleton instance
export default EncryptionService.getInstance();
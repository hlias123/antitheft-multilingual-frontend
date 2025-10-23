import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptionService from './EncryptionService';

/**
 * Storage Service for secure data persistence
 */
class StorageService {
  private static instance: StorageService;
  private isInitialized = false;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Initialize the storage service
   */
  public async initialize(): Promise<void> {
    try {
      // Test AsyncStorage availability
      await AsyncStorage.getItem('test');
      this.isInitialized = true;
      console.log('✅ StorageService initialized');
    } catch (error) {
      console.error('❌ StorageService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store an item in AsyncStorage
   */
  public async setItem(key: string, value: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`❌ Failed to store item with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Retrieve an item from AsyncStorage
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`❌ Failed to retrieve item with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Remove an item from AsyncStorage
   */
  public async removeItem(key: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`❌ Failed to remove item with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Store sensitive data with encryption
   */
  public async setSecureItem(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = await EncryptionService.encrypt(value);
      await this.setItem(key, encryptedValue);
    } catch (error) {
      console.error(`❌ Failed to store secure item with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt sensitive data
   */
  public async getSecureItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = await this.getItem(key);
      if (!encryptedValue) {
        return null;
      }
      
      return await EncryptionService.decrypt(encryptedValue);
    } catch (error) {
      console.error(`❌ Failed to retrieve secure item with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Store JSON data
   */
  public async setObject(key: string, value: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.setItem(key, jsonString);
    } catch (error) {
      console.error(`❌ Failed to store object with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Retrieve JSON data
   */
  public async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonString = await this.getItem(key);
      if (!jsonString) {
        return null;
      }
      
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error(`❌ Failed to retrieve object with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  public async getAllKeys(): Promise<string[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('❌ Failed to get all keys', error);
      throw error;
    }
  }

  /**
   * Clear all data
   */
  public async clear(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      await AsyncStorage.clear();
    } catch (error) {
      console.error('❌ Failed to clear storage', error);
      throw error;
    }
  }

  /**
   * Get multiple items
   */
  public async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('❌ Failed to get multiple items', error);
      throw error;
    }
  }

  /**
   * Set multiple items
   */
  public async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('❌ Failed to set multiple items', error);
      throw error;
    }
  }

  /**
   * Remove multiple items
   */
  public async multiRemove(keys: string[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('❌ Failed to remove multiple items', error);
      throw error;
    }
  }
}

// Export singleton instance
export default StorageService.getInstance();
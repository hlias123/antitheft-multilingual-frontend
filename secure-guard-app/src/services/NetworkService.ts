import { APP_CONFIG, NETWORK_CONFIG } from '@/utils/constants';
import StorageService from './StorageService';
import { STORAGE_KEYS } from '@/utils/constants';

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Network Service for API communication and file uploads
 */
class NetworkService {
  private static instance: NetworkService;
  private baseURL: string = APP_CONFIG.API_BASE_URL;
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  /**
   * Initialize network service
   */
  public async initialize(): Promise<void> {
    try {
      // Set up default headers with auth token if available
      await this.updateAuthHeaders();
      console.log('✅ NetworkService initialized');
    } catch (error) {
      console.error('❌ NetworkService initialization failed:', error);
    }
  }

  /**
   * Update authorization headers
   */
  public async updateAuthHeaders(): Promise<void> {
    try {
      const token = await StorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Failed to update auth headers:', error);
    }
  }

  /**
   * Make GET request
   */
  public async get<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * Make POST request
   */
  public async post<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * Make PUT request
   */
  public async put<T = any>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  /**
   * Make DELETE request
   */
  public async delete<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const timeout = options.timeout || NETWORK_CONFIG.TIMEOUT;
    const maxRetries = options.retries || NETWORK_CONFIG.RETRY_ATTEMPTS;

    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    const requestOptions: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result as T;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = NETWORK_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
          console.log(`⚠️ Request failed, retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`❌ Request failed after ${maxRetries + 1} attempts:`, lastError);
    throw lastError;
  }

  /**
   * Upload file with progress tracking
   */
  public async uploadFile(
    endpoint: string,
    fileUri: string,
    metadata: Record<string, any> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Create FormData
      const formData = new FormData();
      
      // Add file
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      } as any);

      // Add metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      // Prepare headers
      const headers = {
        ...this.defaultHeaders,
        'Content-Type': 'multipart/form-data',
      };
      delete headers['Content-Type']; // Let browser set it with boundary

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            onProgress(progress);
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed: Network error'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload failed: Timeout'));
        });

        // Configure and send request
        xhr.open('POST', url);
        xhr.timeout = NETWORK_CONFIG.TIMEOUT;

        // Set headers
        Object.keys(headers).forEach(key => {
          if (key !== 'Content-Type') { // Skip Content-Type for FormData
            xhr.setRequestHeader(key, headers[key]);
          }
        });

        xhr.send(formData);
      });
    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files in chunks
   */
  public async uploadMultipleFiles(
    endpoint: string,
    files: Array<{ uri: string; metadata: Record<string, any> }>,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<any[]> {
    const results: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.uploadFile(
          endpoint,
          file.uri,
          file.metadata,
          onProgress ? (progress) => onProgress(i, progress) : undefined
        );
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to upload file ${i + 1}:`, error);
        results.push({ error: error.message });
      }
    }

    return results;
  }

  /**
   * Download file
   */
  public async downloadFile(
    url: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track download progress
        xhr.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            onProgress(progress);
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Download failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Download failed: Network error'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Download failed: Timeout'));
        });

        // Configure and send request
        xhr.open('GET', url);
        xhr.timeout = NETWORK_CONFIG.TIMEOUT;
        xhr.send();
      });
    } catch (error) {
      console.error('❌ File download failed:', error);
      throw error;
    }
  }

  /**
   * Check network connectivity
   */
  public async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get network status
   */
  public async getNetworkStatus(): Promise<{
    isConnected: boolean;
    connectionType: string;
    isExpensive: boolean;
  }> {
    try {
      // This would use @react-native-community/netinfo
      return {
        isConnected: true,
        connectionType: 'wifi',
        isExpensive: false,
      };
    } catch (error) {
      return {
        isConnected: false,
        connectionType: 'none',
        isExpensive: false,
      };
    }
  }

  /**
   * Queue request for offline retry
   */
  public async queueOfflineRequest(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<void> {
    try {
      const queue = await StorageService.getObject<any[]>('offline_request_queue') || [];
      
      queue.push({
        id: Date.now().toString(),
        method,
        endpoint,
        data,
        timestamp: new Date().toISOString(),
      });

      await StorageService.setObject('offline_request_queue', queue);
    } catch (error) {
      console.error('❌ Failed to queue offline request:', error);
    }
  }

  /**
   * Process queued offline requests
   */
  public async processOfflineQueue(): Promise<void> {
    try {
      const queue = await StorageService.getObject<any[]>('offline_request_queue') || [];
      
      if (queue.length === 0) {
        return;
      }

      const processedIds: string[] = [];

      for (const request of queue) {
        try {
          await this.request(request.method, request.endpoint, request.data);
          processedIds.push(request.id);
        } catch (error) {
          console.error(`❌ Failed to process queued request ${request.id}:`, error);
          break; // Stop processing if network is still unavailable
        }
      }

      // Remove processed requests
      if (processedIds.length > 0) {
        const remainingQueue = queue.filter(req => !processedIds.includes(req.id));
        await StorageService.setObject('offline_request_queue', remainingQueue);
        console.log(`✅ Processed ${processedIds.length} queued requests`);
      }
    } catch (error) {
      console.error('❌ Failed to process offline queue:', error);
    }
  }

  /**
   * Set base URL
   */
  public setBaseURL(url: string): void {
    this.baseURL = url;
  }

  /**
   * Get base URL
   */
  public getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Set default headers
   */
  public setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Get default headers
   */
  public getDefaultHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }

  /**
   * Clear auth headers
   */
  public clearAuthHeaders(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

// Export singleton instance
export default NetworkService.getInstance();
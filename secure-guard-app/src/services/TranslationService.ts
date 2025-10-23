import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import { SUPPORTED_LANGUAGES, STORAGE_KEYS } from '@/utils/constants';
import StorageService from './StorageService';

// Import translation files
import ar from '../locales/ar.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import it from '../locales/it.json';
import pt from '../locales/pt.json';
import ru from '../locales/ru.json';
import zh from '../locales/zh.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import hi from '../locales/hi.json';
import tr from '../locales/tr.json';
import pl from '../locales/pl.json';
import nl from '../locales/nl.json';
import sv from '../locales/sv.json';
import da from '../locales/da.json';
import no from '../locales/no.json';
import fi from '../locales/fi.json';
import cs from '../locales/cs.json';
import sk from '../locales/sk.json';
import hu from '../locales/hu.json';
import ro from '../locales/ro.json';
import bg from '../locales/bg.json';
import hr from '../locales/hr.json';
import sl from '../locales/sl.json';
import et from '../locales/et.json';
import lv from '../locales/lv.json';
import lt from '../locales/lt.json';

// Translation resources
const resources = {
  ar: { translation: ar },
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  hi: { translation: hi },
  tr: { translation: tr },
  pl: { translation: pl },
  nl: { translation: nl },
  sv: { translation: sv },
  da: { translation: da },
  no: { translation: no },
  fi: { translation: fi },
  cs: { translation: cs },
  sk: { translation: sk },
  hu: { translation: hu },
  ro: { translation: ro },
  bg: { translation: bg },
  hr: { translation: hr },
  sl: { translation: sl },
  et: { translation: et },
  lv: { translation: lv },
  lt: { translation: lt },
};

/**
 * Translation Service for multi-language support
 */
class TranslationService {
  private static instance: TranslationService;
  private isInitialized = false;
  private currentLanguage = 'ar';

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Initialize translation service
   */
  public async initialize(): Promise<void> {
    try {
      // Get saved language or detect system language
      const savedLanguage = await this.getSavedLanguage();
      const systemLanguage = this.detectSystemLanguage();
      const initialLanguage = savedLanguage || systemLanguage || 'ar';

      // Initialize i18next
      await i18n
        .use(initReactI18next)
        .init({
          resources,
          lng: initialLanguage,
          fallbackLng: 'en',
          debug: __DEV__,
          
          interpolation: {
            escapeValue: false, // React already escapes values
          },
          
          react: {
            useSuspense: false,
          },
          
          // RTL languages
          rtl: ['ar', 'he', 'fa', 'ur'],
        });

      this.currentLanguage = initialLanguage;
      this.isInitialized = true;

      console.log(`✅ TranslationService initialized with language: ${initialLanguage}`);
    } catch (error) {
      console.error('❌ TranslationService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get saved language from storage
   */
  private async getSavedLanguage(): Promise<string | null> {
    try {
      return await StorageService.getItem(STORAGE_KEYS.LANGUAGE);
    } catch (error) {
      console.error('❌ Failed to get saved language:', error);
      return null;
    }
  }

  /**
   * Detect system language
   */
  private detectSystemLanguage(): string {
    try {
      const locales = getLocales();
      
      if (locales && locales.length > 0) {
        const systemLanguage = locales[0].languageCode;
        
        // Check if system language is supported
        if (SUPPORTED_LANGUAGES.includes(systemLanguage)) {
          return systemLanguage;
        }
        
        // Try to find a similar language
        const similarLanguage = SUPPORTED_LANGUAGES.find(lang => 
          lang.startsWith(systemLanguage.split('-')[0])
        );
        
        if (similarLanguage) {
          return similarLanguage;
        }
      }
      
      return 'ar'; // Default to Arabic
    } catch (error) {
      console.error('❌ Failed to detect system language:', error);
      return 'ar';
    }
  }

  /**
   * Change language
   */
  public async changeLanguage(languageCode: string): Promise<void> {
    try {
      if (!SUPPORTED_LANGUAGES.includes(languageCode)) {
        throw new Error(`Unsupported language: ${languageCode}`);
      }

      // Change i18next language
      await i18n.changeLanguage(languageCode);
      
      // Save to storage
      await StorageService.setItem(STORAGE_KEYS.LANGUAGE, languageCode);
      
      this.currentLanguage = languageCode;
      
      console.log(`✅ Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('❌ Failed to change language:', error);
      throw error;
    }
  }

  /**
   * Get current language
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
      { code: 'da', name: 'Danish', nativeName: 'Dansk' },
      { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
      { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
      { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
      { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
      { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
      { code: 'ro', name: 'Romanian', nativeName: 'Română' },
      { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
      { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
      { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
      { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
      { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
      { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
    ];
  }

  /**
   * Check if language is RTL
   */
  public isRTL(languageCode?: string): boolean {
    const lang = languageCode || this.currentLanguage;
    return ['ar', 'he', 'fa', 'ur'].includes(lang);
  }

  /**
   * Get translation for key
   */
  public translate(key: string, options?: any): string {
    try {
      return i18n.t(key, options);
    } catch (error) {
      console.error(`❌ Translation failed for key: ${key}`, error);
      return key; // Return key as fallback
    }
  }

  /**
   * Get translation with pluralization
   */
  public translatePlural(key: string, count: number, options?: any): string {
    try {
      return i18n.t(key, { count, ...options });
    } catch (error) {
      console.error(`❌ Plural translation failed for key: ${key}`, error);
      return key;
    }
  }

  /**
   * Check if translation exists
   */
  public exists(key: string): boolean {
    return i18n.exists(key);
  }

  /**
   * Get language direction
   */
  public getDirection(languageCode?: string): 'ltr' | 'rtl' {
    return this.isRTL(languageCode) ? 'rtl' : 'ltr';
  }

  /**
   * Format number according to current locale
   */
  public formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    try {
      const locale = this.getLocaleForLanguage(this.currentLanguage);
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      console.error('❌ Number formatting failed:', error);
      return number.toString();
    }
  }

  /**
   * Format date according to current locale
   */
  public formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      const locale = this.getLocaleForLanguage(this.currentLanguage);
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      console.error('❌ Date formatting failed:', error);
      return date.toLocaleDateString();
    }
  }

  /**
   * Format currency according to current locale
   */
  public formatCurrency(amount: number, currency: string = 'USD'): string {
    try {
      const locale = this.getLocaleForLanguage(this.currentLanguage);
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      console.error('❌ Currency formatting failed:', error);
      return `${amount} ${currency}`;
    }
  }

  /**
   * Get locale string for language
   */
  private getLocaleForLanguage(languageCode: string): string {
    const localeMap: Record<string, string> = {
      ar: 'ar-SA',
      en: 'en-US',
      fr: 'fr-FR',
      es: 'es-ES',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-PT',
      ru: 'ru-RU',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ko: 'ko-KR',
      hi: 'hi-IN',
      tr: 'tr-TR',
      pl: 'pl-PL',
      nl: 'nl-NL',
      sv: 'sv-SE',
      da: 'da-DK',
      no: 'no-NO',
      fi: 'fi-FI',
      cs: 'cs-CZ',
      sk: 'sk-SK',
      hu: 'hu-HU',
      ro: 'ro-RO',
      bg: 'bg-BG',
      hr: 'hr-HR',
      sl: 'sl-SI',
      et: 'et-EE',
      lv: 'lv-LV',
      lt: 'lt-LT',
    };

    return localeMap[languageCode] || 'en-US';
  }

  /**
   * Load additional translations dynamically
   */
  public async loadTranslations(languageCode: string, translations: Record<string, any>): Promise<void> {
    try {
      i18n.addResourceBundle(languageCode, 'translation', translations, true, true);
      console.log(`✅ Additional translations loaded for: ${languageCode}`);
    } catch (error) {
      console.error('❌ Failed to load additional translations:', error);
      throw error;
    }
  }

  /**
   * Get missing translation keys
   */
  public getMissingKeys(languageCode: string): string[] {
    try {
      const missingKeys: string[] = [];
      const resources = i18n.getResourceBundle(languageCode, 'translation');
      const englishResources = i18n.getResourceBundle('en', 'translation');
      
      if (englishResources) {
        this.findMissingKeys(englishResources, resources || {}, '', missingKeys);
      }
      
      return missingKeys;
    } catch (error) {
      console.error('❌ Failed to get missing keys:', error);
      return [];
    }
  }

  /**
   * Recursively find missing translation keys
   */
  private findMissingKeys(
    source: any,
    target: any,
    prefix: string,
    missingKeys: string[]
  ): void {
    for (const key in source) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof source[key] === 'object' && source[key] !== null) {
        this.findMissingKeys(
          source[key],
          target[key] || {},
          fullKey,
          missingKeys
        );
      } else if (!(key in target)) {
        missingKeys.push(fullKey);
      }
    }
  }

  /**
   * Get translation statistics
   */
  public getTranslationStats(): {
    currentLanguage: string;
    supportedLanguages: number;
    isRTL: boolean;
    totalKeys: number;
  } {
    const englishResources = i18n.getResourceBundle('en', 'translation');
    const totalKeys = englishResources ? this.countKeys(englishResources) : 0;

    return {
      currentLanguage: this.currentLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES.length,
      isRTL: this.isRTL(),
      totalKeys,
    };
  }

  /**
   * Count total translation keys
   */
  private countKeys(obj: any): number {
    let count = 0;
    
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += this.countKeys(obj[key]);
      } else {
        count++;
      }
    }
    
    return count;
  }
}

// Export singleton instance
export default TranslationService.getInstance();
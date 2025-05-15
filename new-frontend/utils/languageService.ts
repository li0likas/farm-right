import enTranslations from '@/translations/en.json';
import ltTranslations from '@/translations/lt.json';

type TranslationsType = typeof enTranslations;

class LanguageService {
  private static instance: LanguageService;
  private translations: Record<string, TranslationsType> = {
    en: enTranslations,
    lt: ltTranslations
  };
  private currentLanguage: string = 'en';

  private constructor() {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('language');
      if (storedLang && (storedLang === 'en' || storedLang === 'lt')) {
        this.currentLanguage = storedLang;
      } else {
        this.currentLanguage = 'lt';
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', 'lt');
        }
      }
    }
  }

  public static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  public setLanguage(lang: string): void {
    if (lang === 'en' || lang === 'lt') {
      this.currentLanguage = lang;
    }
  }

  public t(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value as string;
  }
}

export default LanguageService.getInstance();
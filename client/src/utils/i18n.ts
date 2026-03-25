import en from '../locales/en.json';
import id from '../locales/id.json';

type LocaleData = typeof en;
type Language = 'en' | 'id';

const locales: Record<Language, LocaleData> = {
    en,
    id
};

class I18n {
    private currentLang: Language = 'en';

    constructor() {
        const savedLang = localStorage.getItem('app_lang') as Language;
        if (savedLang && locales[savedLang]) {
            this.currentLang = savedLang;
        } else {
            // Default to browser language if available and supported, otherwise 'en'
            const browserLang = navigator.language.split('-')[0] as Language;
            if (locales[browserLang]) {
                this.currentLang = browserLang;
            }
        }
    }

    setLanguage(lang: Language) {
        if (locales[lang]) {
            this.currentLang = lang;
            localStorage.setItem('app_lang', lang);
            
            // Dispatch event for components to react
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
        }
    }

    getLanguage(): Language {
        return this.currentLang;
    }

    t(key: string): string {
        const keys = key.split('.');
        let result: any = locales[this.currentLang];

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                // Fallback to English if key missing in current language
                let fallback: any = locales['en'];
                for (const fk of keys) {
                   if (fallback && fallback[fk]) {
                       fallback = fallback[fk];
                   } else {
                       return key; // Return the key itself as last resort
                   }
                }
                return fallback;
            }
        }

        return typeof result === 'string' ? result : key;
    }
}

export const i18n = new I18n();

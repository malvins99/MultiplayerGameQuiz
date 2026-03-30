import en from '../locales/en.json';
import id from '../locales/id.json';
import ar from '../locales/ar.json';

type LocaleData = typeof en;
type Language = 'en' | 'id' | 'ar';

const locales: Record<Language, any> = {
    en,
    id,
    ar
};

class I18n {
    private currentLang: Language = 'en';

    constructor() {
        if (!document.getElementById('ar-font-styles')) {
            const style = document.createElement('style');
            style.id = 'ar-font-styles';
            style.innerHTML = `
                @font-face {
                    font-family: 'LPMQ';
                    src: url('/fonts/LPMQ IsepMisbah.ttf') format('truetype');
                    unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
                }
                .ar-font *:not(.material-symbols-outlined):not(.material-icons) {
                    font-family: 'LPMQ', 'Retro Gaming', cursive, sans-serif !important;
                    letter-spacing: normal !important;
                }
            `;
            document.head.appendChild(style);
        }

        const savedLang = localStorage.getItem('app_lang') as Language;
        if (savedLang && locales[savedLang]) {
            this.setLanguage(savedLang, false);
        } else {
            // Default to browser language if available and supported, otherwise 'en'
            const browserLang = navigator.language.split('-')[0] as Language;
            if (locales[browserLang]) {
                this.setLanguage(browserLang, false);
            } else {
                this.setLanguage('en', false);
            }
        }
    }

    setLanguage(lang: Language, dispatchEvent: boolean = true) {
        if (locales[lang]) {
            this.currentLang = lang;
            localStorage.setItem('app_lang', lang);
            
            document.documentElement.lang = lang;
            document.documentElement.dir = 'ltr'; // Beban layout tetap kiri-ke-kanan, tulisan arab akan tetap render ke kanan sendiri.

            if (lang === 'ar') {
                document.documentElement.classList.add('ar-font');
            } else {
                document.documentElement.classList.remove('ar-font');
            }
            
            if (dispatchEvent) {
                // Dispatch event for components to react
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
            }
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

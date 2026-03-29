import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import uz from './locales/uz'
import ru from './locales/ru'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: localStorage.getItem('app-language') ?? 'uz',
  fallbackLng: 'uz',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n

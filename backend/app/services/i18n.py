# @AI-HINT: Multi-language support with translation management
"""
Internationalization Service - Multi-language support system.

Features:
- Multiple language support
- Translation management
- Locale detection
- Date/time/currency formatting
- Right-to-left support
- Machine translation integration
"""

import logging
import re
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from enum import Enum

logger = logging.getLogger(__name__)


class Language(str, Enum):
    """Supported languages."""
    EN = "en"      # English
    ES = "es"      # Spanish
    FR = "fr"      # French
    DE = "de"      # German
    PT = "pt"      # Portuguese
    ZH = "zh"      # Chinese
    JA = "ja"      # Japanese
    AR = "ar"      # Arabic (RTL)
    HI = "hi"      # Hindi
    RU = "ru"      # Russian


# Language metadata
LANGUAGE_CONFIG = {
    Language.EN: {
        "name": "English",
        "native_name": "English",
        "rtl": False,
        "locale": "en-US",
        "flag": "🇺🇸"
    },
    Language.ES: {
        "name": "Spanish",
        "native_name": "Español",
        "rtl": False,
        "locale": "es-ES",
        "flag": "🇪🇸"
    },
    Language.FR: {
        "name": "French",
        "native_name": "Français",
        "rtl": False,
        "locale": "fr-FR",
        "flag": "🇫🇷"
    },
    Language.DE: {
        "name": "German",
        "native_name": "Deutsch",
        "rtl": False,
        "locale": "de-DE",
        "flag": "🇩🇪"
    },
    Language.PT: {
        "name": "Portuguese",
        "native_name": "Português",
        "rtl": False,
        "locale": "pt-BR",
        "flag": "🇧🇷"
    },
    Language.ZH: {
        "name": "Chinese",
        "native_name": "中文",
        "rtl": False,
        "locale": "zh-CN",
        "flag": "🇨🇳"
    },
    Language.JA: {
        "name": "Japanese",
        "native_name": "日本語",
        "rtl": False,
        "locale": "ja-JP",
        "flag": "🇯🇵"
    },
    Language.AR: {
        "name": "Arabic",
        "native_name": "العربية",
        "rtl": True,
        "locale": "ar-SA",
        "flag": "🇸🇦"
    },
    Language.HI: {
        "name": "Hindi",
        "native_name": "हिन्दी",
        "rtl": False,
        "locale": "hi-IN",
        "flag": "🇮🇳"
    },
    Language.RU: {
        "name": "Russian",
        "native_name": "Русский",
        "rtl": False,
        "locale": "ru-RU",
        "flag": "🇷🇺"
    }
}


class InternationalizationService:
    """
    Multi-language support and localization service.
    
    Provides translation management, locale detection,
    and formatting for international users.
    """
    
    # Translation dictionary (would be loaded from DB/files in production)
    TRANSLATIONS = {
        Language.EN: {
            # Common
            "welcome": "Welcome to MegiLance",
            "login": "Log In",
            "signup": "Sign Up",
            "logout": "Log Out",
            "profile": "Profile",
            "settings": "Settings",
            "dashboard": "Dashboard",
            "search": "Search",
            "submit": "Submit",
            "cancel": "Cancel",
            "save": "Save",
            "delete": "Delete",
            "edit": "Edit",
            "view": "View",
            "loading": "Loading...",
            "error": "An error occurred",
            "success": "Success!",
            
            # Projects
            "projects": "Projects",
            "post_project": "Post a Project",
            "browse_projects": "Browse Projects",
            "project_title": "Project Title",
            "project_description": "Project Description",
            "budget": "Budget",
            "deadline": "Deadline",
            "skills_required": "Skills Required",
            
            # Proposals
            "proposals": "Proposals",
            "submit_proposal": "Submit Proposal",
            "cover_letter": "Cover Letter",
            "proposed_rate": "Proposed Rate",
            
            # User types
            "freelancer": "Freelancer",
            "client": "Client",
            "admin": "Administrator",
            
            # Messages
            "messages": "Messages",
            "new_message": "New Message",
            "send_message": "Send Message",
            
            # Payments
            "payments": "Payments",
            "withdraw": "Withdraw",
            "deposit": "Deposit",
            "balance": "Balance",
            "escrow": "Escrow"
        },
        Language.ES: {
            "welcome": "Bienvenido a MegiLance",
            "login": "Iniciar Sesión",
            "signup": "Registrarse",
            "logout": "Cerrar Sesión",
            "profile": "Perfil",
            "settings": "Configuración",
            "dashboard": "Panel",
            "search": "Buscar",
            "submit": "Enviar",
            "cancel": "Cancelar",
            "save": "Guardar",
            "delete": "Eliminar",
            "edit": "Editar",
            "view": "Ver",
            "loading": "Cargando...",
            "error": "Ha ocurrido un error",
            "success": "¡Éxito!",
            
            "projects": "Proyectos",
            "post_project": "Publicar Proyecto",
            "browse_projects": "Explorar Proyectos",
            "project_title": "Título del Proyecto",
            "project_description": "Descripción del Proyecto",
            "budget": "Presupuesto",
            "deadline": "Fecha Límite",
            "skills_required": "Habilidades Requeridas",
            
            "proposals": "Propuestas",
            "submit_proposal": "Enviar Propuesta",
            "cover_letter": "Carta de Presentación",
            "proposed_rate": "Tarifa Propuesta",
            
            "freelancer": "Freelancer",
            "client": "Cliente",
            "admin": "Administrador",
            
            "messages": "Mensajes",
            "new_message": "Nuevo Mensaje",
            "send_message": "Enviar Mensaje",
            
            "payments": "Pagos",
            "withdraw": "Retirar",
            "deposit": "Depositar",
            "balance": "Saldo",
            "escrow": "Depósito en Garantía"
        },
        Language.FR: {
            "welcome": "Bienvenue sur MegiLance",
            "login": "Connexion",
            "signup": "S'inscrire",
            "logout": "Déconnexion",
            "profile": "Profil",
            "settings": "Paramètres",
            "dashboard": "Tableau de Bord",
            "search": "Rechercher",
            "submit": "Soumettre",
            "cancel": "Annuler",
            "save": "Sauvegarder",
            "delete": "Supprimer",
            "edit": "Modifier",
            "view": "Voir",
            "loading": "Chargement...",
            "error": "Une erreur s'est produite",
            "success": "Succès !",
            
            "projects": "Projets",
            "post_project": "Publier un Projet",
            "browse_projects": "Parcourir les Projets",
            "project_title": "Titre du Projet",
            "project_description": "Description du Projet",
            "budget": "Budget",
            "deadline": "Date Limite",
            "skills_required": "Compétences Requises",
            
            "proposals": "Propositions",
            "submit_proposal": "Soumettre une Proposition",
            "cover_letter": "Lettre de Motivation",
            "proposed_rate": "Tarif Proposé",
            
            "freelancer": "Freelance",
            "client": "Client",
            "admin": "Administrateur",
            
            "messages": "Messages",
            "new_message": "Nouveau Message",
            "send_message": "Envoyer un Message",
            
            "payments": "Paiements",
            "withdraw": "Retirer",
            "deposit": "Déposer",
            "balance": "Solde",
            "escrow": "Séquestre"
        },
        Language.AR: {
            "welcome": "مرحباً بك في MegiLance",
            "login": "تسجيل الدخول",
            "signup": "إنشاء حساب",
            "logout": "تسجيل الخروج",
            "profile": "الملف الشخصي",
            "settings": "الإعدادات",
            "dashboard": "لوحة التحكم",
            "search": "بحث",
            "submit": "إرسال",
            "cancel": "إلغاء",
            "save": "حفظ",
            "delete": "حذف",
            "edit": "تعديل",
            "view": "عرض",
            "loading": "جاري التحميل...",
            "error": "حدث خطأ",
            "success": "نجاح!",
            
            "projects": "المشاريع",
            "post_project": "نشر مشروع",
            "browse_projects": "تصفح المشاريع",
            "project_title": "عنوان المشروع",
            "project_description": "وصف المشروع",
            "budget": "الميزانية",
            "deadline": "الموعد النهائي",
            "skills_required": "المهارات المطلوبة",
            
            "freelancer": "مستقل",
            "client": "عميل",
            "admin": "مدير",
            
            "messages": "الرسائل",
            "payments": "المدفوعات"
        }
    }
    
    def __init__(self, db: Session):
        self.db = db
        self._user_preferences: Dict[int, str] = {}
        self._custom_translations: Dict[str, Dict[str, str]] = {}
    
    def get_supported_languages(self) -> List[Dict[str, Any]]:
        """Get list of supported languages."""
        return [
            {
                "code": lang.value,
                **LANGUAGE_CONFIG[lang]
            }
            for lang in Language
        ]
    
    def translate(
        self,
        key: str,
        language: Language = Language.EN,
        params: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Get translation for a key.
        
        Args:
            key: Translation key
            language: Target language
            params: Interpolation parameters
            
        Returns:
            Translated string
        """
        # Try custom translations first
        if language.value in self._custom_translations:
            if key in self._custom_translations[language.value]:
                text = self._custom_translations[language.value][key]
                return self._interpolate(text, params)
        
        # Fall back to built-in translations
        translations = self.TRANSLATIONS.get(language, self.TRANSLATIONS[Language.EN])
        text = translations.get(key, key)
        
        # If not found in target language, fall back to English
        if text == key and language != Language.EN:
            text = self.TRANSLATIONS[Language.EN].get(key, key)
        
        return self._interpolate(text, params)
    
    def translate_batch(
        self,
        keys: List[str],
        language: Language = Language.EN
    ) -> Dict[str, str]:
        """Translate multiple keys at once."""
        return {key: self.translate(key, language) for key in keys}
    
    def get_all_translations(
        self,
        language: Language
    ) -> Dict[str, str]:
        """Get all translations for a language."""
        base = self.TRANSLATIONS.get(language, {}).copy()
        
        # Merge custom translations
        if language.value in self._custom_translations:
            base.update(self._custom_translations[language.value])
        
        return base
    
    def add_translation(
        self,
        key: str,
        translations: Dict[str, str]
    ) -> Dict[str, Any]:
        """Add or update a translation."""
        for lang_code, text in translations.items():
            if lang_code not in self._custom_translations:
                self._custom_translations[lang_code] = {}
            self._custom_translations[lang_code][key] = text
        
        return {
            "key": key,
            "languages": list(translations.keys()),
            "status": "added"
        }
    
    def detect_language(
        self,
        text: str
    ) -> Dict[str, Any]:
        """Detect language from text (simplified)."""
        # Simplified detection based on character patterns
        # Would use a proper library like langdetect in production
        
        # Check for Arabic characters
        if re.search(r'[\u0600-\u06FF]', text):
            return {"language": Language.AR.value, "confidence": 0.8}
        
        # Check for Chinese characters
        if re.search(r'[\u4e00-\u9fff]', text):
            return {"language": Language.ZH.value, "confidence": 0.8}
        
        # Check for Japanese characters
        if re.search(r'[\u3040-\u309f\u30a0-\u30ff]', text):
            return {"language": Language.JA.value, "confidence": 0.8}
        
        # Check for Cyrillic (Russian)
        if re.search(r'[\u0400-\u04FF]', text):
            return {"language": Language.RU.value, "confidence": 0.8}
        
        # Check for Hindi/Devanagari
        if re.search(r'[\u0900-\u097F]', text):
            return {"language": Language.HI.value, "confidence": 0.8}
        
        # Check for common Spanish words
        spanish_indicators = ['que', 'como', 'para', 'está', 'ción']
        if any(word in text.lower() for word in spanish_indicators):
            return {"language": Language.ES.value, "confidence": 0.6}
        
        # Check for common French words
        french_indicators = ['que', 'pour', 'avec', 'dans', 'vous']
        if any(word in text.lower() for word in french_indicators):
            return {"language": Language.FR.value, "confidence": 0.6}
        
        # Default to English
        return {"language": Language.EN.value, "confidence": 0.5}
    
    def format_currency(
        self,
        amount: float,
        currency: str = "USD",
        language: Language = Language.EN
    ) -> str:
        """Format currency for locale."""
        symbols = {
            "USD": "$",
            "EUR": "€",
            "GBP": "£",
            "JPY": "¥",
            "CNY": "¥",
            "INR": "₹",
            "RUB": "₽"
        }
        
        symbol = symbols.get(currency, currency)
        
        # Format based on language conventions
        if language in [Language.DE, Language.FR, Language.ES, Language.PT, Language.RU]:
            # European format: 1.234,56 €
            formatted = f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            return f"{formatted} {symbol}"
        else:
            # US/UK format: $1,234.56
            return f"{symbol}{amount:,.2f}"
    
    def format_date(
        self,
        date: datetime,
        language: Language = Language.EN,
        format: str = "medium"  # short, medium, long
    ) -> str:
        """Format date for locale."""
        if format == "short":
            if language in [Language.EN]:
                return date.strftime("%m/%d/%Y")
            elif language in [Language.DE, Language.FR, Language.ES, Language.PT]:
                return date.strftime("%d/%m/%Y")
            elif language in [Language.ZH, Language.JA]:
                return date.strftime("%Y/%m/%d")
            else:
                return date.strftime("%d/%m/%Y")
        
        elif format == "medium":
            if language == Language.EN:
                return date.strftime("%b %d, %Y")
            elif language == Language.ES:
                return date.strftime("%d de %b de %Y")
            elif language == Language.FR:
                return date.strftime("%d %b %Y")
            elif language == Language.DE:
                return date.strftime("%d. %b %Y")
            else:
                return date.strftime("%Y-%m-%d")
        
        else:  # long
            if language == Language.EN:
                return date.strftime("%B %d, %Y")
            else:
                return date.strftime("%d %B %Y")
    
    def format_number(
        self,
        number: float,
        language: Language = Language.EN,
        decimals: int = 2
    ) -> str:
        """Format number for locale."""
        formatted = f"{number:,.{decimals}f}"
        
        if language in [Language.DE, Language.FR, Language.ES, Language.PT, Language.RU]:
            # European format: 1.234,56
            formatted = formatted.replace(",", "X").replace(".", ",").replace("X", ".")
        
        return formatted
    
    def get_user_language(
        self,
        user_id: int
    ) -> Language:
        """Get user's preferred language."""
        pref = self._user_preferences.get(user_id)
        if pref:
            try:
                return Language(pref)
            except ValueError:
                pass
        return Language.EN
    
    def set_user_language(
        self,
        user_id: int,
        language: Language
    ) -> Dict[str, Any]:
        """Set user's preferred language."""
        self._user_preferences[user_id] = language.value
        
        return {
            "user_id": user_id,
            "language": language.value,
            "status": "updated"
        }
    
    def is_rtl(self, language: Language) -> bool:
        """Check if language is right-to-left."""
        return LANGUAGE_CONFIG.get(language, {}).get("rtl", False)
    
    def _interpolate(
        self,
        text: str,
        params: Optional[Dict[str, Any]]
    ) -> str:
        """Interpolate parameters into text."""
        if not params:
            return text
        
        for key, value in params.items():
            text = text.replace(f"{{{key}}}", str(value))
        
        return text


# Singleton instance
_i18n_service: Optional[InternationalizationService] = None


def get_i18n_service(db: Session) -> InternationalizationService:
    """Get or create i18n service instance."""
    global _i18n_service
    if _i18n_service is None:
        _i18n_service = InternationalizationService(db)
    else:
        _i18n_service.db = db
    return _i18n_service

// ملف الترجمات
const translations = {
    ar: {
        // العناوين الرئيسية
        page_title: "نظام مكافحة السرقة",
        site_name: "نظام مكافحة السرقة",
        current_lang: "العربية",
        
        // قسم البطل
        hero_title: "حماية متقدمة ضد السرقة",
        hero_description: "نظام شامل لحماية ممتلكاتك وتتبعها في الوقت الفعلي",
        get_started: "ابدأ الآن",
        
        // قسم الإحصائيات
        stats_title: "إحصائيات النظام",
        protected_devices: "الأجهزة المحمية",
        active_alerts: "التنبيهات النشطة",
        response_time: "زمن الاستجابة",
        
        // قسم المميزات
        features_title: "المميزات",
        feature1_title: "حماية متقدمة",
        feature1_desc: "تشفير عالي المستوى لحماية بياناتك",
        feature2_title: "تتبع فوري",
        feature2_desc: "تتبع موقع الجهاز في الوقت الفعلي",
        feature3_title: "تنبيهات فورية",
        feature3_desc: "إشعارات فورية عند اكتشاف أي نشاط مشبوه",
        
        // مميزات جديدة
        login_google: "تسجيل الدخول بـ Google",
        create_account: "إنشاء حساب جديد",
        email_verification: "تأكيد البريد الإلكتروني",
        view_map: "عرض الخريطة",
        
        // تذييل الصفحة
        footer_text: "© 2024 نظام مكافحة السرقة. جميع الحقوق محفوظة.",
        
        // رسائل النظام
        loading: "جاري التحميل...",
        error_connection: "خطأ في الاتصال بالخادم",
        success_saved: "تم حفظ التفضيلات بنجاح",
        redirecting: "جاري التوجيه للنظام..."
    },
    
    en: {
        // Main titles
        page_title: "Anti-Theft System",
        site_name: "Anti-Theft System",
        current_lang: "English",
        
        // Hero section
        hero_title: "Advanced Anti-Theft Protection",
        hero_description: "Comprehensive system to protect and track your belongings in real-time",
        get_started: "Get Started",
        
        // Stats section
        stats_title: "System Statistics",
        protected_devices: "Protected Devices",
        active_alerts: "Active Alerts",
        response_time: "Response Time",
        
        // Features section
        features_title: "Features",
        feature1_title: "Advanced Protection",
        feature1_desc: "High-level encryption to protect your data",
        feature2_title: "Real-time Tracking",
        feature2_desc: "Track device location in real-time",
        feature3_title: "Instant Alerts",
        feature3_desc: "Immediate notifications when suspicious activity is detected",
        
        // New features
        login_google: "Login with Google",
        create_account: "Create New Account",
        email_verification: "Email Verification",
        view_map: "View Map",
        
        // Footer
        footer_text: "© 2024 Anti-Theft System. All rights reserved.",
        
        // System messages
        loading: "Loading...",
        error_connection: "Connection error with server",
        success_saved: "Preferences saved successfully",
        redirecting: "Redirecting to system..."
    },
    
    el: {
        // Κύριοι τίτλοι
        page_title: "Σύστημα Κατά της Κλοπής",
        site_name: "Σύστημα Κατά της Κλοπής",
        current_lang: "Ελληνικά",
        
        // Ενότητα ήρωα
        hero_title: "Προηγμένη Προστασία Κατά της Κλοπής",
        hero_description: "Ολοκληρωμένο σύστημα για την προστασία και παρακολούθηση των αντικειμένων σας σε πραγματικό χρόνο",
        get_started: "Ξεκινήστε",
        
        // Ενότητα στατιστικών
        stats_title: "Στατιστικά Συστήματος",
        protected_devices: "Προστατευμένες Συσκευές",
        active_alerts: "Ενεργές Ειδοποιήσεις",
        response_time: "Χρόνος Απόκρισης",
        
        // Ενότητα χαρακτηριστικών
        features_title: "Χαρακτηριστικά",
        feature1_title: "Προηγμένη Προστασία",
        feature1_desc: "Κρυπτογράφηση υψηλού επιπέδου για την προστασία των δεδομένων σας",
        feature2_title: "Παρακολούθηση σε Πραγματικό Χρόνο",
        feature2_desc: "Παρακολουθήστε τη θέση της συσκευής σε πραγματικό χρόνο",
        feature3_title: "Άμεσες Ειδοποιήσεις",
        feature3_desc: "Άμεσες ειδοποιήσεις όταν εντοπιστεί ύποπτη δραστηριότητα",
        
        // Νέα χαρακτηριστικά
        login_google: "Σύνδεση με Google",
        create_account: "Δημιουργία Νέου Λογαριασμού",
        email_verification: "Επαλήθευση Email",
        view_map: "Προβολή Χάρτη",
        
        // Υποσέλιδο
        footer_text: "© 2024 Σύστημα Κατά της Κλοπής. Όλα τα δικαιώματα διατηρούνται.",
        
        // Μηνύματα συστήματος
        loading: "Φόρτωση...",
        error_connection: "Σφάλμα σύνδεσης με τον διακομιστή",
        success_saved: "Οι προτιμήσεις αποθηκεύτηκαν επιτυχώς",
        redirecting: "Ανακατεύθυνση στο σύστημα..."
    }
};

// إعدادات اللغة
const languageConfig = {
    ar: {
        dir: 'rtl',
        flag: '🇸🇦',
        name: 'العربية'
    },
    en: {
        dir: 'ltr',
        flag: '🇺🇸',
        name: 'English'
    },
    el: {
        dir: 'ltr',
        flag: '🇬🇷',
        name: 'Ελληνικά'
    }
};

// اللغة الافتراضية
let currentLanguage = localStorage.getItem('selectedLanguage') || 'ar';

// دالة تطبيق الترجمة
function applyTranslations(lang) {
    const elements = document.querySelectorAll('[data-translate]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // تحديث اتجاه الصفحة
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', languageConfig[lang].dir);
    
    // تحديث عنوان الصفحة
    document.title = translations[lang].page_title;
    
    // تحديث زر اللغة
    updateLanguageButton(lang);
    
    // حفظ اللغة المختارة
    localStorage.setItem('selectedLanguage', lang);
    currentLanguage = lang;
}

// دالة تحديث زر اللغة
function updateLanguageButton(lang) {
    const flagElement = document.getElementById('currentFlag');
    const langText = document.querySelector('[data-translate="current_lang"]');
    
    if (flagElement) {
        flagElement.textContent = languageConfig[lang].flag;
    }
    
    if (langText) {
        langText.textContent = languageConfig[lang].name;
    }
    
    // تحديث الخيارات النشطة
    const options = document.querySelectorAll('.lang-option');
    options.forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
        }
    });
}

// دالة تبديل اللغة
function switchLanguage(lang) {
    if (lang !== currentLanguage) {
        applyTranslations(lang);
        
        // إضافة تأثير انتقال سلس
        document.body.style.opacity = '0.8';
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 200);
    }
}

// تصدير الدوال للاستخدام في ملفات أخرى
window.translations = translations;
window.languageConfig = languageConfig;
window.applyTranslations = applyTranslations;
window.switchLanguage = switchLanguage;
window.currentLanguage = currentLanguage;
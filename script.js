// ملف JavaScript الرئيسي
document.addEventListener('DOMContentLoaded', function() {
    // فحص اللغة من URL أولاً، ثم من الخادم، ثم المحفوظة محلياً
    const urlLanguage = getLanguageFromURL();
    const serverLanguage = window.initialLanguage;
    const selectedLanguage = urlLanguage || serverLanguage || currentLanguage;
    
    // تطبيق اللغة المحددة
    applyTranslations(selectedLanguage);
    
    // إعداد زر تغيير اللغة
    setupLanguageSwitcher();
    
    // إعداد التأثيرات التفاعلية
    setupInteractiveEffects();
    
    // إعداد مزامنة URL
    setupURLSync();
    
    // تحميل البيانات من الباك إند
    loadBackendData();
});

// دالة إعداد مبدل اللغة
function setupLanguageSwitcher() {
    const languageBtn = document.getElementById('languageBtn');
    const langDropdown = document.getElementById('langDropdown');
    const langOptions = document.querySelectorAll('.lang-option');
    
    if (!languageBtn || !langDropdown) return;
    
    // فتح/إغلاق القائمة المنسدلة
    languageBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown();
    });
    
    // اختيار لغة من القائمة
    langOptions.forEach(option => {
        option.addEventListener('click', function() {
            const selectedLang = this.getAttribute('data-lang');
            switchLanguageWithURL(selectedLang);
            syncWithBackend(selectedLang);
            closeDropdown();
        });
    });
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!languageBtn.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // إغلاق القائمة عند الضغط على Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });
}

// دالة فتح/إغلاق القائمة المنسدلة
function toggleDropdown() {
    const languageBtn = document.getElementById('languageBtn');
    const langDropdown = document.getElementById('langDropdown');
    
    const isOpen = langDropdown.classList.contains('show');
    
    if (isOpen) {
        closeDropdown();
    } else {
        openDropdown();
    }
}

// دالة فتح القائمة المنسدلة
function openDropdown() {
    const languageBtn = document.getElementById('languageBtn');
    const langDropdown = document.getElementById('langDropdown');
    
    languageBtn.classList.add('active');
    langDropdown.classList.add('show');
}

// دالة إغلاق القائمة المنسدلة
function closeDropdown() {
    const languageBtn = document.getElementById('languageBtn');
    const langDropdown = document.getElementById('langDropdown');
    
    languageBtn.classList.remove('active');
    langDropdown.classList.remove('show');
}

// دالة إعداد التأثيرات التفاعلية
function setupInteractiveEffects() {
    // تأثير تمرير سلس للأزرار
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // تأثير النقر على زر "ابدأ الآن"
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            // إظهار رسالة التوجيه
            showNotification(translations[currentLanguage].redirecting || 'جاري التوجيه...');
            
            // توجيه للباك إند مع اللغة المحددة
            setTimeout(() => {
                const backendURL = 'https://antitheft-backend-production.up.railway.app/';
                window.location.href = backendURL + `?lang=${currentLanguage}`;
            }, 1000);
        });
    }
    
    // تأثير تحريك البطاقات عند التمرير
    const featureCards = document.querySelectorAll('.feature-card');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// دالة الحصول على الترجمة الحالية
function getCurrentTranslation(key) {
    return translations[currentLanguage] && translations[currentLanguage][key];
}

// دالة عرض الإشعارات
function showNotification(message) {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // تطبيق الأنماط
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: currentLanguage === 'ar' ? 'auto' : '20px',
        left: currentLanguage === 'ar' ? '20px' : 'auto',
        background: '#4caf50',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit',
        fontSize: '0.9rem'
    });
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // إخفاء الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// دالة تحديث المحتوى الديناميكي (للاستخدام المستقبلي)
function updateDynamicContent() {
    // يمكن استخدام هذه الدالة لتحديث المحتوى الذي يأتي من API
    console.log('تحديث المحتوى الديناميكي للغة:', currentLanguage);
}

// دالة تصدير إعدادات اللغة (للاستخدام مع APIs)
function getLanguageSettings() {
    return {
        currentLanguage: currentLanguage,
        direction: languageConfig[currentLanguage].dir,
        flag: languageConfig[currentLanguage].flag,
        name: languageConfig[currentLanguage].name
    };
}

// تصدير الدوال للاستخدام العام
window.getLanguageSettings = getLanguageSettings;
window.updateDynamicContent = updateDynamicContent;
window.showNotification = showNotification;
// دالة استخراج اللغة من URL
function getLanguageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    // التحقق من أن اللغة مدعومة
    if (langParam && translations[langParam]) {
        return langParam;
    }
    
    return null;
}

// دالة تحديث URL عند تغيير اللغة
function updateURL(lang) {
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    
    // تحديث URL بدون إعادة تحميل الصفحة
    window.history.pushState({ language: lang }, '', url);
}

// دالة إعداد مزامنة URL
function setupURLSync() {
    // الاستماع لتغييرات التاريخ (زر الرجوع/التقدم)
    window.addEventListener('popstate', function(event) {
        const urlLanguage = getLanguageFromURL();
        if (urlLanguage && urlLanguage !== currentLanguage) {
            applyTranslations(urlLanguage);
        }
    });
}

// تعديل دالة تبديل اللغة لتشمل تحديث URL
function switchLanguageWithURL(lang) {
    if (lang !== currentLanguage) {
        applyTranslations(lang);
        updateURL(lang);
        
        // إضافة تأثير انتقال سلس
        document.body.style.opacity = '0.8';
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 200);
    }
}

// دالة للتكامل مع الباك إند
function syncWithBackend(lang) {
    // إرسال اللغة المختارة للخادم (اختياري)
    const backendURL = 'https://antitheft-backend-production.up.railway.app/';
    
    // يمكن إرسال طلب لحفظ تفضيل اللغة
    fetch(backendURL + 'api/user/language', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept-Language': lang
        },
        body: JSON.stringify({ language: lang })
    }).catch(error => {
        console.log('تعذر مزامنة اللغة مع الخادم:', error);
    });
}

// دالة للحصول على المحتوى من الباك إند
async function loadDynamicContent(lang) {
    try {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        const response = await fetch(backendURL + `api/content?lang=${lang}`);
        
        if (response.ok) {
            const data = await response.json();
            // تحديث المحتوى الديناميكي
            updateDynamicElements(data);
        }
    } catch (error) {
        console.log('تعذر تحميل المحتوى الديناميكي:', error);
    }
}

// دالة تحديث العناصر الديناميكية
function updateDynamicElements(data) {
    // تحديث العناصر التي تأتي من الخادم
    if (data.notifications) {
        updateNotifications(data.notifications);
    }
    
    if (data.userStats) {
        updateUserStats(data.userStats);
    }
}

// تصدير الدوال الجديدة
window.getLanguageFromURL = getLanguageFromURL;
window.updateURL = updateURL;
window.switchLanguageWithURL = switchLanguageWithURL;
window.syncWithBackend = syncWithBackend;
window.loadDynamicContent = loadDynamicContent;

// دالة تحميل البيانات من الباك إند
async function loadBackendData() {
    try {
        // تحميل الإحصائيات
        await backendAPI.loadSystemStats();
        
        // تحميل التنبيهات الحديثة
        await backendAPI.loadRecentAlerts();
        
    } catch (error) {
        console.log('تعذر تحميل البيانات من الخادم:', error);
        
        // عرض بيانات تجريبية في حالة فشل الاتصال
        displayDemoStats();
    }
}

// دالة عرض بيانات تجريبية
function displayDemoStats() {
    const demoStats = {
        protectedDevices: 1247,
        activeAlerts: 3,
        averageResponseTime: 150
    };
    
    backendAPI.updateStatsDisplay(demoStats);
}

// إضافة مستمع لتغيير اللغة
function setupLanguageChangeListener() {
    const originalSwitchLanguage = window.switchLanguageWithURL;
    
    window.switchLanguageWithURL = function(lang) {
        // تطبيق التغيير الأصلي
        originalSwitchLanguage(lang);
        
        // إرسال حدث تغيير اللغة
        const event = new CustomEvent('languageChanged', {
            detail: { language: lang }
        });
        window.dispatchEvent(event);
        
        // إعادة تحميل البيانات باللغة الجديدة
        setTimeout(() => {
            loadBackendData();
        }, 500);
    };
}

// تطبيق مستمع تغيير اللغة
setupLanguageChangeListener();/
/ دوال المميزات الجديدة
function loginWithGoogle() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري التوجيه لتسجيل الدخول بـ Google...',
        en: 'Redirecting to Google Login...',
        el: 'Ανακατεύθυνση στη σύνδεση Google...'
    };
    
    showNotification(messages[currentLang]);
    
    setTimeout(() => {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        window.open(backendURL + `auth/google?lang=${currentLang}`, '_blank');
    }, 1000);
}

function createAccount() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري التوجيه لإنشاء حساب جديد...',
        en: 'Redirecting to create new account...',
        el: 'Ανακατεύθυνση για δημιουργία νέου λογαριασμού...'
    };
    
    showNotification(messages[currentLang]);
    
    setTimeout(() => {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        window.open(backendURL + `register?lang=${currentLang}`, '_blank');
    }, 1000);
}

function verifyEmail() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري التوجيه لتأكيد البريد الإلكتروني...',
        en: 'Redirecting to email verification...',
        el: 'Ανακατεύθυνση για επαλήθευση email...'
    };
    
    showNotification(messages[currentLang]);
    
    setTimeout(() => {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        window.open(backendURL + `verify-email?lang=${currentLang}`, '_blank');
    }, 1000);
}

function viewMap() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري فتح الخريطة...',
        en: 'Opening map...',
        el: 'Άνοιγμα χάρτη...'
    };
    
    showNotification(messages[currentLang]);
    
    setTimeout(() => {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        window.open(backendURL + `map?lang=${currentLang}`, '_blank');
    }, 1000);
}

// تحديث دالة تبديل اللغة لدعم اليونانية
function switchLanguageWithURL(lang) {
    const supportedLanguages = ['ar', 'en', 'el'];
    if (!supportedLanguages.includes(lang)) {
        lang = 'ar'; // اللغة الافتراضية
    }
    
    if (lang !== currentLanguage) {
        applyTranslations(lang);
        updateURL(lang);
        
        // إضافة تأثير انتقال سلس
        document.body.style.opacity = '0.8';
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 200);
    }
}

// تحديث دالة التحقق من اللغة المدعومة
function getLanguageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    // التحقق من أن اللغة مدعومة (العربية، الإنجليزية، اليونانية)
    const supportedLanguages = ['ar', 'en', 'el'];
    if (langParam && supportedLanguages.includes(langParam)) {
        return langParam;
    }
    
    return null;
}

// إضافة دعم اللغة اليونانية في الخادم
function syncWithBackend(lang) {
    const supportedLanguages = ['ar', 'en', 'el'];
    const finalLang = supportedLanguages.includes(lang) ? lang : 'ar';
    
    const backendURL = 'https://antitheft-backend-production.up.railway.app/';
    
    fetch(backendURL + 'api/user/language', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept-Language': finalLang
        },
        body: JSON.stringify({ language: finalLang })
    }).catch(error => {
        console.log('تعذر مزامنة اللغة مع الخادم:', error);
    });
}

// تصدير الدوال الجديدة
window.loginWithGoogle = loginWithGoogle;
window.createAccount = createAccount;
window.verifyEmail = verifyEmail;
window.viewMap = viewMap;// دوا
ل المميزات المحسنة
function loginWithGoogle() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري التوجيه لتسجيل الدخول بـ Google...',
        en: 'Redirecting to Google Login...',
        el: 'Ανακατεύθυνση στη σύνδεση Google...'
    };
    
    showNotification(messages[currentLang]);
    
    // تحديث حالة تسجيل الدخول
    localStorage.setItem('isLoggedIn', 'true');
    updateAuthButtons();
    
    setTimeout(() => {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        window.open(backendURL + `auth/google?lang=${currentLang}`, '_blank');
    }, 1000);
}

function logout() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري تسجيل الخروج...',
        en: 'Logging out...',
        el: 'Αποσύνδεση...'
    };
    
    showNotification(messages[currentLang]);
    
    // تحديث حالة تسجيل الخروج
    localStorage.removeItem('isLoggedIn');
    updateAuthButtons();
    
    setTimeout(() => {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        window.open(backendURL + `logout?lang=${currentLang}`, '_blank');
    }, 1000);
}

function updateAuthButtons() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn && logoutBtn) {
        if (isLoggedIn) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'flex';
        } else {
            loginBtn.style.display = 'flex';
            logoutBtn.style.display = 'none';
        }
    }
}

function createAccount() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري التوجيه لإنشاء حساب جديد...',
        en: 'Redirecting to create new account...',
        el: 'Ανακατεύθυνση για δημιουργία νέου λογαριασμού...'
    };
    
    showNotification(messages[currentLang]);
    
    setTimeout(() => {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        window.open(backendURL + `register?lang=${currentLang}`, '_blank');
    }, 1000);
}

function verifyEmail() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري التوجيه لتأكيد البريد الإلكتروني...',
        en: 'Redirecting to email verification...',
        el: 'Ανακατεύθυνση για επαλήθευση email...'
    };
    
    showNotification(messages[currentLang]);
    
    setTimeout(() => {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        window.open(backendURL + `verify-email?lang=${currentLang}`, '_blank');
    }, 1000);
}

function viewMap() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري فتح الخريطة...',
        en: 'Opening map...',
        el: 'Άνοιγμα χάρτη...'
    };
    
    showNotification(messages[currentLang]);
    
    setTimeout(() => {
        const backendURL = 'https://antitheft-backend-production.up.railway.app/';
        window.open(backendURL + `map?lang=${currentLang}`, '_blank');
    }, 1000);
}

// تحديث دالة تطبيق الترجمة لتشمل الأزرار الجديدة
function applyTranslationsEnhanced(lang) {
    applyTranslations(lang);
    updateAuthButtons();
}

// تحديث مستمع الأحداث
document.addEventListener('DOMContentLoaded', function() {
    // الكود الموجود...
    
    // تحديث أزرار تسجيل الدخول/الخروج
    updateAuthButtons();
    
    // إضافة مستمع لتغيير اللغة
    const originalApplyTranslations = window.applyTranslations;
    window.applyTranslations = function(lang) {
        originalApplyTranslations(lang);
        updateAuthButtons();
    };
});

// تصدير الدوال الجديدة
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.createAccount = createAccount;
window.verifyEmail = verifyEmail;
window.viewMap = viewMap;
window.updateAuthButtons = updateAuthButtons;
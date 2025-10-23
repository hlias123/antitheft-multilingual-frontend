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
    
    // تحديث أزرار تسجيل الدخول/الخروج
    updateAuthButtons();
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
            
            // توجيه لصفحة تسجيل الدخول
            setTimeout(() => {
                window.location.href = `/login?lang=${currentLanguage}`;
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

// دالة استخراج اللغة من URL
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

// دالة للتكامل مع الباك إند
function syncWithBackend(lang) {
    const supportedLanguages = ['ar', 'en', 'el'];
    const finalLang = supportedLanguages.includes(lang) ? lang : 'ar';
    
    // إرسال اللغة المختارة للخادم
    fetch('/api/user/language', {
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

// دالة تحميل البيانات من الباك إند
async function loadBackendData() {
    try {
        // تحميل الإحصائيات
        const response = await fetch('/api/stats');
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.log('تعذر تحميل البيانات من الخادم:', error);
        
        // عرض بيانات تجريبية في حالة فشل الاتصال
        displayDemoStats();
    }
}

// دالة تحديث عرض الإحصائيات
function updateStatsDisplay(stats) {
    if (!stats) return;

    // تحديث عدد الأجهزة المحمية
    const devicesElement = document.getElementById('protected-devices');
    if (devicesElement && stats.protectedDevices) {
        devicesElement.textContent = stats.protectedDevices.toLocaleString();
    }

    // تحديث عدد التنبيهات
    const alertsElement = document.getElementById('active-alerts');
    if (alertsElement && stats.activeAlerts !== undefined) {
        alertsElement.textContent = stats.activeAlerts.toLocaleString();
    }

    // تحديث معدل الاستجابة
    const responseElement = document.getElementById('response-time');
    if (responseElement && stats.averageResponseTime) {
        responseElement.textContent = stats.averageResponseTime + 'ms';
    }
}

// دالة عرض بيانات تجريبية
function displayDemoStats() {
    const demoStats = {
        protectedDevices: 1247,
        activeAlerts: 3,
        averageResponseTime: 150
    };
    
    updateStatsDisplay(demoStats);
}

// دوال المميزات
function loginWithGoogle() {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const messages = {
        ar: 'جاري التوجيه لتسجيل الدخول...',
        en: 'Redirecting to Login...',
        el: 'Ανακατεύθυνση στη σύνδεση...'
    };
    
    showNotification(messages[currentLang]);
    
    setTimeout(() => {
        window.location.href = `/login?lang=${currentLang}`;
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
        window.open(`/logout?lang=${currentLang}`, '_blank');
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
        window.location.href = `/login?lang=${currentLang}`;
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
        window.open(`/verify-email?lang=${currentLang}`, '_blank');
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
        window.open(`/map?lang=${currentLang}`, '_blank');
    }, 1000);
}

// تصدير الدوال للاستخدام العام
window.getLanguageFromURL = getLanguageFromURL;
window.updateURL = updateURL;
window.switchLanguageWithURL = switchLanguageWithURL;
window.syncWithBackend = syncWithBackend;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.createAccount = createAccount;
window.verifyEmail = verifyEmail;
window.viewMap = viewMap;
window.updateAuthButtons = updateAuthButtons;
window.showNotification = showNotification;
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// تقديم الملفات الثابتة
app.use(express.static(__dirname));

// إضافة middleware للـ JSON
app.use(express.json());

// معالجة الطلبات مع دعم اللغات
app.get('/', (req, res) => {
    try {
        const lang = req.query.lang || 'ar';

        // التحقق من اللغة المدعومة
        const supportedLanguages = ['ar', 'en', 'el'];
        const selectedLang = supportedLanguages.includes(lang) ? lang : 'ar';

        // قراءة ملف HTML
        const fs = require('fs');
        const htmlPath = path.join(__dirname, 'index.html');

        if (!fs.existsSync(htmlPath)) {
            return res.status(404).send('HTML file not found');
        }

        let html = fs.readFileSync(htmlPath, 'utf8');

        // تحديث اللغة واتجاه النص في HTML
        if (selectedLang === 'en') {
            html = html.replace('lang="ar" dir="rtl"', 'lang="en" dir="ltr"');
        } else if (selectedLang === 'el') {
            html = html.replace('lang="ar" dir="rtl"', 'lang="el" dir="ltr"');
        }

        console.log(`تم طلب اللغة: ${selectedLang}`);

        // إضافة script لتعيين اللغة الافتراضية
        const langScript = `
    <script>
        window.initialLanguage = '${selectedLang}';
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('selectedLanguage', '${selectedLang}');
        }
    </script>`;

        html = html.replace('</head>', langScript + '</head>');

        res.send(html);
    } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).send('Server Error: ' + error.message);
    }
});

// API للصحة
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        language: req.query.lang || 'ar'
    });
});

// API للإحصائيات
app.get('/api/stats', (req, res) => {
    res.json({
        protectedDevices: 1247,
        activeAlerts: 3,
        averageResponseTime: 150,
        language: req.query.lang || 'ar'
    });
});

// API لحفظ تفضيلات اللغة
app.post('/api/user/language', express.json(), (req, res) => {
    const { language } = req.body;
    console.log(`تم تغيير اللغة إلى: ${language}`);
    res.json({
        success: true,
        language: language,
        message: 'Language preference saved'
    });
});

// APIs للمميزات
app.get('/auth/google', (req, res) => {
    const lang = req.query.lang || 'ar';
    const translations = {
        ar: {
            title: 'تسجيل الدخول بـ Google',
            subtitle: 'نظام مكافحة السرقة',
            message: 'يتم توجيهك لتسجيل الدخول بـ Google...',
            email: 'البريد الإلكتروني',
            login: 'تسجيل الدخول',
            back: 'العودة للصفحة الرئيسية'
        },
        en: {
            title: 'Google Login',
            subtitle: 'Anti-Theft System',
            message: 'Redirecting to Google Login...',
            email: 'Email',
            login: 'Login',
            back: 'Back to Home'
        },
        el: {
            title: 'Σύνδεση Google',
            subtitle: 'Σύστημα Κατά της Κλοπής',
            message: 'Ανακατεύθυνση στη σύνδεση Google...',
            email: 'Email',
            login: 'Σύνδεση',
            back: 'Επιστροφή στην Αρχική'
        }
    };
    
    const t = translations[lang] || translations.ar;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    res.send(`
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(10px); max-width: 400px; }
            h1 { margin-bottom: 10px; }
            .subtitle { opacity: 0.8; margin-bottom: 30px; }
            .login-form { margin: 30px 0; }
            input { width: 100%; padding: 15px; margin: 10px 0; border: none; border-radius: 10px; font-size: 16px; }
            .google-btn { background: #4285f4; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; margin: 10px; transition: all 0.3s; }
            .google-btn:hover { background: #3367d6; transform: translateY(-2px); }
            .back-btn { background: rgba(255,255,255,0.2); color: white; padding: 10px 20px; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; text-decoration: none; display: inline-block; margin-top: 20px; }
            .back-btn:hover { background: rgba(255,255,255,0.3); }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔐 ${t.title}</h1>
            <p class="subtitle">${t.subtitle}</p>
            <div class="login-form">
                <input type="email" placeholder="${t.email}: hlia.hlias123@gmail.com" value="hlia.hlias123@gmail.com" readonly>
                <button class="google-btn" onclick="simulateLogin()">
                    🔐 ${t.login}
                </button>
            </div>
            <p>${t.message}</p>
            <a href="/?lang=${lang}" class="back-btn">${t.back}</a>
        </div>
        <script>
            function simulateLogin() {
                alert('تم تسجيل الدخول بنجاح بالإيميل: hlia.hlias123@gmail.com');
                setTimeout(() => {
                    window.location.href = '/?lang=${lang}';
                }, 1000);
            }
        </script>
    </body>
    </html>
    `);
});

app.get('/register', (req, res) => {
    const lang = req.query.lang || 'ar';
    const translations = {
        ar: {
            title: 'إنشاء حساب جديد',
            subtitle: 'انضم إلى نظام الحماية المتقدم',
            name: 'الاسم الكامل',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            confirm: 'تأكيد كلمة المرور',
            create: 'إنشاء الحساب',
            back: 'العودة للصفحة الرئيسية'
        },
        en: {
            title: 'Create New Account',
            subtitle: 'Join Advanced Protection System',
            name: 'Full Name',
            email: 'Email',
            password: 'Password',
            confirm: 'Confirm Password',
            create: 'Create Account',
            back: 'Back to Home'
        },
        el: {
            title: 'Δημιουργία Νέου Λογαριασμού',
            subtitle: 'Εγγραφή στο Προηγμένο Σύστημα Προστασίας',
            name: 'Πλήρες Όνομα',
            email: 'Email',
            password: 'Κωδικός',
            confirm: 'Επιβεβαίωση Κωδικού',
            create: 'Δημιουργία Λογαριασμού',
            back: 'Επιστροφή στην Αρχική'
        }
    };
    
    const t = translations[lang] || translations.ar;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    res.send(`
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(10px); max-width: 400px; }
            h1 { margin-bottom: 10px; }
            .subtitle { opacity: 0.8; margin-bottom: 30px; }
            input { width: 100%; padding: 15px; margin: 10px 0; border: none; border-radius: 10px; font-size: 16px; box-sizing: border-box; }
            .create-btn { background: #ff6b6b; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; margin: 20px 0; transition: all 0.3s; width: 100%; }
            .create-btn:hover { background: #ff5252; transform: translateY(-2px); }
            .back-btn { background: rgba(255,255,255,0.2); color: white; padding: 10px 20px; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; text-decoration: none; display: inline-block; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>👤 ${t.title}</h1>
            <p class="subtitle">${t.subtitle}</p>
            <form onsubmit="createAccount(event)">
                <input type="text" placeholder="${t.name}" required>
                <input type="email" placeholder="${t.email}" required>
                <input type="password" placeholder="${t.password}" required>
                <input type="password" placeholder="${t.confirm}" required>
                <button type="submit" class="create-btn">👤 ${t.create}</button>
            </form>
            <a href="/?lang=${lang}" class="back-btn">${t.back}</a>
        </div>
        <script>
            function createAccount(event) {
                event.preventDefault();
                alert('تم إنشاء الحساب بنجاح! يرجى تأكيد البريد الإلكتروني.');
                setTimeout(() => {
                    window.location.href = '/verify-email?lang=${lang}';
                }, 1000);
            }
        </script>
    </body>
    </html>
    `);
});

app.get('/verify-email', (req, res) => {
    const lang = req.query.lang || 'ar';
    const translations = {
        ar: {
            title: 'تأكيد البريد الإلكتروني',
            subtitle: 'تأمين حسابك بخطوة إضافية',
            message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
            code: 'رمز التحقق',
            verify: 'تأكيد',
            resend: 'إعادة الإرسال',
            back: 'العودة للصفحة الرئيسية'
        },
        en: {
            title: 'Email Verification',
            subtitle: 'Secure Your Account',
            message: 'Verification code sent to your email',
            code: 'Verification Code',
            verify: 'Verify',
            resend: 'Resend Code',
            back: 'Back to Home'
        },
        el: {
            title: 'Επαλήθευση Email',
            subtitle: 'Ασφαλίστε τον Λογαριασμό σας',
            message: 'Κωδικός επαλήθευσης στάλθηκε στο email σας',
            code: 'Κωδικός Επαλήθευσης',
            verify: 'Επαλήθευση',
            resend: 'Επαναποστολή',
            back: 'Επιστροφή στην Αρχική'
        }
    };
    
    const t = translations[lang] || translations.ar;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    res.send(`
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(10px); max-width: 400px; }
            h1 { margin-bottom: 10px; }
            .subtitle { opacity: 0.8; margin-bottom: 30px; }
            .code-input { width: 100%; padding: 20px; margin: 20px 0; border: none; border-radius: 10px; font-size: 24px; text-align: center; letter-spacing: 10px; }
            .verify-btn { background: #4caf50; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; margin: 10px; transition: all 0.3s; }
            .verify-btn:hover { background: #45a049; transform: translateY(-2px); }
            .resend-btn { background: rgba(255,255,255,0.2); color: white; padding: 10px 20px; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; cursor: pointer; margin: 10px; }
            .back-btn { background: rgba(255,255,255,0.2); color: white; padding: 10px 20px; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; text-decoration: none; display: inline-block; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>✉️ ${t.title}</h1>
            <p class="subtitle">${t.subtitle}</p>
            <p>${t.message}</p>
            <p><strong>hlia.hlias123@gmail.com</strong></p>
            <input type="text" class="code-input" placeholder="123456" maxlength="6">
            <div>
                <button class="verify-btn" onclick="verifyEmail()">✅ ${t.verify}</button>
                <button class="resend-btn" onclick="resendCode()">📧 ${t.resend}</button>
            </div>
            <a href="/?lang=${lang}" class="back-btn">${t.back}</a>
        </div>
        <script>
            function verifyEmail() {
                alert('تم تأكيد البريد الإلكتروني بنجاح!');
                setTimeout(() => {
                    window.location.href = '/?lang=${lang}';
                }, 1000);
            }
            function resendCode() {
                alert('تم إعادة إرسال رمز التحقق إلى بريدك الإلكتروني');
            }
        </script>
    </body>
    </html>
    `);
});

app.get('/map', (req, res) => {
    const lang = req.query.lang || 'ar';
    const translations = {
        ar: {
            title: 'عرض الخريطة',
            subtitle: 'تتبع موقع أجهزتك على الخريطة',
            device: 'الجهاز الرئيسي',
            location: 'الموقع الحالي',
            accuracy: 'دقة الموقع',
            lastUpdate: 'آخر تحديث',
            back: 'العودة للصفحة الرئيسية'
        },
        en: {
            title: 'Map View',
            subtitle: 'Track Your Devices Location',
            device: 'Main Device',
            location: 'Current Location',
            accuracy: 'Location Accuracy',
            lastUpdate: 'Last Update',
            back: 'Back to Home'
        },
        el: {
            title: 'Προβολή Χάρτη',
            subtitle: 'Παρακολουθήστε τη Θέση των Συσκευών σας',
            device: 'Κύρια Συσκευή',
            location: 'Τρέχουσα Τοποθεσία',
            accuracy: 'Ακρίβεια Τοποθεσίας',
            lastUpdate: 'Τελευταία Ενημέρωση',
            back: 'Επιστροφή στην Αρχική'
        }
    };
    
    const t = translations[lang] || translations.ar;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    res.send(`
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f0f0f0; }
            .header { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 20px; text-align: center; }
            .map-container { height: 400px; background: linear-gradient(45deg, #4caf50, #2196f3); margin: 20px; border-radius: 15px; position: relative; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; }
            .device-info { background: white; margin: 20px; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .info-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-item:last-child { border-bottom: none; }
            .status-online { color: #4caf50; font-weight: bold; }
            .back-btn { background: #667eea; color: white; padding: 15px 30px; border: none; border-radius: 10px; text-decoration: none; display: inline-block; margin: 20px; transition: all 0.3s; }
            .back-btn:hover { background: #5a67d8; transform: translateY(-2px); }
            .map-marker { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 48px; animation: pulse 2s infinite; }
            @keyframes pulse { 0% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.1); } 100% { transform: translate(-50%, -50%) scale(1); } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🗺️ ${t.title}</h1>
            <p>${t.subtitle}</p>
        </div>
        
        <div class="map-container">
            <div class="map-marker">📍</div>
            <div style="position: absolute; bottom: 20px; background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 20px;">
                الرياض، المملكة العربية السعودية
            </div>
        </div>
        
        <div class="device-info">
            <h3>📱 ${t.device}</h3>
            <div class="info-item">
                <span>${t.location}:</span>
                <span class="status-online">الرياض، السعودية</span>
            </div>
            <div class="info-item">
                <span>الإحداثيات:</span>
                <span>24.7136° N, 46.6753° E</span>
            </div>
            <div class="info-item">
                <span>${t.accuracy}:</span>
                <span class="status-online">±5 متر</span>
            </div>
            <div class="info-item">
                <span>مستوى البطارية:</span>
                <span class="status-online">85%</span>
            </div>
            <div class="info-item">
                <span>${t.lastUpdate}:</span>
                <span>منذ دقيقتين</span>
            </div>
            <div class="info-item">
                <span>حالة الاتصال:</span>
                <span class="status-online">متصل</span>
            </div>
        </div>
        
        <div style="text-align: center;">
            <a href="/?lang=${lang}" class="back-btn">${t.back}</a>
        </div>
        
        <script>
            // محاكاة تحديث الموقع
            setInterval(() => {
                const marker = document.querySelector('.map-marker');
                marker.style.animation = 'none';
                setTimeout(() => {
                    marker.style.animation = 'pulse 2s infinite';
                }, 100);
            }, 5000);
        </script>
    </body>
    </html>
    `);
});

app.get('/logout', (req, res) => {
    const lang = req.query.lang || 'ar';
    const translations = {
        ar: {
            title: 'تسجيل الخروج',
            message: 'تم تسجيل الخروج بنجاح',
            subtitle: 'شكراً لاستخدام نظام مكافحة السرقة',
            back: 'العودة للصفحة الرئيسية'
        },
        en: {
            title: 'Logout',
            message: 'Successfully Logged Out',
            subtitle: 'Thank you for using Anti-Theft System',
            back: 'Back to Home'
        },
        el: {
            title: 'Αποσύνδεση',
            message: 'Επιτυχής Αποσύνδεση',
            subtitle: 'Ευχαριστούμε που χρησιμοποιήσατε το Σύστημα Κατά της Κλοπής',
            back: 'Επιστροφή στην Αρχική'
        }
    };
    
    const t = translations[lang] || translations.ar;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    res.send(`
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(10px); max-width: 400px; }
            h1 { margin-bottom: 20px; }
            .subtitle { opacity: 0.8; margin-bottom: 30px; }
            .success-icon { font-size: 64px; margin: 20px 0; }
            .back-btn { background: rgba(255,255,255,0.2); color: white; padding: 15px 30px; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; text-decoration: none; display: inline-block; margin-top: 20px; transition: all 0.3s; }
            .back-btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">🚪</div>
            <h1>${t.title}</h1>
            <h2>${t.message}</h2>
            <p class="subtitle">${t.subtitle}</p>
            <a href="/?lang=${lang}" class="back-btn">${t.back}</a>
        </div>
        <script>
            setTimeout(() => {
                window.location.href = '/?lang=${lang}';
            }, 3000);
        </script>
    </body>
    </html>
    `);
});

// معالجة الصفحات غير الموجودة
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 الموقع متاح على: http://localhost:${PORT}`);
    console.log(`🔗 مع دعم اللغات: ?lang=ar أو ?lang=en أو ?lang=el`);
});

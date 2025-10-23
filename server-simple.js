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
    res.send(`<h1>Google Login - ${lang}</h1><p>تسجيل الدخول بـ Google</p>`);
});

app.get('/register', (req, res) => {
    const lang = req.query.lang || 'ar';
    res.send(`<h1>Create Account - ${lang}</h1><p>إنشاء حساب جديد</p>`);
});

app.get('/verify-email', (req, res) => {
    const lang = req.query.lang || 'ar';
    res.send(`<h1>Email Verification - ${lang}</h1><p>تأكيد البريد الإلكتروني</p>`);
});

app.get('/map', (req, res) => {
    const lang = req.query.lang || 'ar';
    res.send(`<h1>Map View - ${lang}</h1><p>عرض الخريطة</p>`);
});

app.get('/logout', (req, res) => {
    const lang = req.query.lang || 'ar';
    res.send(`<h1>Logout - ${lang}</h1><p>تم تسجيل الخروج بنجاح</p>`);
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

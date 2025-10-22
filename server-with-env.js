const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات متغيرات البيئة
const config = {
    alertEmail: process.env.ALERT_EMAIL || 'where-to-send-alerts@gmail.com',
    emailUser: process.env.EMAIL_USER || 'hlia.hlias123@gmail.com',
    emailPass: process.env.EMAIL_PASS || '',
    databaseUrl: process.env.DATABASE_URL || '',
    nodeEnv: process.env.NODE_ENV || 'development'
};

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// معالجة الطلبات مع دعم اللغات
app.get('/', (req, res) => {
    try {
        const lang = req.query.lang || 'ar';
        
        // التحقق من اللغة المدعومة
        const supportedLanguages = ['ar', 'en'];
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
        }
        
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

// API للصحة مع معلومات الإعدادات
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        language: req.query.lang || 'ar',
        environment: config.nodeEnv,
        emailConfigured: !!config.emailUser,
        databaseConfigured: !!config.databaseUrl
    });
});

// API لإرسال تنبيه (مثال)
app.post('/api/send-alert', (req, res) => {
    try {
        const { message, type, language } = req.body;
        
        // هنا يمكن إضافة منطق إرسال البريد الإلكتروني
        console.log('Alert received:', {
            message,
            type,
            language,
            alertEmail: config.alertEmail,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: language === 'ar' ? 'تم إرسال التنبيه بنجاح' : 'Alert sent successfully',
            alertEmail: config.alertEmail
        });
    } catch (error) {
        console.error('Error sending alert:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send alert'
        });
    }
});

// API للإعدادات (بدون كشف المعلومات الحساسة)
app.get('/api/config', (req, res) => {
    res.json({
        alertEmail: config.alertEmail,
        emailUser: config.emailUser,
        environment: config.nodeEnv,
        databaseConnected: !!config.databaseUrl,
        supportedLanguages: ['ar', 'en']
    });
});

// معالجة الصفحات غير الموجودة
app.use((req, res) => {
    res.status(404).json({
        error: 'Page Not Found',
        message: 'الصفحة غير موجودة'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 الموقع متاح على: http://localhost:${PORT}`);
    console.log(`🔗 مع دعم اللغات: ?lang=ar أو ?lang=en`);
    console.log(`📧 البريد المُعد: ${config.emailUser}`);
    console.log(`🗄️ قاعدة البيانات: ${config.databaseUrl ? 'متصلة' : 'غير مُعدة'}`);
});
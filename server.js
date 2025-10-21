const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات الأمان والضغط
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://antitheft-backend-production.up.railway.app"]
        }
    }
}));

app.use(compression());
app.use(cors());

// تقديم الملفات الثابتة
app.use(express.static('.'));

// معالجة الطلبات مع دعم اللغات
app.get('/', (req, res) => {
    try {
        const lang = req.query.lang || 'ar';
        
        // التحقق من اللغة المدعومة
        const supportedLanguages = ['ar', 'en'];
        const selectedLang = supportedLanguages.includes(lang) ? lang : 'ar';
        
        // قراءة ملف HTML وتعديل اللغة الافتراضية
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
        // تعيين اللغة من URL
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

// API endpoints للتكامل مع الباك إند
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        language: req.query.lang || 'ar'
    });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'حدث خطأ في الخادم', 
        message: 'Server Error' 
    });
});

// معالجة الصفحات غير الموجودة
app.use((req, res) => {
    res.status(404).json({ 
        error: 'الصفحة غير موجودة', 
        message: 'Page Not Found' 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 الموقع متاح على: http://localhost:${PORT}`);
    console.log(`🔗 مع دعم اللغات: ?lang=ar أو ?lang=en`);
});
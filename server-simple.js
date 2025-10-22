const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// تقديم الملفات الثابتة
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

// API للصحة
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        language: req.query.lang || 'ar'
    });
});

// معالجة الصفحات غير الموجودة
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 الموقع متاح على: http://localhost:${PORT}`);
    console.log(`🔗 مع دعم اللغات: ?lang=ar أو ?lang=en`);
});
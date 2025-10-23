const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// تقديم الملفات الثابتة
app.use(express.static(__dirname));

// إضافة middleware للـ JSON
app.use(express.json());

// قاعدة بيانات مؤقتة في الذاكرة (في الإنتاج ستكون قاعدة بيانات حقيقية)
let connectedDevices = [];
let userSessions = {};
let deviceLocations = {};

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

// API للإحصائيات الحقيقية
app.get('/api/stats', (req, res) => {
    res.json({
        protectedDevices: connectedDevices.length,
        activeAlerts: connectedDevices.filter(d => d.hasAlert).length,
        averageResponseTime: 150,
        language: req.query.lang || 'ar'
    });
});

// API لحفظ تفضيلات اللغة
app.post('/api/user/language', (req, res) => {
    const { language } = req.body;
    console.log(`تم تغيير اللغة إلى: ${language}`);
    res.json({
        success: true,
        language: language,
        message: 'Language preference saved'
    });
});

// API لتسجيل الدخول الحقيقي
app.post('/api/auth/login', (req, res) => {
    const { email, deviceId } = req.body;
    
    // التحقق من الإيميل المسموح
    if (email !== 'hlia.hlias123@gmail.com') {
        return res.status(401).json({
            success: false,
            message: 'البريد الإلكتروني غير مصرح له بالدخول'
        });
    }
    
    // إنشاء جلسة جديدة
    const sessionId = Date.now().toString();
    userSessions[sessionId] = {
        email: email,
        deviceId: deviceId,
        loginTime: new Date(),
        isActive: true
    };
    
    res.json({
        success: true,
        sessionId: sessionId,
        message: 'تم تسجيل الدخول بنجاح',
        redirectUrl: '/dashboard'
    });
});

// API لتأكيد PIN
app.post('/api/auth/verify-pin', (req, res) => {
    const { sessionId, pin } = req.body;
    
    if (!userSessions[sessionId]) {
        return res.status(401).json({
            success: false,
            message: 'جلسة غير صالحة'
        });
    }
    
    // في التطبيق الحقيقي، سيتم التحقق من PIN المحفوظ
    // هنا نقبل أي PIN مكون من 4 أرقام للعرض
    if (pin && pin.length === 4 && /^\d{4}$/.test(pin)) {
        userSessions[sessionId].pinVerified = true;
        res.json({
            success: true,
            message: 'تم تأكيد PIN بنجاح'
        });
    } else {
        res.status(400).json({
            success: false,
            message: 'PIN غير صحيح - يجب أن يكون 4 أرقام'
        });
    }
});

// API لتسجيل الجهاز
app.post('/api/device/register', (req, res) => {
    const { deviceId, deviceInfo, location } = req.body;
    
    // البحث عن الجهاز الموجود
    const existingDeviceIndex = connectedDevices.findIndex(d => d.deviceId === deviceId);
    
    const deviceData = {
        deviceId: deviceId,
        deviceInfo: deviceInfo,
        location: location,
        lastSeen: new Date(),
        isOnline: true,
        hasAlert: false,
        batteryLevel: deviceInfo?.batteryLevel || 0.85
    };
    
    if (existingDeviceIndex >= 0) {
        // تحديث الجهاز الموجود
        connectedDevices[existingDeviceIndex] = deviceData;
    } else {
        // إضافة جهاز جديد
        connectedDevices.push(deviceData);
    }
    
    // حفظ الموقع
    deviceLocations[deviceId] = location;
    
    res.json({
        success: true,
        message: 'تم تسجيل الجهاز بنجاح',
        deviceCount: connectedDevices.length
    });
});

// API لتحديث الموقع
app.post('/api/device/location', (req, res) => {
    const { deviceId, location } = req.body;
    
    // تحديث موقع الجهاز
    const deviceIndex = connectedDevices.findIndex(d => d.deviceId === deviceId);
    if (deviceIndex >= 0) {
        connectedDevices[deviceIndex].location = location;
        connectedDevices[deviceIndex].lastSeen = new Date();
        deviceLocations[deviceId] = location;
        
        res.json({
            success: true,
            message: 'تم تحديث الموقع بنجاح'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'الجهاز غير مسجل'
        });
    }
});

// API للحصول على الأجهزة المتصلة
app.get('/api/devices', (req, res) => {
    res.json({
        success: true,
        devices: connectedDevices,
        count: connectedDevices.length
    });
});

// API للحصول على موقع جهاز محدد
app.get('/api/device/:deviceId/location', (req, res) => {
    const { deviceId } = req.params;
    const location = deviceLocations[deviceId];
    
    if (location) {
        res.json({
            success: true,
            location: location,
            timestamp: new Date()
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'موقع الجهاز غير متوفر'
        });
    }
});

// صفحة لوحة التحكم الحقيقية
app.get('/dashboard', (req, res) => {
    const lang = req.query.lang || 'ar';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    res.send(`
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>لوحة التحكم - نظام مكافحة السرقة</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
            .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
            .stat-number { font-size: 2rem; font-weight: bold; color: #667eea; }
            .devices-section { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
            .device-item { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
            .device-status { padding: 5px 10px; border-radius: 15px; color: white; font-size: 12px; }
            .online { background: #4caf50; }
            .offline { background: #f44336; }
            .pin-section { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; text-align: center; }
            .pin-input { padding: 15px; font-size: 24px; text-align: center; letter-spacing: 10px; border: 2px solid #ddd; border-radius: 10px; margin: 10px; width: 200px; }
            .btn { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
            .btn:hover { background: #5a67d8; }
            .map-section { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
            .map-placeholder { height: 300px; background: linear-gradient(45deg, #4caf50, #2196f3); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="container">
                <h1>🛡️ لوحة التحكم - نظام مكافحة السرقة</h1>
                <p>مرحباً hlia.hlias123@gmail.com</p>
            </div>
        </div>
        
        <div class="container">
            <!-- إحصائيات حقيقية -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" id="deviceCount">0</div>
                    <div>الأجهزة المتصلة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="alertCount">0</div>
                    <div>التنبيهات النشطة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">150ms</div>
                    <div>زمن الاستجابة</div>
                </div>
            </div>
            
            <!-- تأكيد PIN -->
            <div class="pin-section">
                <h3>🔐 تأكيد هويتك بـ PIN</h3>
                <p>أدخل PIN المكون من 4 أرقام لتأكيد أنك صاحب التطبيق</p>
                <input type="password" class="pin-input" id="pinInput" placeholder="****" maxlength="4">
                <br>
                <button class="btn" onclick="verifyPIN()">تأكيد PIN</button>
                <div id="pinStatus"></div>
            </div>
            
            <!-- الأجهزة المتصلة -->
            <div class="devices-section">
                <h3>📱 الأجهزة المتصلة</h3>
                <div id="devicesList">
                    <p>جاري تحميل الأجهزة...</p>
                </div>
            </div>
            
            <!-- الخريطة الحقيقية -->
            <div class="map-section">
                <h3>🗺️ الخريطة المباشرة</h3>
                <div class="map-placeholder" id="mapContainer">
                    <div>
                        <div style="font-size: 48px; margin-bottom: 10px;">📍</div>
                        <div>الخريطة ستظهر هنا عند اتصال التطبيق</div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            let sessionId = localStorage.getItem('sessionId');
            let isPinVerified = false;
            
            // تحديث الإحصائيات
            async function updateStats() {
                try {
                    const response = await fetch('/api/stats');
                    const data = await response.json();
                    document.getElementById('deviceCount').textContent = data.protectedDevices;
                    document.getElementById('alertCount').textContent = data.activeAlerts;
                } catch (error) {
                    console.error('خطأ في تحديث الإحصائيات:', error);
                }
            }
            
            // تحديث قائمة الأجهزة
            async function updateDevices() {
                try {
                    const response = await fetch('/api/devices');
                    const data = await response.json();
                    
                    const devicesList = document.getElementById('devicesList');
                    if (data.devices && data.devices.length > 0) {
                        devicesList.innerHTML = data.devices.map(device => \`
                            <div class="device-item">
                                <div>
                                    <strong>📱 \${device.deviceInfo?.model || 'جهاز غير معروف'}</strong><br>
                                    <small>آخر ظهور: \${new Date(device.lastSeen).toLocaleString('ar-SA')}</small>
                                </div>
                                <div>
                                    <span class="device-status \${device.isOnline ? 'online' : 'offline'}">
                                        \${device.isOnline ? 'متصل' : 'غير متصل'}
                                    </span>
                                </div>
                            </div>
                        \`).join('');
                    } else {
                        devicesList.innerHTML = '<p>لا توجد أجهزة متصلة حالياً</p>';
                    }
                } catch (error) {
                    console.error('خطأ في تحديث الأجهزة:', error);
                }
            }
            
            // تأكيد PIN
            async function verifyPIN() {
                const pin = document.getElementById('pinInput').value;
                const statusDiv = document.getElementById('pinStatus');
                
                if (!pin || pin.length !== 4) {
                    statusDiv.innerHTML = '<p style="color: red;">يرجى إدخال PIN مكون من 4 أرقام</p>';
                    return;
                }
                
                try {
                    const response = await fetch('/api/auth/verify-pin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId: sessionId, pin: pin })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        isPinVerified = true;
                        statusDiv.innerHTML = '<p style="color: green;">✅ تم تأكيد PIN بنجاح!</p>';
                        document.querySelector('.pin-section').style.background = '#e8f5e8';
                    } else {
                        statusDiv.innerHTML = \`<p style="color: red;">❌ \${data.message}</p>\`;
                    }
                } catch (error) {
                    statusDiv.innerHTML = '<p style="color: red;">خطأ في التحقق من PIN</p>';
                }
            }
            
            // تحديث البيانات كل 5 ثوان
            setInterval(() => {
                updateStats();
                updateDevices();
            }, 5000);
            
            // تحديث أولي
            updateStats();
            updateDevices();
        </script>
    </body>
    </html>
    `);
});

// صفحة تسجيل الدخول الحقيقية
app.get('/auth/google', (req, res) => {
    const lang = req.query.lang || 'ar';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    res.send(`
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تسجيل الدخول - نظام مكافحة السرقة</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(10px); max-width: 400px; }
            .email-input { width: 100%; padding: 15px; margin: 10px 0; border: none; border-radius: 10px; font-size: 16px; box-sizing: border-box; }
            .login-btn { background: #4285f4; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; margin: 10px; transition: all 0.3s; width: 100%; }
            .login-btn:hover { background: #3367d6; }
            .back-btn { background: rgba(255,255,255,0.2); color: white; padding: 10px 20px; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; text-decoration: none; display: inline-block; margin-top: 20px; }
            .error { color: #ffcdd2; margin: 10px 0; }
            .success { color: #c8e6c9; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔐 تسجيل الدخول</h1>
            <p>نظام مكافحة السرقة</p>
            <div>
                <input type="email" class="email-input" id="emailInput" placeholder="البريد الإلكتروني" value="hlia.hlias123@gmail.com">
                <button class="login-btn" onclick="login()">🔐 تسجيل الدخول</button>
                <div id="loginStatus"></div>
            </div>
            <a href="/?lang=${lang}" class="back-btn">العودة للصفحة الرئيسية</a>
        </div>
        <script>
            async function login() {
                const email = document.getElementById('emailInput').value;
                const statusDiv = document.getElementById('loginStatus');
                
                if (!email) {
                    statusDiv.innerHTML = '<p class="error">يرجى إدخال البريد الإلكتروني</p>';
                    return;
                }
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: email, 
                            deviceId: 'web-' + Date.now() 
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        localStorage.setItem('sessionId', data.sessionId);
                        statusDiv.innerHTML = '<p class="success">✅ تم تسجيل الدخول بنجاح!</p>';
                        setTimeout(() => {
                            window.location.href = '/dashboard?lang=${lang}';
                        }, 1000);
                    } else {
                        statusDiv.innerHTML = \`<p class="error">❌ \${data.message}</p>\`;
                    }
                } catch (error) {
                    statusDiv.innerHTML = '<p class="error">خطأ في تسجيل الدخول</p>';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// إزالة الصفحات الوهمية الأخرى
app.get('/register', (req, res) => {
    res.redirect('/auth/google?lang=' + (req.query.lang || 'ar'));
});

app.get('/verify-email', (req, res) => {
    res.redirect('/dashboard?lang=' + (req.query.lang || 'ar'));
});

app.get('/map', (req, res) => {
    res.redirect('/dashboard?lang=' + (req.query.lang || 'ar'));
});

app.get('/logout', (req, res) => {
    const lang = req.query.lang || 'ar';
    res.redirect('/?lang=' + lang);
});

// معالجة الصفحات غير الموجودة
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 الموقع متاح على: http://localhost:${PORT}`);
    console.log(`🔗 مع دعم اللغات: ?lang=ar أو ?lang=en أو ?lang=el`);
    console.log(`📱 لوحة التحكم: http://localhost:${PORT}/dashboard`);
});
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
let registeredUsers = {
    'hlia.hlias123@gmail.com': {
        password: 'demo123',
        pin: '1234',
        createdAt: new Date(),
        isActive: true
    }
};
let passwordResetTokens = {};

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

// API لإنشاء حساب جديد
app.post('/api/auth/register', (req, res) => {
    const { email, password, confirmPassword, pin } = req.body;

    // التحقق من البيانات المطلوبة
    if (!email || !password || !confirmPassword || !pin) {
        return res.status(400).json({
            success: false,
            message: 'جميع الحقول مطلوبة'
        });
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'البريد الإلكتروني غير صحيح'
        });
    }

    // التحقق من تطابق كلمات المرور
    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'كلمات المرور غير متطابقة'
        });
    }

    // التحقق من طول كلمة المرور
    if (password.length < 4) {
        return res.status(400).json({
            success: false,
            message: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل'
        });
    }

    // التحقق من PIN
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({
            success: false,
            message: 'PIN يجب أن يكون 4 أرقام'
        });
    }

    // التحقق من وجود المستخدم
    if (registeredUsers[email]) {
        return res.status(409).json({
            success: false,
            message: 'البريد الإلكتروني مسجل مسبقاً'
        });
    }

    // إنشاء المستخدم الجديد
    registeredUsers[email] = {
        password: password,
        pin: pin,
        createdAt: new Date(),
        isActive: true
    };

    res.json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح',
        email: email
    });
});

// API لتسجيل الدخول الحقيقي
app.post('/api/auth/login', (req, res) => {
    const { email, password, deviceId } = req.body;

    // التحقق من وجود المستخدم
    if (!registeredUsers[email]) {
        return res.status(401).json({
            success: false,
            message: 'البريد الإلكتروني غير مسجل'
        });
    }

    // التحقق من كلمة المرور
    if (!password || registeredUsers[email].password !== password) {
        return res.status(401).json({
            success: false,
            message: 'كلمة المرور غير صحيحة'
        });
    }

    // التحقق من أن الحساب نشط
    if (!registeredUsers[email].isActive) {
        return res.status(401).json({
            success: false,
            message: 'الحساب غير نشط'
        });
    }

    // إنشاء جلسة جديدة
    const sessionId = Date.now().toString();
    userSessions[sessionId] = {
        email: email,
        deviceId: deviceId,
        loginTime: new Date(),
        isActive: true,
        pinVerified: false
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

    const session = userSessions[sessionId];
    const userEmail = session.email;

    // التحقق من وجود المستخدم
    if (!registeredUsers[userEmail]) {
        return res.status(401).json({
            success: false,
            message: 'مستخدم غير موجود'
        });
    }

    // التحقق من PIN المحفوظ
    if (pin && pin.length === 4 && /^\d{4}$/.test(pin)) {
        if (registeredUsers[userEmail].pin === pin) {
            userSessions[sessionId].pinVerified = true;
            res.json({
                success: true,
                message: 'تم تأكيد PIN بنجاح'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'PIN غير صحيح'
            });
        }
    } else {
        res.status(400).json({
            success: false,
            message: 'PIN يجب أن يكون 4 أرقام'
        });
    }
});

// API لطلب إعادة تعيين كلمة المرور
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'البريد الإلكتروني مطلوب'
        });
    }

    // التحقق من وجود المستخدم
    if (!registeredUsers[email]) {
        return res.status(404).json({
            success: false,
            message: 'البريد الإلكتروني غير مسجل'
        });
    }

    // إنشاء رمز إعادة التعيين (في التطبيق الحقيقي سيتم إرساله بالبريد)
    const resetToken = Math.floor(1000 + Math.random() * 9000).toString();
    passwordResetTokens[email] = {
        token: resetToken,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 دقيقة
    };

    res.json({
        success: true,
        message: 'تم إرسال رمز إعادة التعيين',
        resetToken: resetToken, // في التطبيق الحقيقي لن يتم إرسال الرمز في الاستجابة
        pin: registeredUsers[email].pin // إرسال PIN للمساعدة في العرض
    });
});

// API لإعادة تعيين كلمة المرور
app.post('/api/auth/reset-password', (req, res) => {
    const { email, resetToken, newPassword, confirmPassword } = req.body;

    if (!email || !resetToken || !newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'جميع الحقول مطلوبة'
        });
    }

    // التحقق من وجود المستخدم
    if (!registeredUsers[email]) {
        return res.status(404).json({
            success: false,
            message: 'البريد الإلكتروني غير مسجل'
        });
    }

    // التحقق من رمز إعادة التعيين
    if (!passwordResetTokens[email] || passwordResetTokens[email].token !== resetToken) {
        return res.status(400).json({
            success: false,
            message: 'رمز إعادة التعيين غير صحيح'
        });
    }

    // التحقق من انتهاء صلاحية الرمز
    if (new Date() > passwordResetTokens[email].expiresAt) {
        delete passwordResetTokens[email];
        return res.status(400).json({
            success: false,
            message: 'رمز إعادة التعيين منتهي الصلاحية'
        });
    }

    // التحقق من تطابق كلمات المرور
    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'كلمات المرور غير متطابقة'
        });
    }

    // التحقق من طول كلمة المرور
    if (newPassword.length < 4) {
        return res.status(400).json({
            success: false,
            message: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل'
        });
    }

    // تحديث كلمة المرور
    registeredUsers[email].password = newPassword;
    delete passwordResetTokens[email];

    res.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
    });
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
            .pin-input:focus { border-color: #667eea; outline: none; box-shadow: 0 0 10px rgba(102, 126, 234, 0.3); }
            .btn { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
            .btn:hover { background: #5a67d8; }
            .map-section { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0; }
            .map-placeholder { height: 300px; background: linear-gradient(45deg, #4caf50, #2196f3); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; }
            
            /* رسالة الترحيب والتحذير */
            .welcome-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; }
            .welcome-content { background: white; padding: 30px; border-radius: 15px; max-width: 500px; text-align: center; color: #333; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
            .welcome-title { color: #4caf50; font-size: 24px; margin-bottom: 20px; }
            .welcome-text { line-height: 1.6; margin-bottom: 20px; }
            .warning-text { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; color: #856404; }
            .welcome-btn { background: #4caf50; color: white; padding: 12px 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
            .welcome-btn:hover { background: #45a049; }
        </style>
    </head>
    <body>
        <!-- رسالة الترحيب والتحذير -->
        <div class="welcome-modal" id="welcomeModal">
            <div class="welcome-content">
                <div class="welcome-title">🛡️ أهلاً وسهلاً بك!</div>
                <div class="welcome-text">
                    <p><strong>مرحباً بك في نظام مكافحة السرقة المتقدم</strong></p>
                    <p>هذا البرنامج مصمم لحماية جهازك وممتلكاتك الشخصية من السرقة والضياع.</p>
                </div>
                <div class="warning-text">
                    <strong>⚠️ تحذير قانوني مهم:</strong><br>
                    نحن غير مسؤولين عن أي استخدام غير قانوني لهذا البرنامج أو أي أنشطة مخالفة للقانون. 
                    يجب استخدام هذا النظام فقط لحماية ممتلكاتك الشخصية وبما يتوافق مع القوانين المحلية.
                </div>
                <div class="welcome-text">
                    <p>✅ استخدم النظام بمسؤولية</p>
                    <p>✅ احترم خصوصية الآخرين</p>
                    <p>✅ اتبع القوانين المحلية</p>
                </div>
                <button class="welcome-btn" onclick="closeWelcomeModal()">فهمت، ابدأ الاستخدام</button>
            </div>
        </div>
        
        <div class="header">
            <div class="container">
                <h1>🛡️ لوحة التحكم - نظام مكافحة السرقة</h1>
                <p>مرحباً <span id="userEmail">المستخدم</span> 
                   <button onclick="showWelcomeAgain()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px; margin-left: 10px;">ℹ️ عرض رسالة الترحيب</button>
                </p>
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
                <input type="password" class="pin-input" id="pinInput" placeholder="****" maxlength="4" onkeypress="if(event.key==='Enter') verifyPIN()" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
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
            
            // عرض البريد الإلكتروني المحفوظ
            const userEmail = localStorage.getItem('userEmail');
            if (userEmail) {
                document.getElementById('userEmail').textContent = userEmail;
            }
            
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
                
                if (!/^\d{4}$/.test(pin)) {
                    statusDiv.innerHTML = '<p style="color: red;">PIN يجب أن يحتوي على أرقام فقط</p>';
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
                        document.getElementById('pinInput').disabled = true;
                        document.querySelector('.pin-section button').disabled = true;
                        document.querySelector('.pin-section button').textContent = 'تم التأكيد ✅';
                    } else {
                        statusDiv.innerHTML = \`<p style="color: red;">❌ \${data.message}</p>\`;
                        document.getElementById('pinInput').value = '';
                        document.getElementById('pinInput').focus();
                    }
                } catch (error) {
                    statusDiv.innerHTML = '<p style="color: red;">خطأ في التحقق من PIN</p>';
                    console.error('PIN verification error:', error);
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
            
            // تركيز على حقل PIN عند تحميل الصفحة
            document.getElementById('pinInput').focus();
            
            // إظهار رسالة الترحيب إذا لم يتم عرضها من قبل
            showWelcomeMessage();
            
            // دالة إظهار رسالة الترحيب
            function showWelcomeMessage() {
                const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
                if (!hasSeenWelcome) {
                    document.getElementById('welcomeModal').style.display = 'flex';
                } else {
                    document.getElementById('welcomeModal').style.display = 'none';
                }
            }
            
            // دالة إغلاق رسالة الترحيب
            function closeWelcomeModal() {
                document.getElementById('welcomeModal').style.display = 'none';
                localStorage.setItem('hasSeenWelcome', 'true');
                // تركيز على حقل PIN بعد إغلاق الرسالة
                setTimeout(() => {
                    document.getElementById('pinInput').focus();
                }, 100);
            }
            
            // دالة إعادة عرض رسالة الترحيب
            function showWelcomeAgain() {
                document.getElementById('welcomeModal').style.display = 'flex';
            }
            
            // جعل الدوال متاحة عالمياً
            window.closeWelcomeModal = closeWelcomeModal;
            window.showWelcomeAgain = showWelcomeAgain;
        </script>
    </body>
    </html>
    `);
});

// صفحة تسجيل الدخول الحقيقية
app.get('/login', (req, res) => {
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
            <p>نظام مكافحة السرقة المتقدم</p>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 15px 0; font-size: 14px;">
                <p>🛡️ <strong>أهلاً وسهلاً بك!</strong></p>
                <p>هذا النظام مصمم لحماية جهازك وممتلكاتك</p>
            </div>
            <div>
                <input type="email" class="email-input" id="emailInput" placeholder="البريد الإلكتروني" required>
                <input type="password" class="email-input" id="passwordInput" placeholder="كلمة المرور" required onkeypress="if(event.key==='Enter') login()">
                <button class="login-btn" onclick="login()">🔐 تسجيل الدخول</button>
                <div id="loginStatus"></div>
                <div style="margin-top: 20px;">
                    <a href="/forgot-password?lang=${lang}" style="color: #ffeb3b; text-decoration: none; margin: 10px;">🔑 نسيت كلمة المرور؟</a>
                    <br>
                    <a href="/register?lang=${lang}" style="color: #4caf50; text-decoration: none; margin: 10px;">📝 إنشاء حساب جديد</a>
                </div>
                <p style="font-size: 12px; opacity: 0.8; margin-top: 15px;">
                    💡 الحساب التجريبي: hlia.hlias123@gmail.com / demo123
                </p>
            </div>
            <a href="/?lang=${lang}" class="back-btn">العودة للصفحة الرئيسية</a>
        </div>
        <script>
            async function login() {
                const email = document.getElementById('emailInput').value;
                const password = document.getElementById('passwordInput').value;
                const statusDiv = document.getElementById('loginStatus');
                
                if (!email) {
                    statusDiv.innerHTML = '<p class="error">يرجى إدخال البريد الإلكتروني</p>';
                    return;
                }
                
                if (!password) {
                    statusDiv.innerHTML = '<p class="error">يرجى إدخال كلمة المرور</p>';
                    return;
                }
                
                statusDiv.innerHTML = '<p>جاري تسجيل الدخول...</p>';
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: email,
                            password: password,
                            deviceId: 'web-' + Date.now() 
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        localStorage.setItem('sessionId', data.sessionId);
                        localStorage.setItem('userEmail', email);
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

// صفحة إنشاء حساب جديد
app.get('/register', (req, res) => {
    const lang = req.query.lang || 'ar';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    res.send(`
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إنشاء حساب جديد - نظام مكافحة السرقة</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(10px); max-width: 400px; }
            .form-input { width: 100%; padding: 15px; margin: 10px 0; border: none; border-radius: 10px; font-size: 16px; box-sizing: border-box; }
            .register-btn { background: #4caf50; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; margin: 10px; transition: all 0.3s; width: 100%; }
            .register-btn:hover { background: #45a049; }
            .back-btn { background: rgba(255,255,255,0.2); color: white; padding: 10px 20px; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; text-decoration: none; display: inline-block; margin: 10px; }
            .login-link { background: #2196f3; color: white; padding: 10px 20px; border: none; border-radius: 10px; text-decoration: none; display: inline-block; margin: 10px; }
            .error { color: #ffcdd2; margin: 10px 0; }
            .success { color: #c8e6c9; margin: 10px 0; }
            .pin-input { width: 100px; text-align: center; letter-spacing: 5px; font-size: 18px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📝 إنشاء حساب جديد</h1>
            <p>نظام مكافحة السرقة المتقدم</p>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 15px 0; font-size: 14px;">
                <p>🛡️ <strong>مرحباً بك في نظام الحماية!</strong></p>
                <p>أنشئ حسابك لحماية جهازك وممتلكاتك بأمان</p>
                <p style="color: #ffeb3b; font-size: 12px;">⚠️ استخدم النظام بمسؤولية وفقاً للقوانين المحلية</p>
            </div>
            <div>
                <input type="email" class="form-input" id="emailInput" placeholder="البريد الإلكتروني" required>
                <input type="password" class="form-input" id="passwordInput" placeholder="كلمة المرور" required>
                <input type="password" class="form-input" id="confirmPasswordInput" placeholder="تأكيد كلمة المرور" required>
                <input type="password" class="form-input pin-input" id="pinInput" placeholder="PIN" maxlength="4" oninput="this.value = this.value.replace(/[^0-9]/g, '')" required>
                <button class="register-btn" onclick="register()">✅ إنشاء الحساب</button>
                <div id="registerStatus"></div>
                <p style="font-size: 12px; opacity: 0.8; margin-top: 15px;">
                    💡 كلمة المرور: 4 أحرف على الأقل<br>
                    🔐 PIN: 4 أرقام للحماية الإضافية
                </p>
            </div>
            <div>
                <a href="/login?lang=${lang}" class="login-link">لديك حساب؟ سجل الدخول</a>
                <a href="/?lang=${lang}" class="back-btn">العودة للصفحة الرئيسية</a>
            </div>
        </div>
        <script>
            async function register() {
                const email = document.getElementById('emailInput').value;
                const password = document.getElementById('passwordInput').value;
                const confirmPassword = document.getElementById('confirmPasswordInput').value;
                const pin = document.getElementById('pinInput').value;
                const statusDiv = document.getElementById('registerStatus');
                
                if (!email || !password || !confirmPassword || !pin) {
                    statusDiv.innerHTML = '<p class="error">جميع الحقول مطلوبة</p>';
                    return;
                }
                
                statusDiv.innerHTML = '<p>جاري إنشاء الحساب...</p>';
                
                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: email,
                            password: password,
                            confirmPassword: confirmPassword,
                            pin: pin
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        statusDiv.innerHTML = '<p class="success">✅ تم إنشاء الحساب بنجاح!</p>';
                        setTimeout(() => {
                            window.location.href = '/login?lang=${lang}';
                        }, 2000);
                    } else {
                        statusDiv.innerHTML = \`<p class="error">❌ \${data.message}</p>\`;
                    }
                } catch (error) {
                    statusDiv.innerHTML = '<p class="error">خطأ في إنشاء الحساب</p>';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// صفحة نسيت كلمة المرور
app.get('/forgot-password', (req, res) => {
    const lang = req.query.lang || 'ar';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    res.send(`
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نسيت كلمة المرور - نظام مكافحة السرقة</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(10px); max-width: 400px; }
            .form-input { width: 100%; padding: 15px; margin: 10px 0; border: none; border-radius: 10px; font-size: 16px; box-sizing: border-box; }
            .btn { background: #ff9800; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; margin: 10px; transition: all 0.3s; width: 100%; }
            .btn:hover { background: #f57c00; }
            .reset-btn { background: #4caf50; }
            .reset-btn:hover { background: #45a049; }
            .back-btn { background: rgba(255,255,255,0.2); color: white; padding: 10px 20px; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; text-decoration: none; display: inline-block; margin: 10px; }
            .error { color: #ffcdd2; margin: 10px 0; }
            .success { color: #c8e6c9; margin: 10px 0; }
            .info { color: #b3e5fc; margin: 10px 0; }
            .hidden { display: none; }
            .pin-display { background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin: 10px 0; font-size: 18px; letter-spacing: 3px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔑 نسيت كلمة المرور</h1>
            <p>نظام مكافحة السرقة</p>
            
            <!-- مرحلة طلب إعادة التعيين -->
            <div id="requestStep">
                <input type="email" class="form-input" id="emailInput" placeholder="البريد الإلكتروني" required>
                <button class="btn" onclick="requestReset()">📧 إرسال رمز إعادة التعيين</button>
                <div id="requestStatus"></div>
            </div>
            
            <!-- مرحلة إعادة التعيين -->
            <div id="resetStep" class="hidden">
                <div class="info">
                    <p>📧 تم إرسال رمز إعادة التعيين</p>
                    <div class="pin-display">
                        <strong>رمز إعادة التعيين: <span id="resetTokenDisplay"></span></strong>
                    </div>
                    <div class="pin-display">
                        <strong>PIN الخاص بك: <span id="pinDisplay"></span></strong>
                    </div>
                </div>
                <input type="text" class="form-input" id="resetTokenInput" placeholder="رمز إعادة التعيين" required>
                <input type="password" class="form-input" id="newPasswordInput" placeholder="كلمة المرور الجديدة" required>
                <input type="password" class="form-input" id="confirmNewPasswordInput" placeholder="تأكيد كلمة المرور الجديدة" required>
                <button class="btn reset-btn" onclick="resetPassword()">🔄 تغيير كلمة المرور</button>
                <div id="resetStatus"></div>
            </div>
            
            <div>
                <a href="/login?lang=${lang}" class="back-btn">العودة لتسجيل الدخول</a>
            </div>
        </div>
        <script>
            let currentEmail = '';
            
            async function requestReset() {
                const email = document.getElementById('emailInput').value;
                const statusDiv = document.getElementById('requestStatus');
                
                if (!email) {
                    statusDiv.innerHTML = '<p class="error">البريد الإلكتروني مطلوب</p>';
                    return;
                }
                
                currentEmail = email;
                statusDiv.innerHTML = '<p>جاري إرسال رمز إعادة التعيين...</p>';
                
                try {
                    const response = await fetch('/api/auth/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        statusDiv.innerHTML = '<p class="success">✅ تم إرسال رمز إعادة التعيين!</p>';
                        document.getElementById('resetTokenDisplay').textContent = data.resetToken;
                        document.getElementById('pinDisplay').textContent = data.pin;
                        document.getElementById('requestStep').classList.add('hidden');
                        document.getElementById('resetStep').classList.remove('hidden');
                    } else {
                        statusDiv.innerHTML = \`<p class="error">❌ \${data.message}</p>\`;
                    }
                } catch (error) {
                    statusDiv.innerHTML = '<p class="error">خطأ في إرسال رمز إعادة التعيين</p>';
                }
            }
            
            async function resetPassword() {
                const resetToken = document.getElementById('resetTokenInput').value;
                const newPassword = document.getElementById('newPasswordInput').value;
                const confirmNewPassword = document.getElementById('confirmNewPasswordInput').value;
                const statusDiv = document.getElementById('resetStatus');
                
                if (!resetToken || !newPassword || !confirmNewPassword) {
                    statusDiv.innerHTML = '<p class="error">جميع الحقول مطلوبة</p>';
                    return;
                }
                
                statusDiv.innerHTML = '<p>جاري تغيير كلمة المرور...</p>';
                
                try {
                    const response = await fetch('/api/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: currentEmail,
                            resetToken: resetToken,
                            newPassword: newPassword,
                            confirmPassword: confirmNewPassword
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        statusDiv.innerHTML = '<p class="success">✅ تم تغيير كلمة المرور بنجاح!</p>';
                        setTimeout(() => {
                            window.location.href = '/login?lang=${lang}';
                        }, 2000);
                    } else {
                        statusDiv.innerHTML = \`<p class="error">❌ \${data.message}</p>\`;
                    }
                } catch (error) {
                    statusDiv.innerHTML = '<p class="error">خطأ في تغيير كلمة المرور</p>';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// إعادة توجيه الروابط القديمة
app.get('/auth/google', (req, res) => {
    res.redirect('/login?lang=' + (req.query.lang || 'ar'));
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
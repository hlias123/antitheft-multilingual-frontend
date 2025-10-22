# حل بديل سريع - GitHub Pages
# Quick Alternative Solution - GitHub Pages

## 🚀 حل فوري بدون مشاكل Railway

بما أن Railway يواجه مشاكل، إليك حل بديل سريع وفعال:

## 📋 الخطوات (5 دقائق فقط!)

### 1️⃣ تفعيل GitHub Pages:
1. اذهب إلى: **https://github.com/hlias123/antitheft-multilingual-frontend**
2. انقر على **Settings**
3. اذهب إلى **Pages** (في القائمة الجانبية)
4. في **Source** اختر: **Deploy from a branch**
5. اختر **Branch: main**
6. اختر **/ (root)**
7. انقر **Save**

### 2️⃣ انتظار النشر:
- GitHub سيبدأ النشر تلقائياً
- انتظر 2-3 دقائق
- ستظهر رسالة: "Your site is published at..."

### 3️⃣ الحصول على الرابط:
```
https://hlias123.github.io/antitheft-multilingual-frontend
```

## 🌐 اختبار الموقع:

### اختبار اللغات:
- **العربية**: `https://hlias123.github.io/antitheft-multilingual-frontend/?lang=ar`
- **الإنجليزية**: `https://hlias123.github.io/antitheft-multilingual-frontend/?lang=en`

### المميزات المتوفرة:
- ✅ زر تغيير اللغة
- ✅ تغيير اتجاه النص (RTL/LTR)
- ✅ حفظ اللغة المختارة
- ✅ تصميم متجاوب
- ✅ تكامل مع الموقع الأصلي

## 🔧 تعديل بسيط للتكامل:

إذا كنت تريد تحسين التكامل مع GitHub Pages، يمكن تعديل server-simple.js:

<function_calls>
<invoke name="fsWrite">
<parameter name="path">index-static.htmlTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-translate="page_title">نظام مكافحة السرقة</title>
    <link rel="stylesheet" href="styles.css">
</head>

<body>
    <!-- شريط التنقل -->
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">
                <h2 data-translate="site_name">نظام مكافحة السرقة</h2>
            </div>

            <!-- زر تغيير اللغة -->
            <div class="language-switcher">
                <button id="languageBtn" class="lang-btn">
                    <span class="flag" id="currentFlag">🇸🇦</span>
                    <span data-translate="current_lang">العربية</span>
                    <span class="arrow">▼</span>
                </button>
                <div class="lang-dropdown" id="langDropdown">
                    <div class="lang-option" data-lang="ar">
                        <span class="flag">🇸🇦</span>
                        <span>العربية</span>
                    </div>
                    <div class="lang-option" data-lang="en">
                        <span class="flag">🇺🇸</span>
                        <span>English</span>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- المحتوى الرئيسي -->
    <main class="main-content">
        <section class="hero">
            <div class="container">
                <h1 data-translate="hero_title">حماية متقدمة ضد السرقة</h1>
                <p data-translate="hero_description">نظام شامل لحماية ممتلكاتك وتتبعها في الوقت الفعلي</p>
                <button class="cta-button" data-translate="get_started">ابدأ الآن</button>
            </div>
        </section>

        <!-- قسم الإحصائيات المباشرة -->
        <section class="stats-section">
            <div class="container">
                <h2 data-translate="stats_title">إحصائيات النظام</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">🛡️</div>
                        <div class="stat-number" id="protected-devices">1,247</div>
                        <div class="stat-label" data-translate="protected_devices">الأجهزة المحمية</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🚨</div>
                        <div class="stat-number" id="active-alerts">3</div>
                        <div class="stat-label" data-translate="active_alerts">التنبيهات النشطة</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-number" id="response-time">150ms</div>
                        <div class="stat-label" data-translate="response_time">زمن الاستجابة</div>
                    </div>
                </div>
            </div>
        </section>

        <section class="features">
            <div class="container">
                <h2 data-translate="features_title">المميزات</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🔒</div>
                        <h3 data-translate="feature1_title">حماية متقدمة</h3>
                        <p data-translate="feature1_desc">تشفير عالي المستوى لحماية بياناتك</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📍</div>
                        <h3 data-translate="feature2_title">تتبع فوري</h3>
                        <p data-translate="feature2_desc">تتبع موقع الجهاز في الوقت الفعلي</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🚨</div>
                        <h3 data-translate="feature3_title">تنبيهات فورية</h3>
                        <p data-translate="feature3_desc">إشعارات فورية عند اكتشاف أي نشاط مشبوه</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- تذييل الصفحة -->
    <footer class="footer">
        <div class="container">
            <p data-translate="footer_text">&copy; 2024 نظام مكافحة السرقة. جميع الحقوق محفوظة.</p>
        </div>
    </footer>

    <script src="translations.js"></script>
    <script>
        // تعيين اللغة من URL للـ GitHub Pages
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && translations[langParam]) {
            window.initialLanguage = langParam;
            localStorage.setItem('selectedLanguage', langParam);
        }
    </script>
    <script src="script.js"></script>
</body>

</html>
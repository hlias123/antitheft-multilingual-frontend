# نظام مكافحة السرقة - دعم متعدد اللغات
# Anti-Theft System - Multilingual Support

## 🌐 المميزات | Features

### العربية
- **زر تغيير اللغة**: تبديل فوري بين العربية والإنجليزية
- **دعم RTL/LTR**: اتجاه النص التلقائي حسب اللغة
- **حفظ التفضيلات**: حفظ اللغة المختارة في المتصفح
- **URL Parameters**: دعم `?lang=ar` و `?lang=en`
- **تكامل مع الباك إند**: ربط مع Railway backend
- **إحصائيات مباشرة**: عرض بيانات من الخادم
- **تصميم متجاوب**: يعمل على جميع الأجهزة

### English
- **Language Toggle Button**: Instant switching between Arabic and English
- **RTL/LTR Support**: Automatic text direction based on language
- **Preference Saving**: Save selected language in browser
- **URL Parameters**: Support for `?lang=ar` and `?lang=en`
- **Backend Integration**: Connected to Railway backend
- **Live Statistics**: Display data from server
- **Responsive Design**: Works on all devices

## 🚀 النشر على Railway | Railway Deployment

### الخطوات | Steps:

1. **رفع الملفات | Upload Files**:
   ```bash
   git add .
   git commit -m "Add multilingual support"
   git push origin main
   ```

2. **ربط مع Railway | Connect to Railway**:
   - اذهب إلى [railway.app](https://railway.app)
   - اختر "Deploy from GitHub repo"
   - اختر المستودع الخاص بك

3. **إعدادات البيئة | Environment Variables**:
   ```
   PORT=3000
   NODE_ENV=production
   ```

4. **الرابط النهائي | Final URL**:
   ```
   https://your-project.up.railway.app/?lang=ar
   https://your-project.up.railway.app/?lang=en
   ```

## 📁 بنية المشروع | Project Structure

```
├── index.html              # الصفحة الرئيسية
├── styles.css             # التصميم مع دعم RTL/LTR
├── translations.js        # ملف الترجمات
├── script.js             # منطق JavaScript
├── backend-integration.js # التكامل مع الباك إند
├── server.js             # خادم Express
├── package.json          # إعدادات Node.js
├── railway.json          # إعدادات Railway
└── nixpacks.toml         # إعدادات البناء
```

## 🔧 التخصيص | Customization

### إضافة لغة جديدة | Add New Language:

1. **في translations.js**:
```javascript
const translations = {
    ar: { /* الترجمات العربية */ },
    en: { /* الترجمات الإنجليزية */ },
    fr: { /* الترجمات الفرنسية */ }
};
```

2. **في index.html**:
```html
<div class="lang-option" data-lang="fr">
    <span class="flag">🇫🇷</span>
    <span>Français</span>
</div>
```

### تخصيص الباك إند | Backend Customization:

```javascript
// في backend-integration.js
const backendURL = 'https://your-backend.up.railway.app/';
```

## 🌟 الاستخدام | Usage

### للمطورين | For Developers:
```javascript
// تغيير اللغة برمجياً
switchLanguageWithURL('en');

// الحصول على اللغة الحالية
console.log(currentLanguage);

// إرسال طلب مع اللغة
fetch('/api/data', {
    headers: { 'Accept-Language': currentLanguage }
});
```

### للمستخدمين | For Users:
- انقر على زر اللغة في أعلى الصفحة
- اختر اللغة المطلوبة من القائمة المنسدلة
- سيتم حفظ اختيارك تلقائياً

## 📞 الدعم | Support

للمساعدة أو الاستفسارات:
- GitHub Issues
- البريد الإلكتروني: support@antitheft.com

---

**تم التطوير بواسطة فريق نظام مكافحة السرقة**
**Developed by Anti-Theft System Team**
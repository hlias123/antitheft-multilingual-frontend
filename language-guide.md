# دليل نظام دعم متعدد اللغات

## المميزات المتوفرة

### ✅ زر تغيير اللغة
- زر أنيق مع علم الدولة
- قائمة منسدلة للاختيار بين اللغات
- حفظ اللغة المختارة في المتصفح

### ✅ اللغات المدعومة حالياً
- العربية (🇸🇦) - اتجاه من اليمين لليسار
- الإنجليزية (🇺🇸) - اتجاه من اليسار لليمين

### ✅ التبديل التلقائي
- تغيير اتجاه النص (RTL/LTR)
- تحديث جميع النصوص فوراً
- تأثيرات انتقال سلسة

## كيفية إضافة لغة جديدة

### 1. إضافة الترجمات في `translations.js`
```javascript
const translations = {
    ar: { /* الترجمات العربية */ },
    en: { /* الترجمات الإنجليزية */ },
    fr: {
        page_title: "Système Anti-Vol",
        site_name: "Système Anti-Vol",
        current_lang: "Français",
        hero_title: "Protection Anti-Vol Avancée",
        // ... باقي الترجمات
    }
};
```

### 2. إضافة إعدادات اللغة
```javascript
const languageConfig = {
    ar: { dir: 'rtl', flag: '🇸🇦', name: 'العربية' },
    en: { dir: 'ltr', flag: '🇺🇸', name: 'English' },
    fr: { dir: 'ltr', flag: '🇫🇷', name: 'Français' }
};
```

### 3. إضافة خيار في HTML
```html
<div class="lang-option" data-lang="fr">
    <span class="flag">🇫🇷</span>
    <span>Français</span>
</div>
```

## كيفية الاستخدام

### للمطورين
```javascript
// تغيير اللغة برمجياً
switchLanguage('en');

// الحصول على اللغة الحالية
console.log(currentLanguage);

// الحصول على ترجمة معينة
const title = translations[currentLanguage].page_title;
```

### للمحتوى الديناميكي
```javascript
// إضافة عنصر جديد مع ترجمة
const newElement = document.createElement('p');
newElement.setAttribute('data-translate', 'new_text_key');
newElement.textContent = translations[currentLanguage].new_text_key;
```

## الملفات المطلوبة

1. `index.html` - الصفحة الرئيسية مع زر اللغة
2. `styles.css` - التصميم مع دعم RTL/LTR
3. `translations.js` - ملف الترجمات
4. `script.js` - منطق تبديل اللغة

## نصائح للتطوير

### إضافة نص جديد
1. أضف `data-translate="key_name"` للعنصر
2. أضف الترجمة في `translations.js`
3. استدعي `applyTranslations(currentLanguage)` لتحديث النص

### دعم اللغات من اليمين لليسار
- استخدم `[dir="rtl"]` في CSS
- تأكد من تحديد `direction: rtl` للغات العربية

### حفظ تفضيلات المستخدم
- اللغة محفوظة في `localStorage`
- تطبق تلقائياً عند إعادة تحميل الصفحة

## مثال للتكامل مع API

```javascript
// إرسال اللغة المختارة مع الطلبات
fetch('/api/data', {
    headers: {
        'Accept-Language': currentLanguage,
        'Content-Type': 'application/json'
    }
});
```

## التخصيص

يمكنك تخصيص:
- ألوان زر اللغة في CSS
- إضافة المزيد من التأثيرات
- تغيير موقع زر اللغة
- إضافة أصوات للتنبيهات
# دليل إضافة المتغيرات في Railway
# Railway Variables Setup Guide

## 🎯 الخطوات المطلوبة الآن

### 1️⃣ اذهب إلى Railway Dashboard:
👉 **https://railway.app/dashboard**

### 2️⃣ اختر مشروعك:
- ابحث عن: `antitheft-multilingual-frontend`
- انقر عليه

### 3️⃣ اذهب إلى Variables:
- انقر على تبويب **"Variables"**
- ستجد قائمة فارغة أو متغيرات موجودة

### 4️⃣ أضف المتغيرات التالية:

#### المتغير الأول:
- **Name**: `ALERT_EMAIL`
- **Value**: `where-to-send-alerts@gmail.com`
- انقر **"Add"**

#### المتغير الثاني:
- **Name**: `EMAIL_USER`
- **Value**: `hlia.hlias123@gmail.com`
- انقر **"Add"**

#### المتغير الثالث:
- **Name**: `EMAIL_PASS`
- **Value**: `utms tlru aqbu wcqj`
- انقر **"Add"**

#### المتغير الرابع:
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://neondb_owner:npg_xvWlX9I8gATq@ep-wandering-dream-agdrjpoz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- انقر **"Add"**

#### المتغير الخامس:
- **Name**: `NODE_ENV`
- **Value**: `production`
- انقر **"Add"**

### 5️⃣ إعادة النشر:
1. اذهب إلى تبويب **"Deployments"**
2. انقر **"Redeploy"** على آخر deployment
3. انتظر اكتمال النشر (3-5 دقائق)

## 🧪 اختبار النتيجة

### بعد اكتمال النشر:
1. **انقر "View App"** للحصول على الرابط
2. **اختبر الصفحة الرئيسية**
3. **اختبر API الصحة**: `your-link/api/health`

### النتيجة المتوقعة من /api/health:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-22T...",
  "language": "ar",
  "environment": "production",
  "emailConfigured": true,
  "databaseConfigured": true
}
```

## 🎉 المميزات الجديدة

### APIs المتاحة:
1. **GET /api/health** - فحص حالة النظام
2. **POST /api/send-alert** - إرسال تنبيهات
3. **GET /api/config** - الحصول على الإعدادات

### مثال إرسال تنبيه:
```javascript
fetch('/api/send-alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'تم اكتشاف نشاط مشبوه',
    type: 'security',
    language: 'ar'
  })
});
```

## 🔒 الأمان

### ✅ تم تطبيقه:
- المتغيرات محفوظة بشكل آمن في Railway
- لا تظهر في الكود المصدري
- محمية من الوصول العام

### ⚠️ مهم:
- **لا تشارك هذه المعلومات** مع أحد
- **غير كلمات المرور** إذا تم كشفها
- **راقب الوصول** لحساب Railway

## 🎯 النتيجة النهائية

بعد إضافة المتغيرات ستحصل على:
- ✅ **موقع مع دعم اللغات**
- ✅ **اتصال بقاعدة البيانات Neon**
- ✅ **إرسال تنبيهات بالبريد الإلكتروني**
- ✅ **APIs متقدمة للتفاعل**
- ✅ **نظام أمان محسن**

---

## 🚀 ابدأ الآن!

**اذهب إلى Railway وأضف المتغيرات:**
👉 **https://railway.app/dashboard**

**الوقت المتوقع**: 5 دقائق فقط!

**بعدها ستحصل على نظام متكامل مع قاعدة بيانات وبريد إلكتروني! 🎉**
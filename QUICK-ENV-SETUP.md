# إعداد سريع لمتغيرات البيئة
# Quick Environment Variables Setup

## 🎯 الهدف
إضافة المتغيرات التي قدمتها بشكل آمن للمشروع

## 🚀 الخطوات السريعة

### 1️⃣ تحديث الملفات المحلية:
```bash
# استخدام الإصدار المحسن
cp package-env.json package.json
cp server-with-env.js server.js

# رفع التحديثات
git add .
git commit -m "Add environment variables support"
git push origin main
```

### 2️⃣ إضافة المتغيرات في Railway:

#### اذهب إلى Railway Dashboard → Variables وأضف:

| Variable Name | Value |
|---------------|-------|
| `ALERT_EMAIL` | `where-to-send-alerts@gmail.com` |
| `EMAIL_USER` | `hlia.hlias123@gmail.com` |
| `EMAIL_PASS` | `utms tlru aqbu wcqj` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_xvWlX9I8gATq@ep-wandering-dream-agdrjpoz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `NODE_ENV` | `production` |

### 3️⃣ إعادة النشر:
- **Deployments** → **Redeploy**

## 🧪 اختبار النتيجة

### بعد النشر، اختبر:
```
GET /api/health
```

### النتيجة المتوقعة:
```json
{
  "status": "healthy",
  "emailConfigured": true,
  "databaseConfigured": true,
  "environment": "production"
}
```

## 🌐 APIs الجديدة المتاحة

### 1️⃣ فحص الصحة:
```
GET /api/health
```

### 2️⃣ إرسال تنبيه:
```
POST /api/send-alert
{
  "message": "رسالة التنبيه",
  "type": "security",
  "language": "ar"
}
```

### 3️⃣ الحصول على الإعدادات:
```
GET /api/config
```

## 🔒 الأمان

### ✅ تم تطبيقه:
- المتغيرات محمية في Railway
- لا تظهر في الكود
- .gitignore محدث لحماية .env

### ⚠️ تحذير:
**لا تضع هذه المعلومات في الكود أبداً!**

## 🎉 النتيجة

بعد التطبيق ستحصل على:
- ✅ **موقع مع دعم اللغات**
- ✅ **اتصال آمن بقاعدة البيانات**
- ✅ **إرسال تنبيهات بالبريد**
- ✅ **APIs للتفاعل مع النظام**

---

## 🚀 ابدأ التطبيق الآن!

**الخطوات:**
1. تحديث الملفات
2. رفع للـ GitHub
3. إضافة المتغيرات في Railway
4. إعادة النشر

**الوقت المتوقع**: 5-10 دقائق
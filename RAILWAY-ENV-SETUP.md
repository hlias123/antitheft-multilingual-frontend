# إعداد متغيرات البيئة في Railway
# Railway Environment Variables Setup

## 🔐 المتغيرات المطلوبة

### البيانات المقدمة:
```
ALERT_EMAIL=where-to-send-alerts@gmail.com
DATABASE_URL=postgresql://neondb_owner:npg_xvWlX9I8gATq@ep-wandering-dream-agdrjpoz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
EMAIL_PASS=utms tlru aqbu wcqj
EMAIL_USER=hlia.hlias123@gmail.com
```

## 🚀 خطوات الإعداد في Railway

### 1️⃣ الوصول لإعدادات المتغيرات:
1. **اذهب إلى Railway Dashboard**
2. **اختر مشروعك**
3. **انقر على تبويب "Variables"**

### 2️⃣ إضافة المتغيرات واحداً تلو الآخر:

#### المتغير الأول:
- **Name**: `ALERT_EMAIL`
- **Value**: `where-to-send-alerts@gmail.com`

#### المتغير الثاني:
- **Name**: `EMAIL_USER`
- **Value**: `hlia.hlias123@gmail.com`

#### المتغير الثالث:
- **Name**: `EMAIL_PASS`
- **Value**: `utms tlru aqbu wcqj`

#### المتغير الرابع:
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://neondb_owner:npg_xvWlX9I8gATq@ep-wandering-dream-agdrjpoz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

#### متغيرات إضافية:
- **Name**: `NODE_ENV`
- **Value**: `production`

### 3️⃣ حفظ وإعادة النشر:
1. **انقر "Save"** بعد إضافة كل متغير
2. **اذهب إلى Deployments**
3. **انقر "Redeploy"**

## 🔧 تحديث الملفات المحلية

### استخدام الإصدار المحسن:
```bash
# استبدال الملفات
cp package-env.json package.json
cp server-with-env.js server.js

# رفع التحديثات
git add .
git commit -m "Add environment variables support"
git push origin main
```

## 🧪 اختبار المتغيرات

### بعد النشر، اختبر:
```
GET /api/health
```

### يجب أن ترى:
```json
{
  "status": "healthy",
  "emailConfigured": true,
  "databaseConfigured": true,
  "environment": "production"
}
```

## 🔒 الأمان

### ⚠️ تحذيرات مهمة:
1. **لا تضع المتغيرات في الكود** أبداً
2. **استخدم .env.example فقط** كمثال
3. **أضف .env إلى .gitignore**
4. **غير كلمات المرور** إذا تم كشفها

### إضافة .env إلى .gitignore:
```
# Environment variables
.env
.env.local
.env.production
```

## 🌐 الاستخدام في الكود

### الوصول للمتغيرات:
```javascript
const alertEmail = process.env.ALERT_EMAIL;
const databaseUrl = process.env.DATABASE_URL;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
```

### مثال API:
```javascript
app.post('/api/send-alert', (req, res) => {
    const alertEmail = process.env.ALERT_EMAIL;
    // إرسال تنبيه للبريد المحدد
});
```

## 📊 فوائد استخدام متغيرات البيئة

### ✅ المميزات:
- **🔐 أمان عالي** - لا كشف للمعلومات الحساسة
- **🔄 مرونة** - تغيير الإعدادات بدون تعديل الكود
- **🌍 بيئات متعددة** - إعدادات مختلفة للتطوير والإنتاج
- **👥 فريق العمل** - كل مطور له إعداداته الخاصة

## 🎯 النتيجة المتوقعة

بعد الإعداد ستحصل على:
- ✅ **اتصال آمن بقاعدة البيانات**
- ✅ **إرسال تنبيهات بالبريد الإلكتروني**
- ✅ **إعدادات مرنة وآمنة**
- ✅ **دعم بيئات متعددة**

---

## 🚀 الخطوة التالية

**بعد إضافة المتغيرات في Railway:**
1. **Redeploy المشروع**
2. **اختبار /api/health**
3. **التأكد من عمل الإعدادات**

**الموقع سيعمل مع الإعدادات الجديدة! 🎉**
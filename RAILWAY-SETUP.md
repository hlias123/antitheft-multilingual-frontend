# ربط الموقع مع Railway - خطوات سريعة
# Quick Railway Connection Guide

## 🎯 الهدف | Goal
ربط مشروع نظام مكافحة السرقة مع دعم متعدد اللغات على Railway

## 📋 المتطلبات | Requirements
- حساب GitHub
- حساب Railway
- الملفات الحالية (✅ موجودة)

## 🚀 الخطوات السريعة | Quick Steps

### 1️⃣ رفع المشروع لـ GitHub

```bash
# في مجلد المشروع
git init
git add .
git commit -m "Add multilingual anti-theft system"

# إنشاء مستودع على GitHub ثم:
git remote add origin https://github.com/YOUR-USERNAME/antitheft-multilingual.git
git branch -M main
git push -u origin main
```

### 2️⃣ ربط مع Railway

1. **اذهب إلى**: https://railway.app
2. **انقر على**: "Start a New Project"
3. **اختر**: "Deploy from GitHub repo"
4. **اختر المستودع**: antitheft-multilingual
5. **Railway سيبدأ النشر تلقائياً**

### 3️⃣ إعدادات البيئة (اختياري)

في Railway Dashboard → Variables:
```
PORT=3000
NODE_ENV=production
```

### 4️⃣ الحصول على الرابط

بعد النشر الناجح:
- انقر على "View Logs" للتأكد من عدم وجود أخطاء
- انقر على "View App" للحصول على الرابط
- الرابط سيكون: `https://your-project-name.up.railway.app`

## 🌐 اختبار الموقع | Testing

### اختبار اللغات:
- العربية: `https://your-project.up.railway.app/?lang=ar`
- الإنجليزية: `https://your-project.up.railway.app/?lang=en`

### اختبار المميزات:
✅ زر تغيير اللغة
✅ حفظ اللغة المختارة
✅ تغيير اتجاه النص (RTL/LTR)
✅ الإحصائيات المباشرة
✅ زر "ابدأ الآن" يوجه للباك إند

## 🔧 إعدادات إضافية | Additional Settings

### ربط نطاق مخصص (اختياري):
1. في Railway Dashboard
2. Settings → Domains
3. Add Custom Domain

### مراقبة الأداء:
- Metrics → CPU/Memory Usage
- Logs → Real-time monitoring

## 🐛 حل المشاكل | Troubleshooting

### إذا فشل النشر:
```bash
# فحص السجلات في Railway
railway logs --tail

# أو في Dashboard → View Logs
```

### أخطاء شائعة:
- **Port Error**: تأكد من `PORT=3000` في المتغيرات
- **Build Error**: تأكد من وجود `package.json`
- **Runtime Error**: فحص `server.js` للأخطاء

## 📞 الدعم | Support

### Railway:
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

### المشروع:
- GitHub Issues
- البريد الإلكتروني

---

## 🎉 بعد النشر الناجح | After Successful Deployment

سيكون لديك:
- ✅ موقع متعدد اللغات
- ✅ رابط مباشر على Railway
- ✅ تكامل مع الباك إند
- ✅ دعم URL parameters
- ✅ تصميم متجاوب

**الرابط النهائي سيكون مثل:**
`https://antitheft-multilingual-production.up.railway.app`

**مع دعم اللغات:**
- `?lang=ar` للعربية
- `?lang=en` للإنجليزية
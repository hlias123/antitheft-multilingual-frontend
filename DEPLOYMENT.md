# دليل النشر على Railway
# Railway Deployment Guide

## 🚀 خطوات النشر السريع | Quick Deployment Steps

### 1. تحضير المشروع | Project Preparation

```bash
# تأكد من وجود جميع الملفات
ls -la
# يجب أن ترى:
# - package.json
# - server.js
# - index.html
# - styles.css
# - translations.js
# - script.js
# - backend-integration.js
# - railway.json
```

### 2. رفع المشروع لـ GitHub | Upload to GitHub

```bash
# إنشاء مستودع جديد
git init
git add .
git commit -m "Initial commit: Multilingual Anti-Theft System"

# ربط مع GitHub (استبدل USERNAME و REPO-NAME)
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git branch -M main
git push -u origin main
```

### 3. النشر على Railway | Deploy to Railway

#### الطريقة الأولى: من GitHub
1. اذهب إلى [railway.app](https://railway.app)
2. انقر على "Start a New Project"
3. اختر "Deploy from GitHub repo"
4. اختر المستودع الخاص بك
5. Railway سيكتشف تلقائياً أنه مشروع Node.js

#### الطريقة الثانية: Railway CLI
```bash
# تثبيت Railway CLI
npm install -g @railway/cli

# تسجيل الدخول
railway login

# إنشاء مشروع جديد
railway init

# النشر
railway up
```

### 4. إعدادات البيئة | Environment Variables

في لوحة تحكم Railway، أضف:

```
PORT=3000
NODE_ENV=production
BACKEND_URL=https://antitheft-backend-production.up.railway.app
```

### 5. إعدادات النطاق | Domain Settings

1. في Railway Dashboard
2. اذهب إلى Settings → Domains
3. انقر على "Generate Domain" أو أضف نطاق مخصص

## 🔧 إعدادات متقدمة | Advanced Configuration

### تخصيص رابط الباك إند | Custom Backend URL

في `backend-integration.js`:
```javascript
// استبدل الرابط بالرابط الخاص بك
const backendURL = 'https://your-backend.up.railway.app/';
```

### إعدادات الأمان | Security Settings

في `server.js`:
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            connectSrc: ["'self'", "https://your-backend.up.railway.app"]
        }
    }
}));
```

## 🌐 اختبار النشر | Testing Deployment

### 1. فحص الصحة | Health Check
```bash
curl https://your-app.up.railway.app/api/health
```

### 2. اختبار اللغات | Language Testing
```bash
# العربية
curl "https://your-app.up.railway.app/?lang=ar"

# الإنجليزية  
curl "https://your-app.up.railway.app/?lang=en"
```

### 3. اختبار التكامل | Integration Testing
- افتح الموقع في المتصفح
- جرب تغيير اللغة
- تأكد من عمل الإحصائيات
- اختبر زر "ابدأ الآن"

## 🐛 حل المشاكل الشائعة | Troubleshooting

### مشكلة: الموقع لا يعمل
```bash
# فحص السجلات
railway logs

# فحص حالة الخدمة
railway status
```

### مشكلة: اللغة لا تتغير
- تأكد من وجود ملف `translations.js`
- فحص وحدة التحكم في المتصفح للأخطاء
- تأكد من تحميل جميع ملفات JavaScript

### مشكلة: الباك إند لا يستجيب
- تأكد من صحة رابط الباك إند
- فحص إعدادات CORS
- تأكد من عمل الباك إند

## 📊 مراقبة الأداء | Performance Monitoring

### في Railway Dashboard:
1. اذهب إلى Metrics
2. راقب:
   - CPU Usage
   - Memory Usage
   - Request Count
   - Response Time

### إضافة Google Analytics (اختياري):
```html
<!-- في index.html قبل </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔄 التحديثات | Updates

### نشر تحديث جديد:
```bash
git add .
git commit -m "Update: description of changes"
git push origin main
# Railway سيعيد النشر تلقائياً
```

### Rollback لإصدار سابق:
1. في Railway Dashboard
2. اذهب إلى Deployments
3. انقر على "Rollback" للإصدار المطلوب

## 📞 الدعم | Support

### Railway Support:
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Help Center](https://help.railway.app)

### مشروع Support:
- GitHub Issues في مستودع المشروع
- البريد الإلكتروني: support@antitheft.com

---

**نصائح مهمة | Important Tips:**

✅ تأكد من اختبار الموقع محلياً قبل النشر
✅ احتفظ بنسخة احتياطية من قاعدة البيانات
✅ راقب استخدام الموارد بانتظام
✅ حدث التبعيات بانتظام للأمان

**Good luck with your deployment! 🚀**
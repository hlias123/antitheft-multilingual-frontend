@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    نشر سريع لنظام اللغات                     ║
echo ║                 Quick Deploy Language System                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🚀 بدء عملية النشر السريع...
echo 🚀 Starting quick deployment process...
echo.

echo [1/3] تحضير Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git غير مثبت! يرجى تثبيت Git من: https://git-scm.com
    pause
    exit /b 1
)
echo ✅ Git جاهز

echo.
echo [2/3] إعداد المستودع...
if exist ".git" rmdir /s /q .git
git init
git add .
git commit -m "Deploy multilingual anti-theft frontend"
echo ✅ تم إعداد المستودع المحلي

echo.
echo [3/3] الخطوات التالية:
echo.
echo 📋 يرجى اتباع هذه الخطوات بالترتيب:
echo.
echo 1️⃣ إنشاء مستودع GitHub جديد:
echo    👉 اذهب إلى: https://github.com/new
echo    👉 اسم المستودع: antitheft-frontend-multilingual
echo    👉 اجعله Public
echo    👉 انقر "Create repository"
echo.
echo 2️⃣ نسخ وتشغيل هذه الأوامر (استبدل YOUR-USERNAME):
echo.
echo    git remote add origin https://github.com/YOUR-USERNAME/antitheft-frontend-multilingual.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3️⃣ النشر على Railway:
echo    👉 اذهب إلى: https://railway.app
echo    👉 انقر "New Project"
echo    👉 اختر "Deploy from GitHub repo"
echo    👉 اختر المستودع الجديد
echo.
echo 🎉 النتيجة المتوقعة:
echo    ✅ صفحة هبوط احترافية مع دعم اللغات
echo    ✅ زر تغيير اللغة (العربية/الإنجليزية)
echo    ✅ ربط مع الموقع الأصلي
echo    ✅ رابط مثل: https://antitheft-frontend-multilingual-production.up.railway.app
echo.
echo 🔗 الربط مع الموقع الأصلي:
echo    زر "ابدأ الآن" سيوجه إلى:
echo    https://antitheft-backend-production.up.railway.app/?lang=ar
echo    https://antitheft-backend-production.up.railway.app/?lang=en
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  🎯 هذا الحل يعطيك صفحة هبوط مع دعم اللغات دون تعديل الأصلي  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
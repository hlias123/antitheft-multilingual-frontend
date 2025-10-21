@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      إصلاح سريع لمشكلة Not Found                ║
echo ║                    Quick Fix for Not Found Issue              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔧 بدء الإصلاح السريع...
echo 🔧 Starting quick fix...
echo.

echo [1/3] فحص Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git غير مثبت!
    pause
    exit /b 1
)
echo ✅ Git متوفر

echo.
echo [2/3] تحديث الملفات...
git add .
git commit -m "Fix deployment issues - updated server configuration"
echo ✅ تم تحديث الملفات

echo.
echo [3/3] رفع التحديثات...
git push origin main
if errorlevel 1 (
    echo ⚠️ تعذر رفع الملفات - تأكد من ربط GitHub أولاً
    echo.
    echo 📋 إذا لم تقم بربط GitHub بعد، استخدم هذه الأوامر:
    echo    git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
    echo    git branch -M main
    echo    git push -u origin main
    echo.
    pause
    exit /b 1
)

echo ✅ تم رفع التحديثات بنجاح!
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        الخطوات التالية                         ║
echo ║                        Next Steps                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 1️⃣ اذهب إلى Railway Dashboard:
echo    👉 https://railway.app/dashboard
echo.
echo 2️⃣ اختر مشروعك واذهب إلى Deployments
echo.
echo 3️⃣ انقر "Redeploy" على آخر deployment
echo.
echo 4️⃣ انتظر 3-5 دقائق لاكتمال النشر
echo.
echo 5️⃣ اختبر الرابط:
echo    👉 https://your-project.up.railway.app/?lang=ar
echo    👉 https://your-project.up.railway.app/?lang=en
echo.
echo 🎯 إذا استمرت المشكلة:
echo    - فحص Build Logs في Railway
echo    - تأكد من الرابط الصحيح في Settings → Domains
echo    - جرب مسح كاش المتصفح (Ctrl+F5)
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  🚀 تم تحديث الملفات! الآن أعد النشر في Railway Dashboard    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                 نشر سريع على GitHub Pages                    ║
echo ║              Quick Deploy to GitHub Pages                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🚀 حل مشكلة Railway "Train has not arrived"
echo 🚀 Solving Railway "Train has not arrived" issue
echo.

echo [1/4] تحضير الملفات...
echo [1/4] Preparing files...

if exist "index-simple.html" (
    copy "index-simple.html" "index.html" >nul
    echo ✅ تم استبدال index.html بالنسخة المبسطة
    echo ✅ Replaced index.html with simplified version
) else (
    echo ❌ ملف index-simple.html غير موجود
    echo ❌ index-simple.html file not found
    pause
    exit /b 1
)

echo.
echo [2/4] فحص Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git غير مثبت! يرجى تثبيت Git من: https://git-scm.com
    pause
    exit /b 1
)
echo ✅ Git متوفر

echo.
echo [3/4] إعداد المستودع...
if exist ".git" rmdir /s /q .git
git init
git add index.html
git commit -m "Deploy multilingual frontend to GitHub Pages"
echo ✅ تم إعداد المستودع

echo.
echo [4/4] الخطوات التالية:
echo.
echo 📋 يرجى اتباع هذه الخطوات:
echo.
echo 1️⃣ إنشاء مستودع GitHub جديد:
echo    👉 اذهب إلى: https://github.com/new
echo    👉 اسم المستودع: antitheft-frontend
echo    👉 اجعله Public ✅
echo    👉 انقر "Create repository"
echo.
echo 2️⃣ رفع الملفات (استبدل YOUR-USERNAME):
echo.
echo    git remote add origin https://github.com/YOUR-USERNAME/antitheft-frontend.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3️⃣ تفعيل GitHub Pages:
echo    👉 في GitHub: Settings → Pages
echo    👉 Source: "Deploy from a branch"
echo    👉 Branch: "main"
echo    👉 انقر Save
echo.
echo 4️⃣ النتيجة (خلال 2-3 دقائق):
echo    👉 https://YOUR-USERNAME.github.io/antitheft-frontend
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        المميزات المتوفرة                       ║
echo ║                      Available Features                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ✅ زر تغيير اللغة (🇸🇦 العربية / 🇺🇸 English)
echo ✅ Language toggle button (🇸🇦 Arabic / 🇺🇸 English)
echo.
echo ✅ دعم URL: ?lang=ar و ?lang=en
echo ✅ URL support: ?lang=ar and ?lang=en
echo.
echo ✅ تغيير اتجاه النص تلقائياً (RTL/LTR)
echo ✅ Automatic text direction (RTL/LTR)
echo.
echo ✅ زر "ابدأ الآن" يوجه للموقع الأصلي مع اللغة
echo ✅ "Get Started" button redirects to original site with language
echo.
echo ✅ تصميم احترافي ومتجاوب
echo ✅ Professional responsive design
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║   🎯 هذا الحل أسرع وأضمن من Railway - لا توجد مشاكل تقنية!   ║
echo ║  🎯 This solution is faster and more reliable than Railway!  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
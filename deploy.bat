@echo off
echo ========================================
echo    نشر نظام مكافحة السرقة على Railway
echo    Anti-Theft System Railway Deployment
echo ========================================
echo.

echo [1/4] تحضير Git...
echo [1/4] Preparing Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git غير مثبت! يرجى تثبيت Git أولاً
    echo ❌ Git not installed! Please install Git first
    pause
    exit /b 1
)

echo ✅ Git متوفر
echo ✅ Git available
echo.

echo [2/4] إعداد المستودع المحلي...
echo [2/4] Setting up local repository...
if not exist ".git" (
    git init
    echo ✅ تم إنشاء مستودع Git جديد
    echo ✅ New Git repository created
) else (
    echo ✅ مستودع Git موجود
    echo ✅ Git repository exists
)

echo.
echo [3/4] إضافة الملفات...
echo [3/4] Adding files...
git add .
git commit -m "Deploy multilingual anti-theft system to Railway"
echo ✅ تم حفظ التغييرات
echo ✅ Changes committed
echo.

echo [4/4] الخطوات التالية:
echo [4/4] Next steps:
echo.
echo 📋 يرجى اتباع هذه الخطوات:
echo 📋 Please follow these steps:
echo.
echo 1. إنشاء مستودع جديد على GitHub
echo    Create a new repository on GitHub
echo.
echo 2. نسخ الأوامر التالية وتشغيلها:
echo    Copy and run the following commands:
echo.
echo    git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. الذهاب إلى Railway.app وربط المستودع
echo    Go to Railway.app and connect the repository
echo.
echo 4. اختيار "Deploy from GitHub repo"
echo    Select "Deploy from GitHub repo"
echo.
echo 🌐 بعد النشر، الموقع سيكون متاحاً على:
echo 🌐 After deployment, the site will be available at:
echo    https://your-project.up.railway.app/?lang=ar
echo    https://your-project.up.railway.app/?lang=en
echo.
echo ========================================
echo           🎉 جاهز للنشر! Ready to Deploy!
echo ========================================
pause
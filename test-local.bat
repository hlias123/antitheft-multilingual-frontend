@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      اختبار النظام محلياً                      ║
echo ║                    Test System Locally                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🧪 بدء اختبار النظام محلياً...
echo 🧪 Starting local system test...
echo.

echo [1/2] فحص Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js غير مثبت! يرجى تثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js متوفر

echo.
echo [2/2] تثبيت التبعيات وتشغيل الخادم...
if not exist "node_modules" (
    echo 📦 تثبيت التبعيات...
    npm install
)

echo.
echo 🚀 تشغيل الخادم المحلي...
echo 🌐 الموقع سيكون متاحاً على:
echo    👉 http://localhost:3000/?lang=ar (العربية)
echo    👉 http://localhost:3000/?lang=en (الإنجليزية)
echo.
echo 🔄 لإيقاف الخادم: اضغط Ctrl+C
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎉 جاري تشغيل الخادم...                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

npm start
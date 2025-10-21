// فحص صحة المشروع قبل النشر
// Project validation before deployment

const fs = require('fs');
const path = require('path');

console.log('🔍 فحص صحة المشروع...');
console.log('🔍 Checking project integrity...\n');

// الملفات المطلوبة
const requiredFiles = [
    'package.json',
    'server.js',
    'index.html',
    'styles.css',
    'translations.js',
    'script.js',
    'backend-integration.js',
    'railway.json'
];

// فحص وجود الملفات
let allFilesExist = true;
console.log('📁 فحص الملفات المطلوبة:');
console.log('📁 Checking required files:');

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - مفقود / Missing`);
        allFilesExist = false;
    }
});

console.log('\n📋 فحص محتوى الملفات:');
console.log('📋 Checking file contents:');

// فحص package.json
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.start) {
        console.log('✅ package.json - start script موجود');
    } else {
        console.log('❌ package.json - start script مفقود');
        allFilesExist = false;
    }
    
    if (packageJson.dependencies && packageJson.dependencies.express) {
        console.log('✅ package.json - Express dependency موجود');
    } else {
        console.log('❌ package.json - Express dependency مفقود');
        allFilesExist = false;
    }
} catch (error) {
    console.log('❌ package.json - خطأ في التنسيق / Format error');
    allFilesExist = false;
}

// فحص server.js
try {
    const serverContent = fs.readFileSync('server.js', 'utf8');
    
    if (serverContent.includes('express')) {
        console.log('✅ server.js - Express مستورد');
    } else {
        console.log('❌ server.js - Express غير مستورد');
        allFilesExist = false;
    }
    
    if (serverContent.includes('process.env.PORT')) {
        console.log('✅ server.js - PORT configuration موجود');
    } else {
        console.log('❌ server.js - PORT configuration مفقود');
        allFilesExist = false;
    }
} catch (error) {
    console.log('❌ server.js - لا يمكن قراءة الملف / Cannot read file');
    allFilesExist = false;
}

// فحص translations.js
try {
    const translationsContent = fs.readFileSync('translations.js', 'utf8');
    
    if (translationsContent.includes('translations') && 
        translationsContent.includes('ar:') && 
        translationsContent.includes('en:')) {
        console.log('✅ translations.js - ترجمات العربية والإنجليزية موجودة');
    } else {
        console.log('❌ translations.js - ترجمات مفقودة أو غير مكتملة');
        allFilesExist = false;
    }
} catch (error) {
    console.log('❌ translations.js - لا يمكن قراءة الملف / Cannot read file');
    allFilesExist = false;
}

// فحص index.html
try {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    
    if (htmlContent.includes('data-translate')) {
        console.log('✅ index.html - عناصر الترجمة موجودة');
    } else {
        console.log('❌ index.html - عناصر الترجمة مفقودة');
        allFilesExist = false;
    }
    
    if (htmlContent.includes('language-switcher')) {
        console.log('✅ index.html - زر تغيير اللغة موجود');
    } else {
        console.log('❌ index.html - زر تغيير اللغة مفقود');
        allFilesExist = false;
    }
} catch (error) {
    console.log('❌ index.html - لا يمكن قراءة الملف / Cannot read file');
    allFilesExist = false;
}

console.log('\n🔧 فحص إعدادات Railway:');
console.log('🔧 Checking Railway configuration:');

// فحص railway.json
try {
    const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
    
    if (railwayConfig.deploy && railwayConfig.deploy.startCommand) {
        console.log('✅ railway.json - start command موجود');
    } else {
        console.log('❌ railway.json - start command مفقود');
        allFilesExist = false;
    }
} catch (error) {
    console.log('❌ railway.json - خطأ في التنسيق / Format error');
    allFilesExist = false;
}

// النتيجة النهائية
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
    console.log('🎉 المشروع جاهز للنشر!');
    console.log('🎉 Project ready for deployment!');
    console.log('\n📋 الخطوات التالية:');
    console.log('📋 Next steps:');
    console.log('1. تشغيل deploy.bat أو اتباع RAILWAY-SETUP.md');
    console.log('1. Run deploy.bat or follow RAILWAY-SETUP.md');
    console.log('2. رفع المشروع لـ GitHub');
    console.log('2. Push project to GitHub');
    console.log('3. ربط مع Railway.app');
    console.log('3. Connect with Railway.app');
} else {
    console.log('❌ يوجد مشاكل في المشروع!');
    console.log('❌ Project has issues!');
    console.log('\n🔧 يرجى إصلاح المشاكل المذكورة أعلاه قبل النشر');
    console.log('🔧 Please fix the issues mentioned above before deployment');
}
console.log('='.repeat(50));
// ملف تشخيص المشاكل
// Troubleshooting file

const fs = require('fs');
const path = require('path');

console.log('🔍 تشخيص مشاكل النشر...');
console.log('🔍 Diagnosing deployment issues...\n');

// فحص الملفات الأساسية
const criticalFiles = [
    'package.json',
    'server.js', 
    'index.html',
    'styles.css',
    'translations.js',
    'script.js'
];

console.log('📁 فحص الملفات الأساسية:');
console.log('📁 Checking critical files:');

let allFilesOk = true;

criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
        console.log(`❌ ${file} - مفقود / Missing`);
        allFilesOk = false;
    }
});

// فحص package.json
console.log('\n📦 فحص package.json:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log(`✅ Name: ${packageJson.name}`);
    console.log(`✅ Version: ${packageJson.version}`);
    console.log(`✅ Main: ${packageJson.main}`);
    
    if (packageJson.scripts && packageJson.scripts.start) {
        console.log(`✅ Start script: ${packageJson.scripts.start}`);
    } else {
        console.log('❌ Start script مفقود');
        allFilesOk = false;
    }
    
    if (packageJson.engines && packageJson.engines.node) {
        console.log(`✅ Node version: ${packageJson.engines.node}`);
    }
    
} catch (error) {
    console.log('❌ خطأ في قراءة package.json:', error.message);
    allFilesOk = false;
}

// فحص server.js
console.log('\n🖥️ فحص server.js:');
try {
    const serverContent = fs.readFileSync('server.js', 'utf8');
    
    if (serverContent.includes('process.env.PORT')) {
        console.log('✅ PORT configuration موجود');
    } else {
        console.log('❌ PORT configuration مفقود');
        allFilesOk = false;
    }
    
    if (serverContent.includes('app.listen')) {
        console.log('✅ Server listener موجود');
    } else {
        console.log('❌ Server listener مفقود');
        allFilesOk = false;
    }
    
    if (serverContent.includes('express')) {
        console.log('✅ Express مستورد');
    } else {
        console.log('❌ Express غير مستورد');
        allFilesOk = false;
    }
    
} catch (error) {
    console.log('❌ خطأ في قراءة server.js:', error.message);
    allFilesOk = false;
}

// فحص index.html
console.log('\n🌐 فحص index.html:');
try {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    
    if (htmlContent.includes('<!DOCTYPE html>')) {
        console.log('✅ HTML DOCTYPE موجود');
    } else {
        console.log('❌ HTML DOCTYPE مفقود');
    }
    
    if (htmlContent.includes('data-translate')) {
        console.log('✅ Translation attributes موجودة');
    } else {
        console.log('❌ Translation attributes مفقودة');
    }
    
    if (htmlContent.includes('language-switcher')) {
        console.log('✅ Language switcher موجود');
    } else {
        console.log('❌ Language switcher مفقود');
    }
    
} catch (error) {
    console.log('❌ خطأ في قراءة index.html:', error.message);
    allFilesOk = false;
}

// فحص railway.json
console.log('\n🚂 فحص railway.json:');
try {
    if (fs.existsSync('railway.json')) {
        const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
        console.log('✅ railway.json موجود');
        
        if (railwayConfig.deploy && railwayConfig.deploy.startCommand) {
            console.log(`✅ Start command: ${railwayConfig.deploy.startCommand}`);
        }
    } else {
        console.log('⚠️ railway.json غير موجود (اختياري)');
    }
} catch (error) {
    console.log('❌ خطأ في railway.json:', error.message);
}

// النتيجة النهائية
console.log('\n' + '='.repeat(60));
if (allFilesOk) {
    console.log('🎉 جميع الملفات سليمة!');
    console.log('🎉 All files are OK!');
    
    console.log('\n🚀 خطوات حل مشكلة "Not Found":');
    console.log('🚀 Steps to fix "Not Found" issue:');
    
    console.log('\n1️⃣ تأكد من رفع الملفات لـ GitHub:');
    console.log('   git add .');
    console.log('   git commit -m "Fix deployment issues"');
    console.log('   git push origin main');
    
    console.log('\n2️⃣ في Railway Dashboard:');
    console.log('   - اذهب إلى Deployments');
    console.log('   - تأكد من نجاح آخر deployment');
    console.log('   - فحص Build Logs للأخطاء');
    
    console.log('\n3️⃣ تأكد من الرابط الصحيح:');
    console.log('   - في Railway Dashboard → Settings');
    console.log('   - انسخ الرابط الصحيح من Domains');
    
    console.log('\n4️⃣ اختبار محلي:');
    console.log('   npm start');
    console.log('   ثم زيارة: http://localhost:3000');
    
} else {
    console.log('❌ يوجد مشاكل في الملفات!');
    console.log('❌ There are issues with the files!');
    console.log('\n🔧 يرجى إصلاح المشاكل المذكورة أعلاه');
}
console.log('='.repeat(60));
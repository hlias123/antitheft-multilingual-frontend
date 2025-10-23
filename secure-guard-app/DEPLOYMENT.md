# دليل النشر - SecureGuard Pro
# Deployment Guide - SecureGuard Pro

## 📱 **متطلبات النشر**

### **Android**
- Android Studio 4.2+
- Android SDK 26+ (Android 8.0)
- Target SDK 34 (Android 14)
- Java 11+
- Gradle 7.0+

### **iOS**
- Xcode 14+
- iOS 12.0+
- Target iOS 17.0
- CocoaPods 1.11+
- Apple Developer Account

## 🔧 **إعداد البيئة**

### **1. تكوين Google Services**

#### Android:
```bash
# إضافة google-services.json إلى android/app/
# تحميل من Firebase Console
```

#### iOS:
```bash
# إضافة GoogleService-Info.plist إلى ios/SecureGuardApp/
# تحميل من Firebase Console
```

### **2. تكوين Google Maps**

#### Android:
```xml
<!-- في android/app/src/main/AndroidManifest.xml -->
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY" />
```

#### iOS:
```swift
// في AppDelegate.m
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];
  // ...
}
```

### **3. إعداد Keystore (Android)**

```bash
# إنشاء keystore للإنتاج
keytool -genkeypair -v -storetype PKCS12 -keystore secureguard-upload-key.keystore -alias secureguard-key-alias -keyalg RSA -keysize 2048 -validity 10000

# إضافة إلى gradle.properties
MYAPP_UPLOAD_STORE_FILE=secureguard-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=secureguard-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=****
MYAPP_UPLOAD_KEY_PASSWORD=****
```

## 🏗️ **بناء التطبيق**

### **Android**

#### Debug Build:
```bash
cd android
./gradlew assembleDebug
```

#### Release Build:
```bash
cd android
./gradlew assembleRelease
```

#### Bundle للـ Play Store:
```bash
cd android
./gradlew bundleRelease
```

### **iOS**

#### Debug Build:
```bash
cd ios
xcodebuild -workspace SecureGuardApp.xcworkspace -scheme SecureGuardApp -configuration Debug
```

#### Release Build:
```bash
cd ios
xcodebuild -workspace SecureGuardApp.xcworkspace -scheme SecureGuardApp -configuration Release -archivePath SecureGuardApp.xcarchive archive
```

#### Export للـ App Store:
```bash
xcodebuild -exportArchive -archivePath SecureGuardApp.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist
```

## 📦 **تحسين حجم التطبيق**

### **Android**
```gradle
// في android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
    
    // تقسيم APK حسب المعمارية
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk false
        }
    }
}
```

### **iOS**
```swift
// تحسين الصور والموارد
// استخدام Asset Catalogs
// ضغط الصور
// إزالة الموارد غير المستخدمة
```

## 🔒 **إعدادات الأمان**

### **Android Security**
```xml
<!-- network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.secureguard.app</domain>
    </domain-config>
</network-security-config>
```

### **iOS Security**
```xml
<!-- في Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>api.secureguard.app</key>
        <dict>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.2</string>
        </dict>
    </dict>
</dict>
```

## 🚀 **النشر على المتاجر**

### **Google Play Store**

#### 1. إعداد Play Console:
- إنشاء تطبيق جديد
- إضافة الوصف والصور
- تحديد الفئة والتصنيف العمري
- إعداد السياسات والخصوصية

#### 2. رفع AAB:
```bash
# بناء Android App Bundle
cd android && ./gradlew bundleRelease

# رفع إلى Play Console
# الملف: android/app/build/outputs/bundle/release/app-release.aab
```

#### 3. اختبار داخلي:
- إضافة مختبرين
- رفع النسخة للاختبار
- جمع التعليقات

### **Apple App Store**

#### 1. إعداد App Store Connect:
- إنشاء تطبيق جديد
- إضافة المعلومات والوصف
- رفع الصور والفيديوهات
- إعداد الأسعار والتوفر

#### 2. رفع IPA:
```bash
# بناء وتصدير
cd ios
xcodebuild -workspace SecureGuardApp.xcworkspace -scheme SecureGuardApp -configuration Release -archivePath SecureGuardApp.xcarchive archive

# رفع باستخدام Xcode أو Transporter
```

#### 3. مراجعة التطبيق:
- إرسال للمراجعة
- الرد على ملاحظات المراجعين
- النشر بعد الموافقة

## 🧪 **الاختبار قبل النشر**

### **اختبارات إجبارية:**
```bash
# اختبار الوظائف الأساسية
- تسجيل الدخول مع Google ✓
- نظام PIN والوصول السري ✓
- تتبع الموقع عالي الدقة ✓
- نظام الإنذار والتصوير ✓
- دعم اللغات المتعددة ✓

# اختبار الأداء
- استهلاك البطارية ✓
- استخدام الذاكرة ✓
- سرعة الاستجابة ✓

# اختبار الأمان
- تشفير البيانات ✓
- حماية من الـ Root/Jailbreak ✓
- منع لقطات الشاشة ✓
```

### **اختبار على أجهزة مختلفة:**
```
Android:
- Samsung Galaxy (مختلف الإصدارات)
- Google Pixel
- OnePlus
- Xiaomi

iOS:
- iPhone (مختلف الأحجام)
- iPad (اختياري)
```

## 📊 **مراقبة ما بعد النشر**

### **Analytics**
```javascript
// Firebase Analytics
// Crashlytics للأخطاء
// Performance Monitoring
```

### **التحديثات**
```bash
# تحديثات الأمان الدورية
# إصلاح الأخطاء
# ميزات جديدة
# تحسين الأداء
```

## 🔄 **CI/CD Pipeline**

### **GitHub Actions**
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
    
jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build Android
        run: cd android && ./gradlew bundleRelease
        
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Install CocoaPods
        run: cd ios && pod install
      - name: Build iOS
        run: cd ios && xcodebuild -workspace SecureGuardApp.xcworkspace -scheme SecureGuardApp -configuration Release
```

## 📋 **قائمة مراجعة النشر**

### **قبل النشر:**
- [ ] اختبار جميع الميزات الأساسية
- [ ] التحقق من الأذونات المطلوبة
- [ ] مراجعة سياسة الخصوصية
- [ ] اختبار على أجهزة مختلفة
- [ ] تحسين الأداء والبطارية
- [ ] مراجعة الأمان والتشفير
- [ ] إعداد التحليلات والمراقبة
- [ ] تحضير مواد التسويق

### **بعد النشر:**
- [ ] مراقبة الأخطاء والتعطل
- [ ] متابعة تقييمات المستخدمين
- [ ] تحليل الاستخدام والأداء
- [ ] التحديثات الدورية
- [ ] الدعم الفني للمستخدمين

## 🆘 **استكشاف الأخطاء**

### **مشاكل شائعة:**

#### Android:
```bash
# خطأ في التوقيع
./gradlew clean
./gradlew assembleRelease

# مشاكل الأذونات
# مراجعة AndroidManifest.xml

# مشاكل ProGuard
# تحديث proguard-rules.pro
```

#### iOS:
```bash
# مشاكل CocoaPods
cd ios && pod deintegrate && pod install

# مشاكل التوقيع
# مراجعة Signing & Capabilities في Xcode

# مشاكل البناء
# تنظيف Build Folder في Xcode
```

---

**SecureGuard Pro** - دليل النشر الشامل 🚀
// ملف التكامل مع الباك إند
// https://antitheft-backend-production.up.railway.app/

class BackendIntegration {
    constructor() {
        this.baseURL = 'https://antitheft-backend-production.up.railway.app/';
        this.currentLanguage = currentLanguage || 'ar';
    }

    // دالة عامة لإرسال الطلبات
    async makeRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': this.currentLanguage,
                ...options.headers
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(this.baseURL + endpoint, finalOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Backend request failed:', error);
            this.showError(error.message);
            throw error;
        }
    }

    // حفظ تفضيلات اللغة
    async saveLanguagePreference(language) {
        try {
            showNotification(translations[language].loading || 'Loading...');
            
            const result = await this.makeRequest('api/user/language', {
                method: 'POST',
                body: JSON.stringify({ language: language })
            });

            showNotification(translations[language].success_saved || 'Preferences saved successfully');
            return result;
        } catch (error) {
            showNotification(translations[language].error_connection || 'Connection error with server');
        }
    }

    // تحميل بيانات المستخدم
    async loadUserData() {
        try {
            const userData = await this.makeRequest(`api/user/profile?lang=${this.currentLanguage}`);
            return userData;
        } catch (error) {
            console.error('Failed to load user data:', error);
            return null;
        }
    }

    // تحميل إحصائيات النظام
    async loadSystemStats() {
        try {
            const stats = await this.makeRequest(`api/stats?lang=${this.currentLanguage}`);
            this.updateStatsDisplay(stats);
            return stats;
        } catch (error) {
            console.error('Failed to load system stats:', error);
            return null;
        }
    }

    // تحديث عرض الإحصائيات
    updateStatsDisplay(stats) {
        if (!stats) return;

        // تحديث عدد الأجهزة المحمية
        const devicesElement = document.getElementById('protected-devices');
        if (devicesElement && stats.protectedDevices) {
            devicesElement.textContent = stats.protectedDevices.toLocaleString();
        }

        // تحديث عدد التنبيهات
        const alertsElement = document.getElementById('active-alerts');
        if (alertsElement && stats.activeAlerts) {
            alertsElement.textContent = stats.activeAlerts.toLocaleString();
        }

        // تحديث معدل الاستجابة
        const responseElement = document.getElementById('response-time');
        if (responseElement && stats.averageResponseTime) {
            responseElement.textContent = stats.averageResponseTime + 'ms';
        }
    }

    // إرسال تقرير حادثة
    async reportIncident(incidentData) {
        try {
            showNotification(translations[this.currentLanguage].loading || 'Loading...');
            
            const result = await this.makeRequest('api/incidents/report', {
                method: 'POST',
                body: JSON.stringify({
                    ...incidentData,
                    language: this.currentLanguage,
                    timestamp: new Date().toISOString()
                })
            });

            showNotification('تم إرسال التقرير بنجاح' || 'Report sent successfully');
            return result;
        } catch (error) {
            showNotification('فشل في إرسال التقرير' || 'Failed to send report');
        }
    }

    // تحميل التنبيهات الحديثة
    async loadRecentAlerts() {
        try {
            const alerts = await this.makeRequest(`api/alerts/recent?lang=${this.currentLanguage}&limit=5`);
            this.displayAlerts(alerts);
            return alerts;
        } catch (error) {
            console.error('Failed to load recent alerts:', error);
            return [];
        }
    }

    // عرض التنبيهات
    displayAlerts(alerts) {
        const alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer || !alerts.length) return;

        alertsContainer.innerHTML = '';
        
        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert alert-${alert.severity}`;
            alertElement.innerHTML = `
                <div class="alert-icon">${this.getAlertIcon(alert.type)}</div>
                <div class="alert-content">
                    <h4>${alert.title}</h4>
                    <p>${alert.message}</p>
                    <small>${new Date(alert.timestamp).toLocaleString()}</small>
                </div>
            `;
            alertsContainer.appendChild(alertElement);
        });
    }

    // الحصول على أيقونة التنبيه
    getAlertIcon(type) {
        const icons = {
            'theft': '🚨',
            'movement': '📍',
            'battery': '🔋',
            'connection': '📶',
            'security': '🔒'
        };
        return icons[type] || '⚠️';
    }

    // عرض رسائل الخطأ
    showError(message) {
        const errorText = this.currentLanguage === 'ar' 
            ? 'حدث خطأ: ' + message 
            : 'Error: ' + message;
        
        showNotification(errorText);
    }

    // تحديث اللغة
    setLanguage(language) {
        this.currentLanguage = language;
    }

    // توجيه للنظام الكامل
    redirectToFullSystem() {
        showNotification(translations[this.currentLanguage].redirecting || 'Redirecting to system...');
        
        setTimeout(() => {
            window.open(this.baseURL + `?lang=${this.currentLanguage}`, '_blank');
        }, 1000);
    }
}

// إنشاء مثيل عام للاستخدام
const backendAPI = new BackendIntegration();

// تحديث اللغة عند تغييرها
window.addEventListener('languageChanged', function(event) {
    backendAPI.setLanguage(event.detail.language);
});

// تصدير للاستخدام العام
window.backendAPI = backendAPI;
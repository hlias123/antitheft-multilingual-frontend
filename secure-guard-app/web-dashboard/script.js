// Global variables
let map;
let deviceMarker;
let locationHistory = [];
let isTracking = true;
let websocket;
let currentDeviceData = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeWebSocket();
    loadInitialData();
    startPeriodicUpdates();
});

// Initialize Leaflet map
function initializeMap() {
    // Default location (Riyadh, Saudi Arabia)
    const defaultLat = 24.7136;
    const defaultLng = 46.6753;
    
    map = L.map('map').setView([defaultLat, defaultLng], 13);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add device marker
    deviceMarker = L.marker([defaultLat, defaultLng], {
        icon: L.divIcon({
            className: 'device-marker',
            html: '<div style="background: #4285f4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        })
    }).addTo(map);
    
    // Add popup to marker
    deviceMarker.bindPopup('الموقع الحالي للجهاز');
}

// Initialize WebSocket connection
function initializeWebSocket() {
    const wsUrl = 'wss://api.secureguard.app/ws'; // Replace with actual WebSocket URL
    
    try {
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = function(event) {
            console.log('WebSocket connected');
            updateConnectionStatus(true);
            showNotification('تم الاتصال بالخادم بنجاح', 'success');
        };
        
        websocket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        websocket.onclose = function(event) {
            console.log('WebSocket disconnected');
            updateConnectionStatus(false);
            showNotification('انقطع الاتصال بالخادم', 'error');
            
            // Attempt to reconnect after 5 seconds
            setTimeout(initializeWebSocket, 5000);
        };
        
        websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
            showNotification('خطأ في الاتصال', 'error');
        };
    } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        updateConnectionStatus(false);
    }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'location_update':
            updateDeviceLocation(data.location);
            break;
        case 'device_status':
            updateDeviceStatus(data.status);
            break;
        case 'alert':
            handleAlert(data.alert);
            break;
        case 'photo_captured':
            addNewPhoto(data.photo);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Load initial data
async function loadInitialData() {
    showLoading(true);
    
    try {
        // Load device status
        await loadDeviceStatus();
        
        // Load location history
        await loadLocationHistory();
        
        // Load recent photos
        await loadRecentPhotos();
        
        // Load alerts history
        await loadAlertsHistory();
        
    } catch (error) {
        console.error('Failed to load initial data:', error);
        showNotification('فشل في تحميل البيانات', 'error');
    } finally {
        showLoading(false);
    }
}

// Load device status
async function loadDeviceStatus() {
    try {
        const response = await fetch('/api/device/status', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDeviceStatus(data);
        }
    } catch (error) {
        console.error('Failed to load device status:', error);
    }
}

// Update device status
function updateDeviceStatus(status) {
    currentDeviceData = status;
    
    // Update status indicator
    const deviceStatus = document.getElementById('deviceStatus');
    const statusIndicator = deviceStatus.querySelector('.status-indicator');
    const statusText = deviceStatus.querySelector('span:last-child');
    
    if (status.isOnline) {
        statusIndicator.className = 'status-indicator online';
        statusText.textContent = 'متصل';
    } else {
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'غير متصل';
    }
    
    // Update status values
    document.getElementById('lastUpdate').textContent = formatTimeAgo(new Date(status.lastUpdate));
    document.getElementById('batteryLevel').textContent = `${Math.round(status.batteryLevel * 100)}%`;
    document.getElementById('gpsAccuracy').textContent = `${status.gpsAccuracy} متر`;
    document.getElementById('networkType').textContent = status.networkType;
}

// Update device location
function updateDeviceLocation(location) {
    const lat = location.latitude;
    const lng = location.longitude;
    
    // Update marker position
    deviceMarker.setLatLng([lat, lng]);
    
    // Update coordinates display
    document.getElementById('coordinates').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    document.getElementById('address').textContent = location.address || 'جاري تحديد العنوان...';
    
    // Add to location history
    locationHistory.unshift({
        ...location,
        timestamp: new Date(location.timestamp)
    });
    
    // Keep only last 100 locations
    if (locationHistory.length > 100) {
        locationHistory = locationHistory.slice(0, 100);
    }
    
    // Update history display
    updateLocationHistoryDisplay();
    
    // Center map if tracking is enabled
    if (isTracking) {
        map.setView([lat, lng], map.getZoom());
    }
}

// Load location history
async function loadLocationHistory() {
    try {
        const timeFilter = document.getElementById('timeFilter').value;
        const response = await fetch(`/api/location/history?period=${timeFilter}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            locationHistory = data.map(loc => ({
                ...loc,
                timestamp: new Date(loc.timestamp)
            }));
            updateLocationHistoryDisplay();
        }
    } catch (error) {
        console.error('Failed to load location history:', error);
    }
}

// Update location history display
function updateLocationHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    locationHistory.slice(0, 20).forEach(location => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        item.innerHTML = `
            <div>
                <div class="history-location">${location.address || 'عنوان غير معروف'}</div>
                <div class="history-time">${formatDateTime(location.timestamp)}</div>
            </div>
            <div class="history-accuracy">±${location.accuracy}م</div>
        `;
        
        historyList.appendChild(item);
    });
}

// Load recent photos
async function loadRecentPhotos() {
    try {
        const response = await fetch('/api/photos/recent?limit=8', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const photos = await response.json();
            updatePhotosDisplay(photos);
        }
    } catch (error) {
        console.error('Failed to load recent photos:', error);
    }
}

// Update photos display
function updatePhotosDisplay(photos) {
    const photosGrid = document.getElementById('photosGrid');
    photosGrid.innerHTML = '';
    
    photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.onclick = () => showPhotoModal(photo);
        
        item.innerHTML = `
            <img src="${photo.url}" alt="صورة" loading="lazy">
            <div class="photo-overlay">
                <div>${formatDateTime(new Date(photo.timestamp))}</div>
                <div>${photo.camera === 'front' ? 'كاميرا أمامية' : 'كاميرا خلفية'}</div>
            </div>
        `;
        
        photosGrid.appendChild(item);
    });
}

// Add new photo
function addNewPhoto(photo) {
    const photosGrid = document.getElementById('photosGrid');
    
    // Remove last photo if we have 8 photos
    if (photosGrid.children.length >= 8) {
        photosGrid.removeChild(photosGrid.lastChild);
    }
    
    // Add new photo at the beginning
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.onclick = () => showPhotoModal(photo);
    
    item.innerHTML = `
        <img src="${photo.url}" alt="صورة" loading="lazy">
        <div class="photo-overlay">
            <div>${formatDateTime(new Date(photo.timestamp))}</div>
            <div>${photo.camera === 'front' ? 'كاميرا أمامية' : 'كاميرا خلفية'}</div>
        </div>
    `;
    
    photosGrid.insertBefore(item, photosGrid.firstChild);
    
    // Show notification
    showNotification('تم التقاط صورة جديدة', 'info');
}

// Load alerts history
async function loadAlertsHistory() {
    try {
        const response = await fetch('/api/alerts/history?limit=10', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const alerts = await response.json();
            updateAlertsDisplay(alerts);
        }
    } catch (error) {
        console.error('Failed to load alerts history:', error);
    }
}

// Update alerts display
function updateAlertsDisplay(alerts) {
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';
    
    alerts.forEach(alert => {
        const item = document.createElement('div');
        item.className = 'alert-item';
        
        const alertIcon = getAlertIcon(alert.type);
        const alertTitle = getAlertTitle(alert.type);
        
        item.innerHTML = `
            <div class="alert-icon">${alertIcon}</div>
            <div class="alert-content">
                <div class="alert-title">${alertTitle}</div>
                <div class="alert-time">${formatDateTime(new Date(alert.timestamp))}</div>
            </div>
            <div class="alert-status ${alert.isResolved ? 'resolved' : 'active'}">
                ${alert.isResolved ? 'تم الحل' : 'نشط'}
            </div>
        `;
        
        alertsList.appendChild(item);
    });
}

// Handle new alert
function handleAlert(alert) {
    // Add to alerts display
    const alertsList = document.getElementById('alertsList');
    const item = document.createElement('div');
    item.className = 'alert-item';
    
    const alertIcon = getAlertIcon(alert.type);
    const alertTitle = getAlertTitle(alert.type);
    
    item.innerHTML = `
        <div class="alert-icon">${alertIcon}</div>
        <div class="alert-content">
            <div class="alert-title">${alertTitle}</div>
            <div class="alert-time">${formatDateTime(new Date(alert.timestamp))}</div>
        </div>
        <div class="alert-status active">نشط</div>
    `;
    
    alertsList.insertBefore(item, alertsList.firstChild);
    
    // Show notification
    showNotification(`تنبيه جديد: ${alertTitle}`, 'warning');
    
    // Update device location if available
    if (alert.location) {
        updateDeviceLocation(alert.location);
    }
}

// Control functions
async function activateAlarm() {
    if (confirm('هل أنت متأكد من تفعيل الإنذار؟')) {
        showLoading(true);
        
        try {
            const response = await fetch('/api/device/activate-alarm', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                showNotification('تم تفعيل الإنذار بنجاح', 'success');
            } else {
                throw new Error('Failed to activate alarm');
            }
        } catch (error) {
            console.error('Failed to activate alarm:', error);
            showNotification('فشل في تفعيل الإنذار', 'error');
        } finally {
            showLoading(false);
        }
    }
}

async function locateDevice() {
    showLoading(true);
    
    try {
        const response = await fetch('/api/device/locate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const location = await response.json();
            updateDeviceLocation(location);
            showNotification('تم تحديث الموقع بنجاح', 'success');
        } else {
            throw new Error('Failed to locate device');
        }
    } catch (error) {
        console.error('Failed to locate device:', error);
        showNotification('فشل في تحديد الموقع', 'error');
    } finally {
        showLoading(false);
    }
}

async function capturePhoto() {
    showLoading(true);
    
    try {
        const response = await fetch('/api/device/capture-photo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            showNotification('تم طلب التقاط الصورة', 'success');
        } else {
            throw new Error('Failed to capture photo');
        }
    } catch (error) {
        console.error('Failed to capture photo:', error);
        showNotification('فشل في التقاط الصورة', 'error');
    } finally {
        showLoading(false);
    }
}

async function lockDevice() {
    if (confirm('هل أنت متأكد من قفل الجهاز؟')) {
        showLoading(true);
        
        try {
            const response = await fetch('/api/device/lock', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            
            if (response.ok) {
                showNotification('تم قفل الجهاز بنجاح', 'success');
            } else {
                throw new Error('Failed to lock device');
            }
        } catch (error) {
            console.error('Failed to lock device:', error);
            showNotification('فشل في قفل الجهاز', 'error');
        } finally {
            showLoading(false);
        }
    }
}

// Map functions
function centerMap() {
    if (currentDeviceData && currentDeviceData.location) {
        const { latitude, longitude } = currentDeviceData.location;
        map.setView([latitude, longitude], 15);
    }
}

function toggleTracking() {
    isTracking = !isTracking;
    const trackingText = document.getElementById('trackingText');
    trackingText.textContent = isTracking ? 'إيقاف التتبع' : 'تفعيل التتبع';
    
    if (isTracking) {
        centerMap();
    }
}

// Modal functions
function showPhotoModal(photo) {
    const modal = document.getElementById('photoModal');
    const modalPhoto = document.getElementById('modalPhoto');
    const photoDate = document.getElementById('photoDate');
    const photoLocation = document.getElementById('photoLocation');
    const photoCamera = document.getElementById('photoCamera');
    
    modalPhoto.src = photo.url;
    photoDate.textContent = formatDateTime(new Date(photo.timestamp));
    photoLocation.textContent = photo.location?.address || 'موقع غير معروف';
    photoCamera.textContent = photo.camera === 'front' ? 'كاميرا أمامية' : 'كاميرا خلفية';
    
    modal.classList.add('show');
}

function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    modal.classList.remove('show');
}

function viewAllPhotos() {
    // This would open a dedicated photos page
    showNotification('سيتم إضافة صفحة عرض جميع الصور قريباً', 'info');
}

// Filter functions
function filterHistory() {
    loadLocationHistory();
}

// Utility functions
function updateConnectionStatus(isConnected) {
    const connectionStatus = document.getElementById('connectionStatus');
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.querySelector('.status-text');
    
    if (isConnected) {
        connectionStatus.style.background = 'rgba(76, 175, 80, 0.2)';
        connectionStatus.style.borderColor = 'rgba(76, 175, 80, 0.3)';
        statusDot.style.background = '#4caf50';
        statusText.textContent = 'متصل';
    } else {
        connectionStatus.style.background = 'rgba(244, 67, 54, 0.2)';
        connectionStatus.style.borderColor = 'rgba(244, 67, 54, 0.3)';
        statusDot.style.background = '#f44336';
        statusText.textContent = 'غير متصل';
    }
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (show) {
        loadingOverlay.classList.add('show');
    } else {
        loadingOverlay.classList.remove('show');
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function formatDateTime(date) {
    return date.toLocaleString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
        return `منذ ${diffSecs} ثانية`;
    } else if (diffMins < 60) {
        return `منذ ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
        return `منذ ${diffHours} ساعة`;
    } else {
        return `منذ ${diffDays} يوم`;
    }
}

function getAlertIcon(type) {
    switch (type) {
        case 'theft_attempt':
            return '🚨';
        case 'unauthorized_access':
            return '🔒';
        case 'manual_trigger':
            return '📱';
        default:
            return '⚠️';
    }
}

function getAlertTitle(type) {
    switch (type) {
        case 'theft_attempt':
            return 'محاولة سرقة';
        case 'unauthorized_access':
            return 'وصول غير مصرح';
        case 'manual_trigger':
            return 'تفعيل يدوي';
        default:
            return 'تنبيه';
    }
}

function getAuthToken() {
    // This should get the actual auth token from localStorage or cookies
    return localStorage.getItem('authToken') || 'demo-token';
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
    }
}

// Start periodic updates
function startPeriodicUpdates() {
    // Update device status every 30 seconds
    setInterval(loadDeviceStatus, 30000);
    
    // Update time displays every minute
    setInterval(() => {
        if (currentDeviceData) {
            document.getElementById('lastUpdate').textContent = 
                formatTimeAgo(new Date(currentDeviceData.lastUpdate));
        }
    }, 60000);
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible, refresh data
        loadDeviceStatus();
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (map) {
        map.invalidateSize();
    }
});

// Close modal when clicking outside
document.getElementById('photoModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closePhotoModal();
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePhotoModal();
    }
});
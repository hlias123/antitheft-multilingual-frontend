import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { RootState } from '@/store';
import { startLocationTracking, getCurrentLocation } from '@/store/slices/locationSlice';
import { activateAlarm } from '@/store/slices/alarmSlice';
import LocationService from '@/services/LocationService';
import AlarmService from '@/services/AlarmService';
import CameraService from '@/services/CameraService';
import SecurityService from '@/services/SecurityService';
import PerformanceService from '@/services/PerformanceService';
import { formatTimeAgo } from '@/utils/helpers';

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const MainScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentLocation, isTracking, locationHistory } = useSelector((state: RootState) => state.location);
  const { isActive: isAlarmActive } = useSelector((state: RootState) => state.alarm);
  const settings = useSelector((state: RootState) => state.settings);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<'secure' | 'at_risk' | 'unknown'>('unknown');
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    initializeMainScreen();
  }, []);

  // Initialize main screen
  const initializeMainScreen = async () => {
    try {
      // Start location tracking if not already started
      if (!isTracking) {
        dispatch(startLocationTracking());
      }
      
      // Get current location
      dispatch(getCurrentLocation());
      
      // Check security status
      await checkSecurityStatus();
      
      // Get performance data
      await getPerformanceData();
      
    } catch (error) {
      console.error('Main screen initialization failed:', error);
    }
  };

  // Check security status
  const checkSecurityStatus = async () => {
    try {
      const results = await SecurityService.performSecurityChecks();
      setSecurityStatus(results.isSecure ? 'secure' : 'at_risk');
    } catch (error) {
      console.error('Security check failed:', error);
      setSecurityStatus('unknown');
    }
  };

  // Get performance data
  const getPerformanceData = async () => {
    try {
      const report = await PerformanceService.getPerformanceReport();
      setPerformanceData(report);
    } catch (error) {
      console.error('Performance data fetch failed:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await initializeMainScreen();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle emergency alarm
  const handleEmergencyAlarm = () => {
    Alert.alert(
      t('alarm.activate'),
      'هل أنت متأكد من تفعيل الإنذار الطارئ؟',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('alarm.activate'),
          style: 'destructive',
          onPress: () => {
            dispatch(activateAlarm('manual_trigger'));
          },
        },
      ]
    );
  };

  // Handle test photo capture
  const handleTestPhoto = async () => {
    try {
      const photo = await CameraService.capturePhoto('front');
      if (photo) {
        Alert.alert(t('common.success'), t('camera.photoSaved'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('camera.cameraNotAvailable'));
    }
  };

  // Get security status color
  const getSecurityStatusColor = () => {
    switch (securityStatus) {
      case 'secure':
        return '#4caf50';
      case 'at_risk':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  // Get security status text
  const getSecurityStatusText = () => {
    switch (securityStatus) {
      case 'secure':
        return 'آمن';
      case 'at_risk':
        return 'في خطر';
      default:
        return 'غير معروف';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>مرحباً، {user?.name || 'المستخدم'}</Text>
          <Text style={styles.statusText}>
            {isAlarmActive ? '🚨 الإنذار نشط' : '🛡️ التطبيق يعمل'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#4285f4"
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.emergencyButton]}
              onPress={handleEmergencyAlarm}
            >
              <Text style={styles.actionIcon}>🚨</Text>
              <Text style={styles.actionText}>إنذار طارئ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.photoButton]}
              onPress={handleTestPhoto}
            >
              <Text style={styles.actionIcon}>📸</Text>
              <Text style={styles.actionText}>التقاط صورة</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.mapButton]}
              onPress={() => navigation.navigate('Map')}
            >
              <Text style={styles.actionIcon}>🗺️</Text>
              <Text style={styles.actionText}>عرض الخريطة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حالة النظام</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>حالة الأمان:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getSecurityStatusColor() }]}>
                <Text style={styles.statusBadgeText}>{getSecurityStatusText()}</Text>
              </View>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>تتبع الموقع:</Text>
              <View style={[styles.statusBadge, { backgroundColor: isTracking ? '#4caf50' : '#f44336' }]}>
                <Text style={styles.statusBadgeText}>{isTracking ? 'نشط' : 'متوقف'}</Text>
              </View>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>البطارية:</Text>
              <Text style={styles.statusValue}>
                {performanceData ? `${Math.round(performanceData.batteryLevel * 100)}%` : '--'}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>آخر موقع:</Text>
              <Text style={styles.statusValue}>
                {currentLocation ? formatTimeAgo(currentLocation.timestamp) : 'غير متوفر'}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Info */}
        {currentLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الموقع الحالي</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>الإحداثيات:</Text>
                <Text style={styles.locationValue}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              </View>
              
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>الدقة:</Text>
                <Text style={styles.locationValue}>±{currentLocation.accuracy}م</Text>
              </View>
              
              {currentLocation.address && (
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>العنوان:</Text>
                  <Text style={styles.locationValue}>{currentLocation.address}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>النشاط الأخير</Text>
          <View style={styles.activityCard}>
            {locationHistory.slice(0, 5).map((location, index) => (
              <View key={location.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text>📍</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {location.address || 'موقع غير معروف'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatTimeAgo(location.timestamp)}
                  </Text>
                </View>
                <Text style={styles.activityAccuracy}>±{location.accuracy}م</Text>
              </View>
            ))}
            
            {locationHistory.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>لا يوجد نشاط حديث</Text>
              </View>
            )}
          </View>
        </View>

        {/* Performance Info */}
        {performanceData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات الأداء</Text>
            <View style={styles.performanceCard}>
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>وضع توفير الطاقة:</Text>
                <Text style={styles.performanceValue}>
                  {performanceData.lowPowerMode ? 'مفعل' : 'معطل'}
                </Text>
              </View>
              
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>تحديثات الموقع:</Text>
                <Text style={styles.performanceValue}>
                  {performanceData.locationUpdates}
                </Text>
              </View>
              
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>الصور المعالجة:</Text>
                <Text style={styles.performanceValue}>
                  {performanceData.photosProcessed}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Settings Shortcut */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.settingsCardContent}>
              <Text style={styles.settingsCardIcon}>⚙️</Text>
              <View style={styles.settingsCardText}>
                <Text style={styles.settingsCardTitle}>الإعدادات</Text>
                <Text style={styles.settingsCardDesc}>
                  تخصيص إعدادات الأمان والحماية
                </Text>
              </View>
              <Text style={styles.settingsCardArrow}>←</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  emergencyButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  photoButton: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderColor: 'rgba(156, 39, 176, 0.3)',
  },
  mapButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  statusValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    flex: 1,
  },
  locationValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  activityAccuracy: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  performanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  performanceValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsCardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingsCardText: {
    flex: 1,
  },
  settingsCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingsCardDesc: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  settingsCardArrow: {
    color: '#4285f4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 50,
  },
});

export default MainScreen;
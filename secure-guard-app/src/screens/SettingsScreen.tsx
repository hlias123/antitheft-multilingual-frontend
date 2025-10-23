import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { RootState } from '@/store';
import { updateSetting, updatePIN } from '@/store/slices/settingsSlice';
import { logoutUser, updateUser } from '@/store/slices/authSlice';
import TranslationService from '@/services/TranslationService';
import AuthService from '@/services/AuthService';
import AlarmService from '@/services/AlarmService';

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Settings'
>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const settings = useSelector((state: RootState) => state.settings);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Handle setting change
  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    try {
      dispatch(updateSetting({ key, value }));
      
      // Apply language change immediately
      if (key === 'language') {
        await TranslationService.changeLanguage(value);
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert(t('common.error'), t('errors.unknownError'));
    }
  };

  // Handle PIN change
  const handlePINChange = () => {
    Alert.prompt(
      t('pin.changePin'),
      t('pin.newPin'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.save'),
          onPress: async (newPIN) => {
            if (newPIN && newPIN.length === 4 && /^\d+$/.test(newPIN)) {
              try {
                dispatch(updatePIN(newPIN));
                Alert.alert(t('common.success'), t('pin.pinChanged'));
              } catch (error) {
                Alert.alert(t('common.error'), t('errors.unknownError'));
              }
            } else {
              Alert.alert(t('common.error'), 'PIN must be 4 digits');
            }
          },
        },
      ],
      'secure-text'
    );
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await AuthService.signOut();
              dispatch(logoutUser());
              navigation.navigate('Login');
            } catch (error) {
              Alert.alert(t('common.error'), t('errors.unknownError'));
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Test alarm
  const handleTestAlarm = () => {
    Alert.alert(
      t('alarm.testAlarm'),
      t('alarm.alarmTest'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.continue'),
          onPress: async () => {
            try {
              await AlarmService.testAlarm(5000);
            } catch (error) {
              Alert.alert(t('common.error'), t('errors.unknownError'));
            }
          },
        },
      ]
    );
  };

  // Language selection modal
  const showLanguageSelection = () => {
    const languages = TranslationService.getSupportedLanguages();
    
    Alert.alert(
      t('settings.language'),
      undefined,
      [
        ...languages.slice(0, 10).map(lang => ({
          text: `${lang.nativeName} (${lang.name})`,
          onPress: () => handleSettingChange('language', lang.code),
        })),
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.settings')}</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        {user && (
          <View style={styles.section}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                {user.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>👤</Text>
                )}
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.verificationBadge}>
                  <Text style={styles.verificationText}>
                    {user.isEmailVerified ? '✓ تم التحقق' : '⚠️ لم يتم التحقق'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePINChange}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.pinSecurity')}</Text>
              <Text style={styles.settingDesc}>تغيير رمز الحماية المكون من 4 أرقام</Text>
            </View>
            <Text style={styles.settingAction}>تغيير</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.secretAccess')}</Text>
              <Text style={styles.settingDesc}>{t('settings.secretAccessDesc')}</Text>
            </View>
            <Switch
              value={settings.secretAccessEnabled}
              onValueChange={(value) => handleSettingChange('secretAccessEnabled', value)}
              trackColor={{ false: '#767577', true: '#4285f4' }}
              thumbColor={settings.secretAccessEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Location Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.location')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.locationAccuracy')}</Text>
              <Text style={styles.settingDesc}>دقة عالية (أقل من 3 أمتار)</Text>
            </View>
            <TouchableOpacity
              style={styles.settingSelect}
              onPress={() => {
                Alert.alert(
                  t('settings.locationAccuracy'),
                  undefined,
                  [
                    { text: 'دقة عالية', onPress: () => handleSettingChange('gpsAccuracy', 'high') },
                    { text: 'دقة متوسطة', onPress: () => handleSettingChange('gpsAccuracy', 'medium') },
                    { text: 'دقة منخفضة', onPress: () => handleSettingChange('gpsAccuracy', 'low') },
                    { text: t('common.cancel'), style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={styles.selectText}>
                {settings.gpsAccuracy === 'high' ? 'دقة عالية' :
                 settings.gpsAccuracy === 'medium' ? 'دقة متوسطة' : 'دقة منخفضة'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.updateInterval')}</Text>
              <Text style={styles.settingDesc}>تكرار تحديث الموقع</Text>
            </View>
            <TouchableOpacity
              style={styles.settingSelect}
              onPress={() => {
                Alert.alert(
                  t('settings.updateInterval'),
                  undefined,
                  [
                    { text: 'كل 10 ثوانٍ', onPress: () => handleSettingChange('locationUpdateInterval', 10000) },
                    { text: 'كل 30 ثانية', onPress: () => handleSettingChange('locationUpdateInterval', 30000) },
                    { text: 'كل دقيقة', onPress: () => handleSettingChange('locationUpdateInterval', 60000) },
                    { text: t('common.cancel'), style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={styles.selectText}>
                {settings.locationUpdateInterval === 10000 ? 'كل 10 ثوانٍ' :
                 settings.locationUpdateInterval === 30000 ? 'كل 30 ثانية' : 'كل دقيقة'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alarm Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.alarmSettings')}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.customAlarmSound')}</Text>
              <Text style={styles.settingDesc}>اختيار نغمة إنذار مخصصة</Text>
            </View>
            <Text style={styles.settingAction}>اختيار</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.vibrationIntensity')}</Text>
              <Text style={styles.settingDesc}>شدة الاهتزاز</Text>
            </View>
            <TouchableOpacity
              style={styles.settingSelect}
              onPress={() => {
                Alert.alert(
                  t('settings.vibrationIntensity'),
                  undefined,
                  [
                    { text: 'خفيف', onPress: () => handleSettingChange('vibrationIntensity', 0.5) },
                    { text: 'متوسط', onPress: () => handleSettingChange('vibrationIntensity', 1.0) },
                    { text: 'قوي', onPress: () => handleSettingChange('vibrationIntensity', 1.5) },
                    { text: t('common.cancel'), style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={styles.selectText}>
                {settings.vibrationIntensity <= 0.5 ? 'خفيف' :
                 settings.vibrationIntensity <= 1.0 ? 'متوسط' : 'قوي'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleTestAlarm}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('alarm.testAlarm')}</Text>
              <Text style={styles.settingDesc}>اختبار نظام الإنذار</Text>
            </View>
            <Text style={styles.settingAction}>اختبار</Text>
          </TouchableOpacity>
        </View>

        {/* Language Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={showLanguageSelection}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.language')}</Text>
              <Text style={styles.settingDesc}>تغيير لغة التطبيق</Text>
            </View>
            <Text style={styles.settingAction}>
              {TranslationService.getSupportedLanguages()
                .find(lang => lang.code === settings.language)?.nativeName || 'العربية'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('app.name')}</Text>
              <Text style={styles.settingDesc}>{t('app.description')}</Text>
            </View>
            <Text style={styles.settingValue}>v1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>شروط الاستخدام</Text>
              <Text style={styles.settingDesc}>اقرأ شروط وأحكام الاستخدام</Text>
            </View>
            <Text style={styles.settingAction}>عرض</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>سياسة الخصوصية</Text>
              <Text style={styles.settingDesc}>اقرأ سياسة الخصوصية</Text>
            </View>
            <Text style={styles.settingAction}>عرض</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>منطقة الخطر</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={() => {
              Alert.alert(
                'مسح جميع البيانات',
                'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: 'مسح',
                    style: 'destructive',
                    onPress: () => {
                      // Clear all data logic here
                      Alert.alert('تم', 'تم مسح جميع البيانات');
                    },
                  },
                ]
              );
            }}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, styles.dangerText]}>مسح جميع البيانات</Text>
              <Text style={styles.settingDesc}>مسح جميع البيانات المحفوظة</Text>
            </View>
            <Text style={[styles.settingAction, styles.dangerText]}>مسح</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  logoutButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 8,
  },
  verificationBadge: {
    alignSelf: 'flex-start',
  },
  verificationText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDesc: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 18,
  },
  settingAction: {
    color: '#4285f4',
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  settingSelect: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  dangerSection: {
    marginTop: 40,
  },
  dangerTitle: {
    color: '#f44336',
  },
  dangerItem: {
    borderColor: 'rgba(244, 67, 54, 0.3)',
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
  },
  dangerText: {
    color: '#f44336',
  },
  bottomSpacing: {
    height: 50,
  },
});

export default SettingsScreen;
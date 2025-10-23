import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { updateUser } from '@/store/slices/authSlice';
import AuthService from '@/services/AuthService';

type EmailVerificationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EmailVerification'
>;

type EmailVerificationScreenRouteProp = RouteProp<
  RootStackParamList,
  'EmailVerification'
>;

const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation<EmailVerificationScreenNavigationProp>();
  const route = useRoute<EmailVerificationScreenRouteProp>();
  const dispatch = useDispatch();
  
  const { email } = route.params;
  
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkAttempts, setCheckAttempts] = useState(0);
  
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const cooldownInterval = useRef<NodeJS.Timeout | null>(null);

  // Disable back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back navigation
    });

    return () => backHandler.remove();
  }, []);

  // Auto-check verification status
  useEffect(() => {
    startAutoCheck();
    
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
      if (cooldownInterval.current) {
        clearInterval(cooldownInterval.current);
      }
    };
  }, []);

  // Start auto-checking verification status
  const startAutoCheck = () => {
    checkInterval.current = setInterval(() => {
      checkVerificationStatus(true);
    }, 5000); // Check every 5 seconds
  };

  // Check verification status
  const checkVerificationStatus = async (isAutoCheck = false) => {
    if (!isAutoCheck) {
      setIsChecking(true);
    }
    
    try {
      const isVerified = await AuthService.checkEmailVerification(email);
      
      if (isVerified) {
        // Update user verification status
        dispatch(updateUser({ isEmailVerified: true }));
        
        // Stop auto-checking
        if (checkInterval.current) {
          clearInterval(checkInterval.current);
        }
        
        // Show success message and navigate
        Alert.alert(
          'تم التأكيد بنجاح',
          'تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن استخدام التطبيق.',
          [
            {
              text: 'متابعة',
              onPress: () => navigation.navigate('Main'),
            },
          ]
        );
      } else {
        const newAttempts = checkAttempts + 1;
        setCheckAttempts(newAttempts);
        
        if (!isAutoCheck && newAttempts >= 3) {
          Alert.alert(
            'لم يتم التأكيد بعد',
            'يرجى التحقق من بريدك الإلكتروني والنقر على رابط التأكيد. قد يستغرق الأمر بضع دقائق.',
            [{ text: 'موافق' }]
          );
        }
      }
    } catch (error) {
      console.error('Verification check error:', error);
      if (!isAutoCheck) {
        Alert.alert(
          'خطأ',
          'حدث خطأ في التحقق من حالة البريد الإلكتروني. يرجى المحاولة مرة أخرى.',
          [{ text: 'موافق' }]
        );
      }
    } finally {
      if (!isAutoCheck) {
        setIsChecking(false);
      }
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (resendCooldown > 0) {
      return;
    }
    
    setIsResending(true);
    
    try {
      await AuthService.resendVerificationEmail(email);
      
      // Start cooldown
      setResendCooldown(60); // 60 seconds cooldown
      cooldownInterval.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            if (cooldownInterval.current) {
              clearInterval(cooldownInterval.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      Alert.alert(
        'تم الإرسال',
        'تم إعادة إرسال بريد التأكيد. يرجى التحقق من بريدك الإلكتروني.',
        [{ text: 'موافق' }]
      );
    } catch (error) {
      console.error('Resend verification error:', error);
      Alert.alert(
        'خطأ',
        'فشل في إعادة إرسال بريد التأكيد. يرجى المحاولة مرة أخرى لاحقاً.',
        [{ text: 'موافق' }]
      );
    } finally {
      setIsResending(false);
    }
  };

  // Skip verification (for development/testing)
  const skipVerification = () => {
    Alert.alert(
      'تخطي التأكيد',
      'هل أنت متأكد من أنك تريد تخطي تأكيد البريد الإلكتروني؟ قد تفقد بعض الميزات.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تخطي',
          style: 'destructive',
          onPress: () => {
            dispatch(updateUser({ isEmailVerified: true }));
            navigation.navigate('Main');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={true}
      />
      
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📧</Text>
        </View>
        
        {/* Header */}
        <Text style={styles.title}>تأكيد البريد الإلكتروني</Text>
        <Text style={styles.subtitle}>
          تم إرسال رابط التأكيد إلى:
        </Text>
        <Text style={styles.email}>{email}</Text>
        
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            يرجى فتح بريدك الإلكتروني والنقر على رابط التأكيد
          </Text>
          <Text style={styles.instructionSubtext}>
            قد يستغرق الأمر بضع دقائق للوصول
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Check Verification Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isChecking && styles.disabledButton]}
            onPress={() => checkVerificationStatus(false)}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            {isChecking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>تم التأكيد</Text>
            )}
          </TouchableOpacity>
          
          {/* Resend Button */}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (isResending || resendCooldown > 0) && styles.disabledButton,
            ]}
            onPress={resendVerificationEmail}
            disabled={isResending || resendCooldown > 0}
            activeOpacity={0.8}
          >
            {isResending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {resendCooldown > 0
                  ? `إعادة الإرسال (${resendCooldown})`
                  : 'إعادة الإرسال'
                }
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Auto-check indicator */}
        <View style={styles.autoCheckIndicator}>
          <View style={styles.pulsingDot} />
          <Text style={styles.autoCheckText}>
            يتم التحقق تلقائياً كل 5 ثوانٍ
          </Text>
        </View>
        
        {/* Skip button (for development) */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={skipVerification}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>تخطي (للتطوير)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  icon: {
    fontSize: 50,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  email: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  instructions: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  instructionSubtext: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 56,
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 56,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  autoCheckIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285F4',
    marginRight: 8,
  },
  autoCheckText: {
    color: '#999999',
    fontSize: 12,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default EmailVerificationScreen;
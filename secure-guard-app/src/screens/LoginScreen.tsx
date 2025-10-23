import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { loginUser } from '@/store/slices/authSlice';
import AuthService from '@/services/AuthService';

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    // Initialize AuthService
    AuthService.initialize().catch(console.error);
  }, []);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const result = await AuthService.signInWithGoogle();
      
      // Dispatch login action
      dispatch(loginUser(result));
      
      // Check if email is verified
      if (!result.user.isEmailVerified) {
        navigation.navigate('EmailVerification', { email: result.user.email });
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert(
        'خطأ في تسجيل الدخول',
        error.message || 'فشل في تسجيل الدخول مع Google',
        [{ text: 'موافق' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Create Account
  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);
    
    try {
      const result = await AuthService.createAccountWithGoogle();
      
      // Dispatch login action
      dispatch(loginUser(result));
      
      // Navigate to email verification
      navigation.navigate('EmailVerification', { email: result.user.email });
    } catch (error) {
      console.error('Account creation error:', error);
      Alert.alert(
        'خطأ في إنشاء الحساب',
        error.message || 'فشل في إنشاء حساب جديد',
        [{ text: 'موافق' }]
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={true}
      />
      
      <View style={styles.content}>
        {/* App Branding */}
        <View style={styles.branding}>
          <View style={styles.appIcon}>
            <Text style={styles.iconText}>🛡️</Text>
          </View>
          <Text style={styles.appName}>SecureGuard Pro</Text>
          <Text style={styles.appDescription}>حماية متقدمة لجهازك</Text>
        </View>
        
        {/* Login Form */}
        <View style={styles.loginForm}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginTitle}>تسجيل الدخول مطلوب</Text>
            <Text style={styles.loginSubtitle}>
              يجب تسجيل الدخول للوصول إلى التطبيق
            </Text>
          </View>
          
          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.disabledButton]}
            onPress={handleGoogleSignIn}
            disabled={isLoading || isCreatingAccount}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>تسجيل الدخول بـ Google</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>
          
          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.createAccountButton, isCreatingAccount && styles.disabledButton]}
            onPress={handleCreateAccount}
            disabled={isLoading || isCreatingAccount}
            activeOpacity={0.8}
          >
            {isCreatingAccount ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.createAccountIcon}>👤</Text>
                <Text style={styles.createAccountText}>إنشاء حساب جديد</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Footer */}
          <View style={styles.loginFooter}>
            <Text style={styles.footerText}>
              بالمتابعة، أنت توافق على شروط الاستخدام
            </Text>
          </View>
        </View>
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
  branding: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconText: {
    fontSize: 40,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  appDescription: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
  },
  loginForm: {
    width: '100%',
    maxWidth: 350,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loginTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    minHeight: 56,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginHorizontal: 15,
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 30,
    minHeight: 56,
  },
  createAccountIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  createAccountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginFooter: {
    alignItems: 'center',
  },
  footerText: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
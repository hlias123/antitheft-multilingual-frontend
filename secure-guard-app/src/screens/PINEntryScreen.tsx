import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { RootState } from '@/store';
import { activateAlarm } from '@/store/slices/alarmSlice';
import { PIN_CONFIG } from '@/utils/constants';
import EncryptionService from '@/services/EncryptionService';
import StorageService from '@/services/StorageService';
import { STORAGE_KEYS } from '@/utils/constants';

type PINEntryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PINEntry'
>;

const PINEntryScreen: React.FC = () => {
  const navigation = useNavigation<PINEntryScreenNavigationProp>();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Disable back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back navigation
    });

    return () => backHandler.remove();
  }, []);

  // Handle number press
  const handleNumberPress = (number: string) => {
    if (pin.length < PIN_CONFIG.LENGTH && !isLoading) {
      const newPin = pin + number;
      setPin(newPin);
      
      // Light vibration feedback
      Vibration.vibrate(PIN_CONFIG.LIGHT_VIBRATION);
      
      // Auto-verify when PIN is complete
      if (newPin.length === PIN_CONFIG.LENGTH) {
        verifyPin(newPin);
      }
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (pin.length > 0 && !isLoading) {
      setPin(pin.slice(0, -1));
      Vibration.vibrate(PIN_CONFIG.LIGHT_VIBRATION);
    }
  };

  // Verify PIN
  const verifyPin = async (enteredPin: string) => {
    setIsLoading(true);
    
    try {
      // Get stored PIN
      const storedPin = await StorageService.getSecureItem(STORAGE_KEYS.USER_PIN);
      
      if (!storedPin) {
        // First time setup - store the PIN
        const encryptedPin = await EncryptionService.encryptPIN(enteredPin);
        await StorageService.setSecureItem(STORAGE_KEYS.USER_PIN, encryptedPin);
        
        // Navigate to main app or login
        if (isAuthenticated) {
          navigation.navigate('Main');
        } else {
          navigation.navigate('Login');
        }
        return;
      }
      
      // Verify existing PIN
      const isValid = await EncryptionService.verifyPIN(enteredPin, storedPin);
      
      if (isValid) {
        // PIN is correct
        setPin('');
        setAttempts(0);
        
        if (isAuthenticated) {
          navigation.navigate('Main');
        } else {
          navigation.navigate('Login');
        }
      } else {
        // PIN is incorrect
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin('');
        
        // Strong vibration for wrong PIN
        Vibration.vibrate(PIN_CONFIG.STRONG_VIBRATION);
        
        if (newAttempts >= PIN_CONFIG.MAX_ATTEMPTS) {
          // Activate theft alarm after max attempts
          dispatch(activateAlarm('unauthorized_access'));
          
          Alert.alert(
            'تنبيه أمني',
            'تم تجاوز عدد المحاولات المسموحة. سيتم تفعيل نظام الإنذار.',
            [{ text: 'موافق', style: 'destructive' }]
          );
        } else {
          Alert.alert(
            'رمز خاطئ',
            `رمز PIN غير صحيح. المحاولات المتبقية: ${PIN_CONFIG.MAX_ATTEMPTS - newAttempts}`,
            [{ text: 'موافق' }]
          );
        }
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      Alert.alert(
        'خطأ',
        'حدث خطأ في التحقق من رمز PIN. يرجى المحاولة مرة أخرى.',
        [{ text: 'موافق' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render keypad numbers
  const renderKeypad = () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'];
    
    return (
      <View style={styles.keypad}>
        {numbers.map((num, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.key,
              num === '' && styles.emptyKey,
              isLoading && styles.disabledKey,
            ]}
            onPress={() => {
              if (num === '⌫') {
                handleBackspace();
              } else if (num !== '' && typeof num === 'number') {
                handleNumberPress(num.toString());
              }
            }}
            disabled={num === '' || isLoading}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.keyText,
              num === '⌫' && styles.backspaceText,
            ]}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render PIN dots
  const renderPinDots = () => {
    return (
      <View style={styles.pinDisplay}>
        {[0, 1, 2, 3].map(index => (
          <View
            key={index}
            style={[
              styles.pinDot,
              pin.length > index && styles.pinDotFilled,
              isLoading && styles.pinDotLoading,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="rgba(0, 0, 0, 0.95)"
        translucent={true}
      />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>أدخل رمز الحماية</Text>
          <Text style={styles.subtitle}>
            {attempts > 0 
              ? `المحاولات المتبقية: ${PIN_CONFIG.MAX_ATTEMPTS - attempts}`
              : 'للوصول إلى التطبيق'
            }
          </Text>
        </View>
        
        {/* PIN Display */}
        {renderPinDots()}
        
        {/* Keypad */}
        {renderKeypad()}
        
        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>جاري التحقق...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    marginHorizontal: 10,
  },
  pinDotFilled: {
    backgroundColor: '#FFFFFF',
  },
  pinDotLoading: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyKey: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  disabledKey: {
    opacity: 0.5,
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  backspaceText: {
    fontSize: 20,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PINEntryScreen;
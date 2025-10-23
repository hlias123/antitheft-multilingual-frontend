import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  Vibration,
  StatusBar,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '@/navigation/AppNavigator';
import { SECRET_ACCESS, PIN_CONFIG } from '@/utils/constants';
import { isPointInCorner } from '@/utils/helpers';

type SecretAccessScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SecretAccess'
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SecretAccessScreen: React.FC = () => {
  const navigation = useNavigation<SecretAccessScreenNavigationProp>();
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  // Disable back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back navigation
    });

    return () => backHandler.remove();
  }, []);

  // Reset tap counter after timeout
  const resetTapCounter = () => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }
    
    tapTimer.current = setTimeout(() => {
      setTapCount(0);
    }, SECRET_ACCESS.TAP_TIMEOUT);
  };

  // Handle corner tap
  const handleCornerTap = (x: number, y: number) => {
    if (isPointInCorner(x, y, SECRET_ACCESS.CORNER_SIZE, SCREEN_WIDTH, SCREEN_HEIGHT)) {
      const newTapCount = tapCount + 1;
      setTapCount(newTapCount);

      // Light vibration feedback
      Vibration.vibrate(SECRET_ACCESS.VIBRATION_DURATION);

      // Reset timer
      resetTapCounter();

      // Check if we reached required taps
      if (newTapCount >= SECRET_ACCESS.REQUIRED_TAPS) {
        setTapCount(0);
        if (tapTimer.current) {
          clearTimeout(tapTimer.current);
        }
        
        // Navigate to PIN entry
        navigation.navigate('PINEntry');
      }
    }
  };

  // Pan responder for touch detection
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false,
    
    onPanResponderGrant: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      handleCornerTap(locationX, locationY);
    },
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
    };
  }, []);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={true}
        hidden={false}
      />
      
      {/* Invisible corner indicators for development */}
      {__DEV__ && (
        <>
          {/* Top-left corner */}
          <View style={[styles.cornerIndicator, styles.topLeft]} />
          
          {/* Top-right corner */}
          <View style={[styles.cornerIndicator, styles.topRight]} />
          
          {/* Bottom-left corner */}
          <View style={[styles.cornerIndicator, styles.bottomLeft]} />
          
          {/* Bottom-right corner */}
          <View style={[styles.cornerIndicator, styles.bottomRight]} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cornerIndicator: {
    position: 'absolute',
    width: SECRET_ACCESS.CORNER_SIZE,
    height: SECRET_ACCESS.CORNER_SIZE,
    backgroundColor: 'rgba(255, 0, 0, 0.1)', // Very faint red for development
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.2)',
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
});

export default SecretAccessScreen;
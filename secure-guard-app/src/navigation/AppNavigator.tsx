import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import { RootState } from '@/store';
import {
  SecretAccessScreen,
  PINEntryScreen,
  LoginScreen,
  MainScreen,
  SettingsScreen,
  MapScreen,
  EmailVerificationScreen,
} from '@/screens';

export type RootStackParamList = {
  SecretAccess: undefined;
  PINEntry: undefined;
  Login: undefined;
  EmailVerification: { email: string };
  Main: undefined;
  Settings: undefined;
  Map: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { secretAccessEnabled } = useSelector((state: RootState) => state.settings);

  // Determine initial route based on app state
  const getInitialRouteName = (): keyof RootStackParamList => {
    if (!isAuthenticated) {
      return secretAccessEnabled ? 'SecretAccess' : 'Login';
    }
    
    if (user && !user.isEmailVerified) {
      return 'EmailVerification';
    }
    
    return 'Main';
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen 
        name="SecretAccess" 
        component={SecretAccessScreen}
        options={{
          animationEnabled: false,
        }}
      />
      <Stack.Screen 
        name="PINEntry" 
        component={PINEntryScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen 
        name="EmailVerification" 
        component={EmailVerificationScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen 
        name="Main" 
        component={MainScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
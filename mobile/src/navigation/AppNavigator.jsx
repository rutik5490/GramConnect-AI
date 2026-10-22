import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator } from 'react-native'
import { useCitizenAuth } from '../context/CitizenAuthContext'
import { colors } from '../theme/colors'

import SelectPanchayatScreen from '../screens/SelectPanchayatScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import OtpVerifyScreen from '../screens/OtpVerifyScreen'
import NewComplaintScreen from '../screens/NewComplaintScreen'
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen'
import MainTabs from './MainTabs'

const Stack = createNativeStackNavigator()

export default function AppNavigator() {
  const { citizen, loading } = useCitizenAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!citizen ? (
          <>
            <Stack.Screen name="SelectPanchayat" component={SelectPanchayatScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="NewComplaint"
              component={NewComplaintScreen}
              options={{ presentation: 'modal', headerShown: true, title: 'Report an Issue' }}
            />
            <Stack.Screen
              name="VoiceAssistant"
              component={VoiceAssistantScreen}
              options={{ presentation: 'modal', headerShown: true, title: 'AI Assistant' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/HomeScreen'
import ComplaintsScreen from '../screens/ComplaintsScreen'
import SchemesScreen from '../screens/SchemesScreen'
import AnnouncementsScreen from '../screens/AnnouncementsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import { colors } from '../theme/colors'

const Tab = createBottomTabNavigator()

const ICONS = {
  Home: 'home-outline',
  Complaints: 'list-outline',
  Schemes: 'ribbon-outline',
  Announcements: 'megaphone-outline',
  Profile: 'person-outline',
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color} />,
        tabBarStyle: { borderTopColor: colors.hairline },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Complaints" component={ComplaintsScreen} />
      <Tab.Screen name="Schemes" component={SchemesScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#81C784',
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused, size }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={22} 
                color={focused ? "#FFFFFF" : "#81C784"} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="ditanam"
        options={{
          title: 'Tanam',
          tabBarIcon: ({ focused, size }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons 
                name={focused ? "leaf" : "leaf-outline"} 
                size={22} 
                color={focused ? "#FFFFFF" : "#81C784"} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="cuaca"
        options={{
          title: 'Cuaca',
          tabBarIcon: ({ focused, size }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons 
                name={focused ? "partly-sunny" : "partly-sunny-outline"} 
                size={22} 
                color={focused ? "#FFFFFF" : "#81C784"} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="panen"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    height: 75,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIcon: {
    marginTop: 0,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
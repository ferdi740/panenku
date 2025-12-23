import { NotificationProvider } from '@/contexts/NotificationContext';
import { plantService } from '@/services/plantService';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from './splash-screen';

// Keep native splash visible
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 App starting...');
        
        // Initialize services
        await plantService.initializeApp();
        console.log('✅ Services ready');
        
        // HIDE NATIVE SPLASH SETELAH 100ms (sangat cepat)
        await new Promise(resolve => setTimeout(resolve, 100));
        await SplashScreen.hideAsync();
        console.log('🎬 Native splash hidden');
        
        // Tampilkan custom splash selama 2 detik TOTAL
        // Karena native splash sudah 100ms, kita kasih 1900ms lagi
        setTimeout(() => {
          console.log('✅ Splash completed');
          setAppIsReady(true);
        }, 1900);
        
      } catch (error) {
        console.error('❌ Error:', error);
        // Tetap hide native splash
        await SplashScreen.hideAsync();
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Tampilkan custom splash kita
  if (!appIsReady) {
    return <CustomSplashScreen />;
  }

  // Tampilkan app utama
  return (
    <NotificationProvider>
      <StatusBar style="dark" backgroundColor="#E8F5E9" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-plant" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-plant/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="plant-detail-modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="harvest-plant/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </NotificationProvider>
  );
}
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { plantService } from '@/services/plantService';

export default function RootLayout() {
  useEffect(() => {
    console.log('🚀 ROOT LAYOUT - App starting...');
    plantService.initializeApp();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          // ✅ Tambah option untuk better navigation
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="add-plant" 
          options={{
            presentation: 'modal', // ✅ Treat as modal
          }}
        />
        <Stack.Screen 
          name="edit-plant/[id]" 
          options={{
            presentation: 'modal', // ✅ Treat as modal
          }}
        />
        <Stack.Screen 
          name="plant-detail-modal" 
          options={{
            presentation: 'modal', // ✅ Explicit modal
          }}
        />
        <Stack.Screen 
          name="harvest-plant/[id]" 
          options={{
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
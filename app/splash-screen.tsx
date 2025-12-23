import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  // Animasi untuk fade in - PERBAIKAN: tambah initial value
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Animasi untuk loading dots - PERBAIKAN: tambah initial value
  const dot1Anim = useRef(new Animated.Value(0.3)).current; // Mulai dari 0.3
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Animasi masuk untuk logo dan teks
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animasi loading dots (berurutan)
    const createDotAnimation = (dotAnim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    };

    // Jalankan animasi dots dalam loop
    const dotAnimation = Animated.loop(
      Animated.sequence([
        createDotAnimation(dot1Anim, 0),
        createDotAnimation(dot2Anim, 200),
        createDotAnimation(dot3Anim, 400),
      ])
    );

    dotAnimation.start();

    // Cleanup
    return () => {
      dotAnimation.stop();
    };
  }, []);

  return (
    <LinearGradient
      colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
      style={styles.container}
    >
      {/* Logo dengan animasi */}
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={70} color="#2E7D32" />
        </View>
        
        <Text style={styles.appName}>PanenKu</Text>
        <Text style={styles.tagline}>Budidaya Tanaman Pintar</Text>
      </Animated.View>

      {/* Loading dots dengan animasi */}
      <View style={styles.loadingContainer}>
        <Animated.View 
          style={[
            styles.dot,
            styles.dot1,
            { opacity: dot1Anim }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot,
            styles.dot2,
            { opacity: dot2Anim }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot,
            styles.dot3,
            { opacity: dot3Anim }
          ]} 
        />
      </View>

      {/* Version info */}
      <Text style={styles.versionText}>v1.0.0</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1B5E20',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#2E7D32',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  dot1: {
    backgroundColor: '#4CAF50',
  },
  dot2: {
    backgroundColor: '#2E7D32',
  },
  dot3: {
    backgroundColor: '#1B5E20',
  },
  versionText: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: '#81C784',
  },
});
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

interface NotificationPopupProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const iconMapping = {
  success: {
    name: 'checkmark-circle' as const,
    color: '#2E7D32', // Hijau gelap untuk tema alam
    bgColor: 'rgba(46, 125, 50, 0.1)',
    gradient: ['#E8F5E9', '#C8E6C9'] as [string, string], // Gradient hijau muda
  },
  error: {
    name: 'close-circle' as const,
    color: '#D32F2F', // Merah lebih soft
    bgColor: 'rgba(211, 47, 47, 0.1)',
    gradient: ['#FFEBEE', '#FFCDD2'] as [string, string], // Gradient merah muda
  },
};

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  visible,
  message,
  type,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, scaleAnim, slideAnim]);

  if (!visible) {
    return null;
  }

  const { name, color, bgColor, gradient } = iconMapping[type] || iconMapping.error;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ],
            },
          ]}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            
            {/* Dekorasi daun di pojok */}
            <View style={styles.leafDecorationTopLeft}>
              <Ionicons name="leaf-outline" size={28} color={color} opacity={0.2} />
            </View>
            <View style={styles.leafDecorationBottomRight}>
              <Ionicons name="leaf" size={24} color={color} opacity={0.15} />
            </View>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              activeOpacity={0.6}
            >
              <View style={styles.closeButtonCircle}>
                <Ionicons name="close" size={18} color={Colors.textLight} />
              </View>
            </TouchableOpacity>

            <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={name} size={52} color={color} />
              </View>
              
              {/* Efek glow ring */}
              <View style={[styles.glowRing, { borderColor: `${color}30` }]} />
            </View>

            <Text style={[styles.title, { color: color }]}>
              {type === 'success' ? 'Berhasil! 🌱' : 'Perhatian! ⚠️'}
            </Text>
            
            <View style={styles.messageContainer}>
              <Ionicons 
                name={type === 'success' ? 'information-circle' : 'warning'} 
                size={18} 
                color={color} 
                style={styles.messageIcon}
              />
              <Text style={styles.message}>{message}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: color }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>
                {type === 'success' ? 'Mengerti' : 'Coba Lagi'}
              </Text>
              <Ionicons 
                name={type === 'success' ? 'checkmark' : 'refresh'} 
                size={18} 
                color="#FFFFFF" 
                style={styles.actionButtonIcon}
              />
            </TouchableOpacity>

          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  gradientBackground: {
    padding: 32,
    paddingTop: 40,
    alignItems: 'center',
    position: 'relative',
  },
  leafDecorationTopLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    transform: [{ rotate: '-15deg' }],
  },
  leafDecorationBottomRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    transform: [{ rotate: '25deg' }],
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  closeButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  glowRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    width: '100%',
  },
  messageIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: '#1B5E20',
    lineHeight: 22,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  actionButtonIcon: {
    marginLeft: 4,
  },
});

export default NotificationPopup;
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface PlantCardProps {
  id: string;
  name: string;
  daysLeft: number;
  image: string;
  plantData?: any;
}

export default function PlantCard({ id, name, daysLeft, image, plantData }: PlantCardProps) {
  const router = useRouter();
  const plantId = id || plantData?.id;
  const [imageError, setImageError] = useState(false);
  
  // Check if plant is harvested based on status from plantData
  const isHarvested = plantData?.status === 'harvested';

  // Calculate progress based on status
  const calculateProgress = () => {
    if (isHarvested) {
      // Jika sudah dipanen, progress selalu 100%
      return 100;
    }
    
    // Jika sedang tumbuh, gunakan progress dari data atau hitung dari daysLeft
    if (plantData?.progress !== undefined) {
      return Math.min(Math.max(plantData.progress, 0), 100);
    }
    
    // Fallback: hitung progress dari daysLeft jika ada data penanaman
    if (plantData?.plantedDate && plantData?.harvestDate) {
      try {
        const planted = new Date(plantData.plantedDate);
        const harvest = new Date(plantData.harvestDate);
        const now = new Date();
        
        const totalTime = harvest.getTime() - planted.getTime();
        const elapsedTime = now.getTime() - planted.getTime();
        
        if (totalTime <= 0) return 100;
        if (elapsedTime <= 0) return 0;
        if (elapsedTime >= totalTime) return 100;
        
        const progress = Math.round((elapsedTime / totalTime) * 100);
        return Math.min(Math.max(progress, 0), 100);
      } catch {
        return 10; // Default value
      }
    }
    
    return 10; // Default minimum progress
  };

  const progress = calculateProgress();

  // Determine plant status logic
  const getPlantStatus = () => {
    if (isHarvested) {
      return {
        type: 'harvested',
        text: 'Sudah Panen',
        color: '#2E7D32',
        gradient: ['#4CAF50', '#2E7D32'] as [string, string],
        icon: 'basket' as const,
      };
    }

    // Jika progress 100% tapi belum dipanen
    if (progress >= 100) {
      return {
        type: 'ready',
        text: 'Siap Panen',
        color: '#FF5722',
        gradient: ['#FF7043', '#FF5722'] as [string, string],
        icon: 'alert-circle' as const,
      };
    }

    return {
      type: 'growing',
      text: 'Sedang Tumbuh',
      color: '#FF9800',
      gradient: ['#FFB74D', '#FF9800'] as [string, string],
      icon: 'time' as const,
    };
  };

  const status = getPlantStatus();
  
  // Format Time Text - Fix logic
  const getTimeText = () => {
    if (isHarvested) {
      return 'Selesai';
    }
    
    // Jika progress sudah 100% tapi belum dipanen
    if (progress >= 100) {
      return 'Siap Panen!';
    }
    
    // Gunakan daysLeft dari props jika ada
    if (daysLeft > 0) {
      if (daysLeft > 30) {
        const months = Math.ceil(daysLeft / 30);
        return `${months} bulan lagi`;
      } else {
        return `${daysLeft} hari lagi`;
      }
    }
    
    // Jika daysLeft tidak valid atau 0
    if (plantData?.harvestDate) {
      try {
        const harvestDate = new Date(plantData.harvestDate);
        const now = new Date();
        const diffTime = harvestDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          if (diffDays > 30) {
            const months = Math.ceil(diffDays / 30);
            return `${months} bulan lagi`;
          } else {
            return `${diffDays} hari lagi`;
          }
        } else if (diffDays <= 0) {
          return 'Siap Panen!';
        }
      } catch {
        // Fallback jika parsing tanggal gagal
      }
    }
    
    return 'Menunggu';
  };

  const handlePress = () => {
    if (!plantId || plantId === 'undefined') {
      console.error('❌ PLANT CARD - Invalid plant ID');
      return;
    }
    router.push(`/plant-detail-modal?id=${plantId}`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Pressable 
      onPress={handlePress}
      style={styles.cardContainer}
      android_ripple={{ color: 'rgba(76, 175, 80, 0.1)' }}
    >
      <View style={[styles.card, { borderColor: status.color }]}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {!imageError ? (
            <Image 
              source={{ uri: image }} 
              style={styles.image}
              onError={handleImageError}
            />
          ) : (
            <View style={styles.fallbackContainer}>
              <Ionicons name="leaf-outline" size={32} color="#81C784" />
            </View>
          )}
          
          {/* Progress Badge */}
          <View style={styles.progressBadge}>
            <LinearGradient
              colors={status.gradient}
              style={styles.progressBadgeGradient}
            >
              <Text style={styles.progressBadgeText}>{progress}%</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Plant Name */}
          <Text style={styles.plantName} numberOfLines={1}>{name}</Text>
          
          {/* Status Row */}
          <View style={styles.statusRow}>
            <Ionicons 
              name={status.icon} 
              size={14} 
              color={status.color} 
            />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>

          {/* Time Row */}
          <View style={styles.timeRow}>
            <Ionicons name="calendar-outline" size={12} color="#81C784" />
            <Text style={styles.timeText}>
              {getTimeText()}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={status.gradient}
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '48%',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 230, 201, 0.5)',
  },
  progressBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBadgeGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 12,
  },
  plantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#81C784',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(200, 230, 201, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
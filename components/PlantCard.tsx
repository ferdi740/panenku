// plantcard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { plantService } from '@/services/plantService';

interface PlantCardProps {
  id: string;
  name: string;
  daysLeft: number;
  image: string;
  plantData?: any;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function PlantCard({ id, name, daysLeft, image, plantData, onDelete, onEdit }: PlantCardProps) {
  const router = useRouter();
  const plantId = id || plantData?.id;
  const [imageError, setImageError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine plant status
  const getPlantStatus = () => {
    if (daysLeft < 30) {
      return {
        type: 'warning',
        text: 'Terdapat Peringatan',
        borderColor: Colors.warning,
        icon: 'close-circle' as const,
      };
    }
    return {
      type: 'healthy',
      text: 'Tanaman Sehat',
      borderColor: Colors.success,
      icon: 'checkmark-circle' as const,
    };
  };

  const status = getPlantStatus();
  
  // Convert days to months
  const monthsLeft = Math.ceil(daysLeft / 30);

  const handlePress = () => {
    if (isDeleting) {
      return;
    }
    if (!plantId || plantId === 'undefined') {
      console.error('❌ PLANT CARD - Invalid plant ID');
      return;
    }
    (router.push as any)(`/plant-detail-modal?id=${plantId}`);
  };

  const handleEdit = () => {
    console.log('✏️ EDIT BUTTON PRESSED - plantId:', plantId);
    if (!plantId || plantId === 'undefined') {
      console.error('❌ EDIT BUTTON - Invalid plant ID');
      Alert.alert('Error', 'ID tanaman tidak valid');
      return;
    }

    // Navigate to edit screen
    router.push(`/edit-plant/${plantId}`);
  };

  const handleDelete = () => {
    console.log('🔴 HANDLE DELETE CALLED - plantId:', plantId);
    if (!plantId || plantId === 'undefined') {
      console.error('❌ HANDLE DELETE - Invalid plant ID');
      Alert.alert('Error', 'ID tanaman tidak valid');
      return;
    }

    const isWeb = typeof window !== 'undefined';
    
    if (isWeb) {
      console.log('🌐 WEB DETECTED - Using window.confirm');
      const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus ${name}?`);
      console.log('🌐 WEB - User confirmed:', confirmed);
      
      if (confirmed) {
        console.log('✅ DELETE CONFIRMED (WEB) - Starting delete process...');
        deletePlant();
      } else {
        console.log('❌ DELETE CANCELLED (WEB) - User cancelled');
        setIsDeleting(false);
      }
    } else {
      console.log('📱 NATIVE - Showing Alert.alert');
      Alert.alert(
        'Hapus Tanaman',
        `Apakah Anda yakin ingin menghapus ${name}?`,
        [
          { 
            text: 'Batal', 
            style: 'cancel',
            onPress: () => {
              console.log('❌ DELETE CANCELLED - User cancelled');
              setIsDeleting(false);
            }
          },
          { 
            text: 'Hapus', 
            style: 'destructive',
            onPress: async () => {
              console.log('✅ DELETE CONFIRMED - User confirmed, starting delete process...');
              try {
                await deletePlant();
              } catch (error) {
                console.error('❌ DELETE CONFIRMED - Error in deletePlant:', error);
              }
            }
          }
        ],
        { cancelable: true, onDismiss: () => {
          console.log('❌ DELETE ALERT DISMISSED');
          setIsDeleting(false);
        }}
      );
      console.log('📱 NATIVE - Alert shown');
    }
  };

  const deletePlant = async () => {
    const targetId = String(plantId || plantData?.id || id);
    
    console.log('🔴 DELETE PLANT CALLED - targetId:', targetId);
    
    if (!targetId || targetId === 'undefined' || targetId === 'null') {
      console.error('❌ DELETE PLANT - Invalid target ID');
      Alert.alert('Error', 'ID tanaman tidak valid');
      setIsDeleting(false);
      return;
    }

    try {
      setIsDeleting(true);
      console.log('🗑️ PLANT CARD - Attempting to delete plant:', targetId);
      
      const success = await plantService.deletePlant(targetId);
      
      console.log('🗑️ PLANT CARD - Delete result:', success);
      
      if (success) {
        console.log('✅ PLANT CARD - Plant deleted successfully, reloading...');
        if (onDelete) {
          console.log('✅ PLANT CARD - Calling onDelete callback...');
          onDelete();
          setTimeout(() => {
            console.log('✅ PLANT CARD - Calling onDelete callback again after delay...');
            onDelete();
          }, 300);
        } else {
          console.warn('⚠️ PLANT CARD - onDelete callback is not defined!');
        }
      } else {
        console.error('❌ PLANT CARD - Delete failed, success = false');
        Alert.alert('Error', 'Gagal menghapus tanaman. ID mungkin tidak cocok.');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('❌ PLANT CARD - Error deleting plant:', error);
      Alert.alert('Error', 'Gagal menghapus tanaman. Coba lagi.');
      setIsDeleting(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <View style={[styles.card, { borderColor: status.borderColor }]}>
      {/* Main Card Content - Pressable */}
      <Pressable 
        onPress={handlePress}
        style={styles.cardContent}
        disabled={isDeleting}
      >
        {/* Background Image */}
        <View style={styles.imageContainer}>
          {!imageError ? (
            <Image 
              source={{ uri: image }} 
              style={styles.image}
              onError={handleImageError}
            />
          ) : (
            <View style={styles.fallbackContainer}>
              <Ionicons name="leaf" size={40} color={Colors.textLight} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Plant Name */}
          <View style={styles.nameRow}>
            <Ionicons name="leaf" size={16} color={Colors.primary} />
            <Text style={styles.name}>{name}</Text>
          </View>

          {/* Status */}
          <View style={styles.statusRow}>
            <Ionicons 
              name={status.icon} 
              size={16} 
              color={status.type === 'healthy' ? Colors.success : Colors.warning} 
            />
            <Text style={[
              styles.statusText,
              { color: status.type === 'healthy' ? Colors.success : Colors.warning }
            ]}>
              {status.text}
            </Text>
          </View>

          {/* Time to Harvest */}
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color={Colors.textLight} />
            <Text style={styles.timeText}>
              {monthsLeft} Bulan Menuju Panen
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Action Buttons - Edit & Delete */}
      <View style={styles.actionButtons}>
        {/* Edit Button */}
        <Pressable 
          style={styles.editButton}
          onPress={(e) => {
            console.log('✏️ EDIT BUTTON PRESSED');
            e?.stopPropagation?.();
            try {
              handleEdit();
              console.log('✏️ EDIT BUTTON PRESSED - handleEdit called successfully');
            } catch (error) {
              console.error('❌ EDIT BUTTON PRESSED - Error calling handleEdit:', error);
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create-outline" size={16} color={Colors.white} />
        </Pressable>

        {/* Delete Button */}
        <Pressable 
          style={styles.deleteButton}
          onPress={(e) => {
            console.log('🗑️ DELETE BUTTON PRESSED - Calling handleDelete...');
            e?.stopPropagation?.();
            try {
              handleDelete();
              console.log('🗑️ DELETE BUTTON PRESSED - handleDelete called successfully');
            } catch (error) {
              console.error('❌ DELETE BUTTON PRESSED - Error calling handleDelete:', error);
            }
          }}
          onPressIn={() => {
            console.log('🗑️ DELETE BUTTON PRESS IN');
            setIsDeleting(true);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    width: '48%',
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.border,
  },
  content: {
    padding: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 6,
  },
  actionButtons: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
/**
 * JobPhotosSection - Section photos pour les détails de job
 * Permet l'upload, affichage, édition de description et suppression des photos
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useCommonThemedStyles } from '../../../hooks/useCommonStyles';
import { useJobPhotos } from '../../../hooks/useJobPhotos';
import { JobPhotoAPI } from '../../../services/jobPhotos';
import { HStack, VStack } from '../../primitives/Stack';
import { Card } from '../../ui/Card';
import PhotoSelectionModal from '../modals/PhotoSelectionModal';

interface JobPhotosSectionProps {
  jobId: string;
}

interface PhotoViewModalProps {
  visible: boolean;
  photo: JobPhotoAPI | null;
  onClose: () => void;
  onEdit: (photoId: string, description: string) => void;
  onDelete: (photoId: string) => void;
}

interface PhotoItemProps {
  photo: JobPhotoAPI;
  onPress: () => void;
  onEdit: (photoId: string, description: string) => void;
  onDelete: (photoId: string) => void;
}

const SectionHeader: React.FC<{ icon: string; title: string; badge?: string }> = ({ 
  icon, 
  title, 
  badge 
}) => {
  const { colors } = useCommonThemedStyles();
  return (
    <HStack gap="sm" align="center" style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <Text style={{
        fontSize: DESIGN_TOKENS.typography.subtitle.fontSize,
        fontWeight: '600',
        color: colors.text,
        flex: 1
      }}>
        {title}
      </Text>
      {badge && (
        <View style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: 'white'
          }}>
            {badge}
          </Text>
        </View>
      )}
    </HStack>
  );
};

const PhotoViewModal: React.FC<PhotoViewModalProps> = ({ 
  visible, 
  photo, 
  onClose, 
  onEdit, 
  onDelete 
}) => {
  const { colors } = useCommonThemedStyles();
  const [editMode, setEditMode] = useState(false);
  const [description, setDescription] = useState('');
  const screenWidth = Dimensions.get('window').width;
  
  React.useEffect(() => {
    if (photo) {
      setDescription(photo.description || '');
    }
  }, [photo]);

  const handleSaveDescription = () => {
    if (photo) {
      onEdit(photo.id, description);
      setEditMode(false);
    }
  };

  const handleDelete = () => {
    if (photo) {
      Alert.alert(
        'Supprimer la photo',
        'Êtes-vous sûr de vouloir supprimer cette photo ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Supprimer', 
            style: 'destructive',
            onPress: () => {
              onDelete(photo.id);
              onClose();
            }
          }
        ]
      );
    }
  };

  if (!photo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: DESIGN_TOKENS.spacing.lg
          }}
          maximumZoomScale={3}
          minimumZoomScale={1}
        >
          {/* Header avec actions */}
          <View style={{
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            zIndex: 1
          }}>
            <Pressable
              onPress={onClose}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
            
            <HStack gap="sm">
              <Pressable
                onPress={() => setEditMode(!editMode)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="create-outline" size={20} color="white" />
              </Pressable>
              
              <Pressable
                onPress={handleDelete}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(220,20,60,0.8)',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="trash-outline" size={20} color="white" />
              </Pressable>
            </HStack>
          </View>

          {/* Image */}
          <Image
            source={{ 
              uri: photo.id.startsWith('local-') 
                ? photo.filename 
                : `https://altivo.fr/swift-app/v1/photos/${photo.id}/serve`
            }}
            style={{
              width: screenWidth - 40,
              height: screenWidth - 40,
              borderRadius: DESIGN_TOKENS.radius.lg,
              marginVertical: 60
            }}
            resizeMode="contain"
          />

          {/* Description */}
          <View style={{
            position: 'absolute',
            bottom: 50,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.lg
          }}>
            {editMode ? (
              <VStack gap="sm">
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ajouter une description..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  style={{
                    color: 'white',
                    fontSize: 16,
                    minHeight: 60,
                    textAlignVertical: 'top',
                    paddingVertical: DESIGN_TOKENS.spacing.sm
                  }}
                />
                <HStack gap="sm" justify="flex-end">
                  <Pressable
                    onPress={() => setEditMode(false)}
                    style={{
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: DESIGN_TOKENS.radius.sm,
                      backgroundColor: 'rgba(255,255,255,0.2)'
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                      Annuler
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveDescription}
                    style={{
                      paddingHorizontal: DESIGN_TOKENS.spacing.md,
                      paddingVertical: DESIGN_TOKENS.spacing.sm,
                      borderRadius: DESIGN_TOKENS.radius.sm,
                      backgroundColor: colors.primary
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                      Sauvegarder
                    </Text>
                  </Pressable>
                </HStack>
              </VStack>
            ) : (
              <Text style={{
                color: 'white',
                fontSize: 16,
                lineHeight: 24
              }}>
                {photo.description || 'Aucune description'}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const PhotoItem: React.FC<PhotoItemProps> = ({ photo, onPress, onEdit, onDelete }) => {
  const { colors } = useCommonThemedStyles();
  
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: '48%',
        aspectRatio: 1,
        borderRadius: DESIGN_TOKENS.radius.md,
        overflow: 'hidden',
        backgroundColor: colors.background,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      }}
    >
      <Image
        source={{ 
          uri: photo.id.startsWith('local-') 
            ? photo.filename 
            : `https://altivo.fr/swift-app/v1/photos/${photo.id}/serve`
        }}
        style={{ width: '100%', height: '70%' }}
        resizeMode="cover"
      />
      
      <View style={{
        height: '30%',
        padding: DESIGN_TOKENS.spacing.xs,
        justifyContent: 'center'
      }}>
        <Text 
          numberOfLines={2}
          style={{
            fontSize: 12,
            color: colors.text,
            lineHeight: 16
          }}
        >
          {photo.description || 'Sans description'}
        </Text>
      </View>
    </Pressable>
  );
};

export const JobPhotosSection: React.FC<JobPhotosSectionProps> = ({ jobId }) => {
  const { colors } = useCommonThemedStyles();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhotoAPI | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  console.log('📸 [JobPhotosSection] INIT - jobId:', jobId);
  
  const {
    photos,
    isLoading,
    error,
    uploadPhoto,
    updatePhotoDescription,
    deletePhoto,
    totalPhotos,
    refetch
  } = useJobPhotos(jobId);
  
  console.log('📸 [JobPhotosSection] STATE - photos:', photos?.length || 0, 'isLoading:', isLoading, 'error:', error);

  const handlePhotoSelection = async (photoUri: string) => {
    console.log('🎯 [DEBUG] handlePhotoSelection - REÇU du modal');
    console.log('🎯 [DEBUG] photoUri reçu:', photoUri);
    
    setShowPhotoModal(false);
    console.log('✅ [DEBUG] Modal fermé');
    
    try {
      console.log('📤 [DEBUG] Appel uploadPhoto...');
      
      const result = await uploadPhoto(photoUri, '');
      
      console.log('✅ [DEBUG] uploadPhoto terminé:', result);
      
      if (result) {
        // ✅ Recharger toutes les photos depuis le serveur
        console.log('🔄 [DEBUG] Rechargement des photos depuis le serveur...');
        await refetch();
        console.log('✅ [DEBUG] Photos rechargées');
        
        Alert.alert('Succès', 'Photo ajoutée avec succès !');
      }
    } catch (err) {
      console.error('❌ [DEBUG] Erreur dans uploadPhoto:', err);
      console.error('❌ [DEBUG] Stack trace:', err instanceof Error ? err.stack : 'N/A');
      Alert.alert('Erreur', 'Erreur lors de l\'ajout de la photo');
    }
  };

  const handlePhotoPress = (photo: JobPhotoAPI) => {
    setSelectedPhoto(photo);
    setShowViewModal(true);
  };

  const handleEditDescription = async (photoId: string, description: string) => {
    try {
      await updatePhotoDescription(photoId, description);
      Alert.alert('Succès', 'Description mise à jour !');
    } catch (err) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto(photoId);
      Alert.alert('Succès', 'Photo supprimée !');
    } catch (err) {
      Alert.alert('Erreur', 'Erreur lors de la suppression');
    }
  };

  if (error && (!Array.isArray(photos) || photos.length === 0)) {
    return null; // Ne pas afficher la section s'il y a une erreur et aucune photo
  }

  return (
    <>
      <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
        <VStack gap="md">
          <SectionHeader 
            icon="camera-outline" 
            title="Photos" 
            badge={totalPhotos > 0 ? totalPhotos.toString() : undefined}
          />
          
          {isLoading && (!Array.isArray(photos) || photos.length === 0) ? (
            <View style={{
              padding: DESIGN_TOKENS.spacing.lg,
              alignItems: 'center'
            }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{
                marginTop: DESIGN_TOKENS.spacing.sm,
                color: colors.textSecondary,
                fontSize: 14
              }}>
                Chargement des photos...
              </Text>
            </View>
          ) : Array.isArray(photos) && photos.length > 0 ? (
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: DESIGN_TOKENS.spacing.sm
            }}>
              {photos.map((photo, index) => (
                <PhotoItem
                  key={photo.id}
                  photo={photo}
                  onPress={() => handlePhotoPress(photo)}
                  onEdit={handleEditDescription}
                  onDelete={handleDeletePhoto}
                />
              ))}
            </View>
          ) : (
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              fontStyle: 'italic',
              textAlign: 'center',
              paddingVertical: DESIGN_TOKENS.spacing.lg
            }}>
              Aucune photo pour le moment
            </Text>
          )}
          
          {/* Bouton Ajouter une photo */}
          <Pressable
            onPress={() => setShowPhotoModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: DESIGN_TOKENS.spacing.md,
              borderWidth: 2,
              borderColor: colors.primary,
              borderStyle: 'dashed',
              borderRadius: DESIGN_TOKENS.radius.md,
              backgroundColor: colors.primary + '10',
              marginTop: DESIGN_TOKENS.spacing.sm
            }}
          >
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.primary,
              marginLeft: DESIGN_TOKENS.spacing.xs
            }}>
              Ajouter une photo
            </Text>
          </Pressable>
        </VStack>
      </Card>

      {/* Modal de sélection de photo */}
      <PhotoSelectionModal
        isVisible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onPhotoSelected={handlePhotoSelection}
        jobId={jobId}
      />

      {/* Modal de visualisation/édition */}
      <PhotoViewModal
        visible={showViewModal}
        photo={selectedPhoto}
        onClose={() => setShowViewModal(false)}
        onEdit={handleEditDescription}
        onDelete={handleDeletePhoto}
      />
    </>
  );
};
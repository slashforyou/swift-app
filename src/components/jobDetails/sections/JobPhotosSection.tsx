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
  FlatList,
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

// Helper pour formater la date en français
const formatPhotoDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Si moins d'1 heure : "Il y a X min"
    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    }
    
    // Si moins de 24h : "Il y a X h"
    if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    }
    
    // Si moins de 7 jours : "Il y a X jours"
    if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    }
    
    // Sinon format complet : "30/10/2025 14:30"
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

// Helper pour formater le stage en français
const formatStage = (stage?: string): string => {
  if (!stage) return '';
  
  const stageLabels: Record<string, string> = {
    'pickup': '📍 Ramassage',
    'delivery': '🚚 Livraison',
    'other': '📸 Autre',
    'before': '⏪ Avant',
    'after': '⏩ Après',
  };
  
  return stageLabels[stage.toLowerCase()] || stage;
};

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
      onEdit(String(photo.id), description);
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
              onDelete(String(photo.id));
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
              uri: photo.url 
                ? photo.url  // ✅ PRIORITÉ 1: Signed URL from backend
                : String(photo.id).startsWith('local-') 
                  ? photo.filename  // ✅ PRIORITÉ 2: Photo locale
                  : (() => {
                      // ⚠️ FALLBACK: Nettoyer le path pour éviter les doubles slashes
                      const path = (photo.filename || photo.filePath || photo.file_path || '').replace(/^\/+/, '');
                      return `https://storage.googleapis.com/swift-images/${path}`;
                    })()
            }}
            style={{
              width: screenWidth - 40,
              height: screenWidth - 40,
              borderRadius: DESIGN_TOKENS.radius.lg,
              marginVertical: 60
            }}
            resizeMode="contain"
            onError={(error) => console.error('❌ [PhotoViewModal] Image load error:', error.nativeEvent.error)}
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
              <VStack gap="sm">
                {/* Date et Stage */}
                <HStack gap="md" align="center" style={{ marginBottom: 4 }}>
                  {formatPhotoDate(photo.capturedAt || photo.createdAt || photo.created_at) ? (
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                      📅 {formatPhotoDate(photo.capturedAt || photo.createdAt || photo.created_at)}
                    </Text>
                  ) : null}
                  {formatStage(photo.stage) ? (
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' }}>
                      {formatStage(photo.stage)}
                    </Text>
                  ) : null}
                </HStack>
                
                {/* Description */}
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  lineHeight: 24
                }}>
                  {photo.description || 'Aucune description'}
                </Text>
              </VStack>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const PhotoItem: React.FC<PhotoItemProps> = ({ photo, onPress, onEdit, onDelete }) => {
  const { colors } = useCommonThemedStyles();
  const [imageError, setImageError] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editDescription, setEditDescription] = React.useState(photo.description || '');
  
  // Convertir l'ID en string pour vérifier si c'est une photo locale
  const photoId = String(photo.id);
  const isLocalPhoto = photoId.startsWith('local-');
  
  // Construire l'URL de la photo
  const photoUrl = React.useMemo(() => {
    // ✅ PRIORITÉ 1: Si le backend a renvoyé une signed URL, l'utiliser
    if (photo.url) {
      console.log('🔐 [PhotoItem] Using signed URL from backend:', { id: photo.id, hasSignature: photo.url.includes('X-Goog-Signature') });
      return photo.url;
    }
    
    // ✅ PRIORITÉ 2: Photo locale (non uploadée)
    if (isLocalPhoto) {
      return photo.filename;
    }
    
    // ⚠️ FALLBACK: URL publique GCS (ne marchera que si bucket public)
    // Note: Nettoyer le path pour éviter les doubles slashes
    const path = (photo.filename || photo.filePath || photo.file_path || '').replace(/^\/+/, ''); // Enlever les / au début
    const gcsUrl = `https://storage.googleapis.com/swift-images/${path}`;
    console.warn('⚠️ [PhotoItem] No signed URL from backend, using direct GCS URL (will fail if bucket is private):', { id: photo.id, url: gcsUrl });
    return gcsUrl;
  }, [photo.url, isLocalPhoto, photo.filename, photo.filePath, photo.file_path, photo.id]);
  
  const handleImageError = React.useCallback((error: any) => {
    if (!imageError) {
      setImageError(true);
      console.error('❌ [PhotoItem] Image load error:', JSON.stringify({ 
        id: photo.id, 
        url: photoUrl, 
        errorMessage: error?.nativeEvent?.error || 'Unknown error',
        errorObject: error?.nativeEvent || error,
        hasSignedUrl: photo.url ? 'YES' : 'NO',
        filename: photo.filename
      }, null, 2));
    }
  }, [imageError, photo.id, photoUrl, photo.url, photo.filename]);
  
  const handleSaveDescription = () => {
    onEdit(photoId, editDescription);
    setShowEditModal(false);
  };
  
  const photoDate = formatPhotoDate(photo.capturedAt || photo.createdAt || photo.created_at);
  const stageLabel = formatStage(photo.stage);
  
  return (
    <>
      <Pressable
        onPress={onPress}
        style={{
          width: '48%',
          borderRadius: DESIGN_TOKENS.radius.md,
          overflow: 'hidden',
          backgroundColor: colors.background,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
          marginBottom: DESIGN_TOKENS.spacing.sm,
        }}
      >
        {/* Image */}
        <Image
          source={{ uri: photoUrl }}
          style={{ width: '100%', height: 140 }}
          resizeMode="cover"
          onError={handleImageError}
        />
        
        {/* Info section */}
        <View style={{
          padding: DESIGN_TOKENS.spacing.xs,
          backgroundColor: colors.background,
        }}>
          {/* Date et Stage */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            {photoDate ? (
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                {photoDate}
              </Text>
            ) : null}
            {stageLabel ? (
              <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '500' }}>
                {stageLabel}
              </Text>
            ) : null}
          </View>
          
          {/* Description avec bouton edit */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
            <Text 
              numberOfLines={2}
              style={{
                flex: 1,
                fontSize: 11,
                color: colors.text,
                lineHeight: 14
              }}
            >
              {photo.description || 'Sans description'}
            </Text>
            <Pressable 
              onPress={(e) => {
                e.stopPropagation();
                setEditDescription(photo.description || '');
                setShowEditModal(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={14} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </Pressable>
      
      {/* Modal d'édition de description */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setShowEditModal(false)}
        >
          <Pressable 
            style={{
              width: '85%',
              backgroundColor: colors.background,
              borderRadius: DESIGN_TOKENS.radius.lg,
              padding: DESIGN_TOKENS.spacing.lg,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.md
            }}>
              Modifier la description
            </Text>
            
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Ajoutez une description..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: DESIGN_TOKENS.radius.md,
                padding: DESIGN_TOKENS.spacing.sm,
                fontSize: 14,
                color: colors.text,
                minHeight: 80,
                textAlignVertical: 'top',
                backgroundColor: colors.backgroundSecondary,
                marginBottom: DESIGN_TOKENS.spacing.md
              }}
            />
            
            <View style={{ flexDirection: 'row', gap: DESIGN_TOKENS.spacing.sm }}>
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.sm,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: colors.backgroundSecondary,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border
                }}
              >
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
                  Annuler
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleSaveDescription}
                style={{
                  flex: 1,
                  padding: DESIGN_TOKENS.spacing.sm,
                  borderRadius: DESIGN_TOKENS.radius.md,
                  backgroundColor: colors.primary,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                  Sauvegarder
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export const JobPhotosSection: React.FC<JobPhotosSectionProps> = ({ jobId }) => {
  const { colors } = useCommonThemedStyles();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhotoAPI | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // ✅ Collapsible state
  
  const {
    photos,
    isLoading,
    error,
    uploadPhoto,
    updatePhotoDescription,
    deletePhoto,
    totalPhotos,
    refetch,
    // ✅ Pagination
    hasMore,
    loadMore,
    isLoadingMore
  } = useJobPhotos(jobId);

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

  // ✅ Render d'un item de la FlatList (2 colonnes)
  const renderPhotoItem = ({ item, index }: { item: JobPhotoAPI; index: number }) => {
    // Prendre 2 photos à la fois pour layout 2 colonnes
    if (index % 2 !== 0) return null;
    
    const photo1 = item;
    const photo2 = photos[index + 1];
    
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: DESIGN_TOKENS.spacing.sm
      }}>
        <PhotoItem
          photo={photo1}
          onPress={() => handlePhotoPress(photo1)}
          onEdit={handleEditDescription}
          onDelete={handleDeletePhoto}
        />
        
        {photo2 && (
          <PhotoItem
            photo={photo2}
            onPress={() => handlePhotoPress(photo2)}
            onEdit={handleEditDescription}
            onDelete={handleDeletePhoto}
          />
        )}
        {!photo2 && <View style={{ width: '48%' }} />}
      </View>
    );
  };

  // ✅ Footer pour infinite scroll
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={{ padding: DESIGN_TOKENS.spacing.md, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 12 }}>
          Chargement...
        </Text>
      </View>
    );
  };

  return (
    <>
      <Card style={{ padding: DESIGN_TOKENS.spacing.lg }}>
        <VStack gap="md">
          {/* Header avec toggle pour expand/collapse */}
          <Pressable 
            onPress={() => setIsExpanded(!isExpanded)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <SectionHeader 
              icon="camera-outline" 
              title="Photos" 
              badge={totalPhotos > 0 ? totalPhotos.toString() : undefined}
            />
            <Ionicons 
              name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
              size={24} 
              color={colors.textSecondary} 
            />
          </Pressable>
          
          {/* Contenu conditionnel (sans Collapsible complex) */}
          {isExpanded && (
            <>
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
              <FlatList
                data={photos}
                renderItem={renderPhotoItem}
                keyExtractor={(item) => String(item.id)}
                numColumns={1}
                scrollEnabled={false} // Désactiver scroll interne (on scroll la page parente)
                onEndReached={() => {
                  console.log('📸 [FlatList] onEndReached - hasMore:', hasMore, 'isLoadingMore:', isLoadingMore);
                  if (hasMore && !isLoadingMore) {
                    loadMore();
                  }
                }}
                onEndReachedThreshold={0.5} // Charger quand on atteint 50% de la fin
                ListFooterComponent={renderFooter}
                contentContainerStyle={{
                  paddingBottom: DESIGN_TOKENS.spacing.sm
                }}
              />
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
            </>
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
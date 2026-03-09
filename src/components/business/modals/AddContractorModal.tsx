/**
 * Modal pour rechercher et ajouter un prestataire (ABN)
 * Permet de rechercher par nom ou ABN et l'ajouter au staff
 */
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useTheme } from '../../../context/ThemeProvider';
import { useTranslation } from '../../../localization';
import { Contractor } from '../../../types/staff';
import { HStack, VStack } from '../../primitives/Stack';

interface AddContractorModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (searchTerm: string) => Promise<Contractor[]>;
  onAdd: (contractorId: string, contractStatus: Contractor['contractStatus']) => Promise<void>;
}

type SearchStep = 'search' | 'results' | 'contract';

export default function AddContractorModal({ visible, onClose, onSearch, onAdd }: AddContractorModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [step, setStep] = useState<SearchStep>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Contractor[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [contractStatus, setContractStatus] = useState<Contractor['contractStatus']>('standard');
  const [isLoading, setIsLoading] = useState(false);

  const contractStatuses = [
    { key: 'exclusive', label: 'Exclusif', description: 'Travaille uniquement pour votre entreprise' },
    { key: 'non-exclusive', label: 'Non-exclusif', description: 'Peut travailler pour d\'autres entreprises' },
    { key: 'preferred', label: 'Préférentiel', description: 'Prestataire privilégié avec conditions avantageuses' },
    { key: 'standard', label: 'Standard', description: 'Relation contractuelle standard' },
  ] as const;

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert(t('businessModals.addContractor.errorTitle'), t('businessModals.addContractor.missingSearchTerm'));
      return;
    }

    try {
      setIsLoading(true);
      const results = await onSearch(searchTerm);
      setSearchResults(results);
      setStep('results');

      if (results.length === 0) {
        Alert.alert(t('businessModals.addContractor.noResultsTitle'), t('businessModals.addContractor.noResultsMessage'));
      }
    } catch (error) {

      Alert.alert(t('businessModals.addContractor.errorTitle'), t('businessModals.addContractor.searchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectContractor = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setStep('contract');
  };

  const handleAddContractor = async () => {
    if (!selectedContractor) return;

    try {
      setIsLoading(true);
      await onAdd(selectedContractor.id, contractStatus);
      
      Alert.alert(
        t('businessModals.addContractor.addedTitle'),
        t('businessModals.addContractor.addedMessage', {
          firstName: selectedContractor.firstName,
          lastName: selectedContractor.lastName,
          status: contractStatuses.find(s => s.key === contractStatus)?.label,
        }),
        [{ text: t('common.ok'), onPress: handleClose }]
      );
    } catch (error) {

      Alert.alert(t('businessModals.addContractor.errorTitle'), t('businessModals.addContractor.addError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('search');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedContractor(null);
    setContractStatus('standard');
    onClose();
  };

  const renderSearchStep = () => (
    <VStack gap="lg">
      <HStack justify="space-between" align="center">
        <Text 
          testID="modal-title"
          style={{
            fontSize: 20,
            fontWeight: '600',
            color: colors.text,
          }}
        >
          Rechercher un Prestataire
        </Text>
        <TouchableOpacity testID="close-button" onPress={handleClose}>
          <Text style={{ fontSize: 24, color: colors.textSecondary }}>×</Text>
        </TouchableOpacity>
      </HStack>

      <VStack gap="md">
        <Text 
          testID="search-instructions"
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
          }}
        >
          Recherchez un prestataire par son nom complet ou son ABN. ⚠️ Les ABN ne sont pas affichés, la recherche ne fonctionne qu'avec un ABN complet.
        </Text>

        <VStack gap="xs">
          <Text 
            testID="name-label"
            style={{ fontSize: 14, fontWeight: '600', color: colors.text }}
          >
            Nom et prénom ou ABN
          </Text>
          <TextInput
            testID="search-input"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: DESIGN_TOKENS.radius.md,
              padding: DESIGN_TOKENS.spacing.md,
              fontSize: 16,
              color: colors.text,
            }}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="John Smith ou 12 345 678 901"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
          />
        </VStack>

        <View 
          testID="search-tips"
          style={{
            backgroundColor: colors.backgroundSecondary + '60',
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.md,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          }}
        >
          <Text 
            testID="search-tips-title"
            style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 }}
          >
            💡 Conseils de recherche :
          </Text>
          <Text 
            testID="search-tips-content"
            style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}
          >
            • Pour le nom : "John Smith" ou "Smith"{'\n'}
            • Pour l'ABN : saisir les 11 chiffres complets{'\n'}
            • La recherche est sensible à la casse
          </Text>
        </View>
      </VStack>

      <HStack gap="md">
        <TouchableOpacity
          testID="cancel-button"
          onPress={handleClose}
          style={{
            flex: 1,
            backgroundColor: colors.backgroundSecondary,
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
            Annuler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="search-button"
          onPress={handleSearch}
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.md,
            alignItems: 'center',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
              Rechercher
            </Text>
          )}
        </TouchableOpacity>
      </HStack>
    </VStack>
  );

  const renderResultsStep = () => (
    <VStack gap="lg">
      <HStack justify="space-between" align="center">
        <TouchableOpacity testID="back-button" onPress={() => setStep('search')}>
          <Text style={{ fontSize: 18, color: colors.primary }}>← Retour</Text>
        </TouchableOpacity>
        <Text 
          testID="results-title"
          style={{
            fontSize: 20,
            fontWeight: '600',
            color: colors.text,
          }}
        >
          Résultats ({searchResults.length})
        </Text>
        <TouchableOpacity testID="close-button" onPress={handleClose}>
          <Text style={{ fontSize: 24, color: colors.textSecondary }}>×</Text>
        </TouchableOpacity>
      </HStack>

      <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
        <VStack gap="md">
          {searchResults.map((contractor) => (
            <TouchableOpacity
              key={contractor.id}
              testID={`contractor-card-${contractor.id}`}
              onPress={() => handleSelectContractor(contractor)}
              style={{
                backgroundColor: colors.backgroundSecondary,
                padding: DESIGN_TOKENS.spacing.md,
                borderRadius: DESIGN_TOKENS.radius.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <VStack gap="sm">
                <HStack justify="space-between" align="center">
                  <Text 
                    testID={`contractor-name-${contractor.id}`}
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.text,
                    }}
                  >
                    {contractor.firstName} {contractor.lastName}
                  </Text>
                  {contractor.isVerified && (
                    <View 
                      testID={`contractor-verified-${contractor.id}`}
                      style={{
                        backgroundColor: colors.success,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: colors.background, fontWeight: '600' }}>
                        VÉRIFIÉ
                      </Text>
                    </View>
                  )}
                </HStack>
                
                <Text 
                  testID={`contractor-role-${contractor.id}`}
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                  }}
                >
                  {contractor.role}
                </Text>
                
                <HStack justify="space-between">
                  <Text 
                    testID={`contractor-rate-${contractor.id}`}
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    Taux: ${contractor.rate}/{contractor.rateType === 'hourly' ? 'h' : 'projet'}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: colors.primary,
                    fontWeight: '600',
                  }}>
                    Sélectionner →
                  </Text>
                </HStack>
              </VStack>
            </TouchableOpacity>
          ))}
        </VStack>
      </ScrollView>
    </VStack>
  );

  const renderContractStep = () => (
    <VStack gap="lg">
      <HStack justify="space-between" align="center">
        <TouchableOpacity testID="back-button" onPress={() => setStep('results')}>
          <Text style={{ fontSize: 18, color: colors.primary }}>← Retour</Text>
        </TouchableOpacity>
        <Text 
          testID="contract-title"
          style={{
            fontSize: 20,
            fontWeight: '600',
            color: colors.text,
          }}
        >
          Statut du Contrat
        </Text>
        <TouchableOpacity testID="close-button" onPress={handleClose}>
          <Text style={{ fontSize: 24, color: colors.textSecondary }}>×</Text>
        </TouchableOpacity>
      </HStack>

      {selectedContractor && (
        <View 
          testID="summary-section"
          style={{
            backgroundColor: colors.backgroundSecondary,
            padding: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.md,
          }}
        >
          <Text 
            testID="summary-name"
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {selectedContractor.firstName} {selectedContractor.lastName}
          </Text>
          <Text 
            testID="summary-details"
            style={{
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            {selectedContractor.role} • ${selectedContractor.rate}/{selectedContractor.rateType === 'hourly' ? 'h' : 'projet'}
          </Text>
        </View>
      )}

      <VStack gap="md">
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          Choisissez le type de relation contractuelle :
        </Text>

        {contractStatuses.map((status) => (
          <TouchableOpacity
            key={status.key}
            testID={`contract-option-${status.key}`}
            onPress={() => setContractStatus(status.key)}
            style={{
              backgroundColor: contractStatus === status.key ? colors.primary + '20' : colors.backgroundSecondary,
              padding: DESIGN_TOKENS.spacing.md,
              borderRadius: DESIGN_TOKENS.radius.md,
              borderWidth: contractStatus === status.key ? 2 : 1,
              borderColor: contractStatus === status.key ? colors.primary : colors.border,
            }}
          >
            <VStack gap="xs">
              <HStack justify="space-between" align="center">
                <Text 
                  testID={`contract-label-${status.key}`}
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: contractStatus === status.key ? colors.primary : colors.text,
                  }}
                >
                  {status.label}
                </Text>
                {contractStatus === status.key && (
                  <View 
                    testID="selected-checkmark"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>✓</Text>
                  </View>
                )}
              </HStack>
              <Text 
                testID={`contract-description-${status.key}`}
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                {status.description}
              </Text>
            </VStack>
          </TouchableOpacity>
        ))}
      </VStack>

      <HStack gap="md">
        <TouchableOpacity
          testID="back-to-results-button"
          onPress={() => setStep('results')}
          style={{
            flex: 1,
            backgroundColor: colors.backgroundSecondary,
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
            Retour
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="add-button"
          onPress={handleAddContractor}
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            paddingVertical: DESIGN_TOKENS.spacing.md,
            borderRadius: DESIGN_TOKENS.radius.md,
            alignItems: 'center',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={{ color: colors.background, fontSize: 16, fontWeight: '600' }}>
              Ajouter au Staff
            </Text>
          )}
        </TouchableOpacity>
      </HStack>
    </VStack>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: DESIGN_TOKENS.spacing.lg,
      }}>
        <View style={{
          backgroundColor: colors.background,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.lg,
          width: '100%',
          maxHeight: '90%',
        }}>
          {step === 'search' && renderSearchStep()}
          {step === 'results' && renderResultsStep()}
          {step === 'contract' && renderContractStep()}
        </View>
      </View>
    </Modal>
  );
}
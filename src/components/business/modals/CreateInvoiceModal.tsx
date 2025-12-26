/**
 * CreateInvoiceModal - Modal pour créer des factures de déménagement
 * Spécialisé pour le secteur du déménagement australien avec calculs automatiques
 */
import React, { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Components
import { HStack, VStack } from '../../primitives/Stack';

// Hooks & Utils
import { DESIGN_TOKENS } from '../../../constants/Styles';
import { useTheme } from '../../../context/ThemeProvider';

// Types
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  jobType: 'residential' | 'commercial' | 'interstate' | 'storage' | 'packing' | 'specialty';
  moveDate: string;
  fromAddress: string;
  toAddress: string;
  items: InvoiceItem[];
  taxRate: number;
  notes: string;
  paymentTerms: 'immediate' | '7-days' | '14-days' | '30-days';
}

interface CreateInvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (invoice: Invoice) => void;
}

// Données de référence
const JOB_TYPES = [
  { id: 'residential', label: 'Residential', emoji: '🏠' },
  { id: 'commercial', label: 'Commercial', emoji: '🏢' },
  { id: 'interstate', label: 'Interstate', emoji: '🛣️' },
  { id: 'storage', label: 'Storage', emoji: '📦' },
  { id: 'packing', label: 'Packing', emoji: '📋' },
  { id: 'specialty', label: 'Specialty', emoji: '🎹' },
] as const;

const PAYMENT_TERMS = [
  { id: 'immediate', label: 'Due on Completion', description: 'Payment required immediately' },
  { id: '7-days', label: '7 Days Net', description: 'Payment due within 7 days' },
  { id: '14-days', label: '14 Days Net', description: 'Payment due within 14 days' },
  { id: '30-days', label: '30 Days Net', description: 'Payment due within 30 days' },
] as const;

const DEFAULT_INVOICE_ITEMS: Omit<InvoiceItem, 'id'>[] = [
  { description: 'Moving Service - Base Rate', quantity: 1, rate: 150.00, amount: 150.00 },
  { description: 'Labour (per hour)', quantity: 4, rate: 85.00, amount: 340.00 },
  { description: 'Truck Rental', quantity: 1, rate: 120.00, amount: 120.00 },
];

const COMMON_SERVICES = [
  { description: 'Moving Service - Base Rate', rate: 150.00 },
  { description: 'Labour (per hour)', rate: 85.00 },
  { description: 'Truck Rental - Small', rate: 120.00 },
  { description: 'Truck Rental - Large', rate: 180.00 },
  { description: 'Packing Service (per hour)', rate: 75.00 },
  { description: 'Unpacking Service (per hour)', rate: 65.00 },
  { description: 'Disassembly/Assembly', rate: 95.00 },
  { description: 'Piano Moving', rate: 250.00 },
  { description: 'Storage (per month)', rate: 120.00 },
  { description: 'Interstate Surcharge', rate: 300.00 },
  { description: 'Packing Materials', rate: 45.00 },
  { description: 'Insurance Premium', rate: 25.00 },
];

// Taux de GST australien
const GST_RATE = 10; // 10% GST en Australie

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  
  // État du formulaire
  const [formData, setFormData] = useState<Invoice>({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    jobType: 'residential',
    moveDate: '',
    fromAddress: '',
    toAddress: '',
    items: DEFAULT_INVOICE_ITEMS.map((item, index) => ({
      id: `item-${index}`,
      ...item,
    })),
    taxRate: GST_RATE,
    notes: '',
    paymentTerms: '7-days',
  });// États pour les erreurs et l'UI
  const [errors, setErrors] = useState<Partial<Record<keyof Invoice, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServicesList, setShowServicesList] = useState(false);

  // Calculs automatiques
  const calculations = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (formData.taxRate / 100);
    const total = subtotal + taxAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    };
  }, [formData.items, formData.taxRate]);

  // Styles
  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.lg,
      width: '95%',
      maxHeight: '90%',
      paddingVertical: DESIGN_TOKENS.spacing.xl,
      paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    },
    header: {
      marginBottom: DESIGN_TOKENS.spacing.xl,
    },
    title: {
      fontSize: DESIGN_TOKENS.typography.title.fontSize,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    section: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    formGroup: {
      marginBottom: DESIGN_TOKENS.spacing.md,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    requiredStar: {
      color: colors.error || '#EF4444',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: colors.error || '#EF4444',
    },
    errorText: {
      fontSize: 12,
      color: colors.error || '#EF4444',
      marginTop: DESIGN_TOKENS.spacing.xs,
    },
    jobTypeButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      marginRight: DESIGN_TOKENS.spacing.sm,
      alignItems: 'center',
      minWidth: 80,
    },
    selectedJobTypeButton: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    jobTypeEmoji: {
      fontSize: 20,
      marginBottom: 2,
    },
    jobTypeText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    selectedJobTypeText: {
      color: colors.primary,
      fontWeight: '600',
    },
    paymentTermButton: {
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      borderRadius: DESIGN_TOKENS.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      marginRight: DESIGN_TOKENS.spacing.sm,
      marginBottom: DESIGN_TOKENS.spacing.sm,
      flex: 1,
    },
    selectedPaymentTermButton: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    paymentTermText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    selectedPaymentTermText: {
      color: colors.primary,
      fontWeight: '600',
    },
    paymentTermDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    itemsContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: DESIGN_TOKENS.radius.md,
      overflow: 'hidden',
    },
    itemsHeader: {
      flexDirection: 'row',
      backgroundColor: colors.primary + '10',
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
    },
    headerCell: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    descriptionHeader: { flex: 3 },
    qtyHeader: { flex: 1, textAlign: 'center' },
    rateHeader: { flex: 1.5, textAlign: 'right' },
    amountHeader: { flex: 1.5, textAlign: 'right' },
    actionHeader: { width: 40 },
    invoiceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemInput: {
      fontSize: 14,
      color: colors.text,
      padding: DESIGN_TOKENS.spacing.xs,
      borderWidth: 1,
      borderColor: 'transparent',
      borderRadius: 4,
    },
    focusedItemInput: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '05',
    },
    itemDescription: { flex: 3 },
    itemQty: { flex: 1, textAlign: 'center' },
    itemRate: { flex: 1.5, textAlign: 'right' },
    itemAmount: { flex: 1.5, textAlign: 'right', color: colors.textSecondary },
    deleteButton: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.xs,
    },
    deleteButtonText: {
      fontSize: 18,
      color: colors.error || '#EF4444',
      fontWeight: '600',
    },
    addItemButton: {
      backgroundColor: colors.primary,
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      alignItems: 'center',
      marginTop: DESIGN_TOKENS.spacing.md,
    },
    addItemButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    servicesModal: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    servicesContent: {
      backgroundColor: colors.background,
      borderRadius: DESIGN_TOKENS.radius.lg,
      width: '90%',
      maxHeight: '70%',
      padding: DESIGN_TOKENS.spacing.lg,
    },
    servicesTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: DESIGN_TOKENS.spacing.md,
      textAlign: 'center',
    },
    serviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.sm,
      paddingHorizontal: DESIGN_TOKENS.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    serviceDescription: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    serviceRate: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    totalsContainer: {
      borderTopWidth: 2,
      borderTopColor: colors.primary,
      paddingTop: DESIGN_TOKENS.spacing.md,
      marginTop: DESIGN_TOKENS.spacing.md,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: DESIGN_TOKENS.spacing.xs,
    },
    totalLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    totalValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    grandTotalRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: DESIGN_TOKENS.spacing.sm,
      marginTop: DESIGN_TOKENS.spacing.sm,
    },
    grandTotalLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '700',
    },
    grandTotalValue: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '700',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: DESIGN_TOKENS.spacing.md,
      marginTop: DESIGN_TOKENS.spacing.xl,
    },
    button: {
      flex: 1,
      paddingVertical: DESIGN_TOKENS.spacing.md,
      borderRadius: DESIGN_TOKENS.radius.md,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.textSecondary + '20',
      borderWidth: 1,
      borderColor: colors.textSecondary + '40',
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.textSecondary,
    },
    submitButtonText: {
      color: 'white',
    },
    disabledButton: {
      backgroundColor: colors.textSecondary + '40',
    },
    helpText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: DESIGN_TOKENS.spacing.xs,
      fontStyle: 'italic',
    },
  });// Mise à jour des données du formulaire
  const updateFormData = (field: keyof Invoice, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Supprimer l'erreur quand l'utilisateur corrige
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Gestion des items
  const updateItem = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculer le montant si quantité ou taux change
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.rate);
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addItem = (serviceItem?: { description: string; rate: number }) => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: serviceItem?.description || 'New Service',
      quantity: 1,
      rate: serviceItem?.rate || 0,
      amount: serviceItem?.rate || 0,
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    if (showServicesList) {
      setShowServicesList(false);
    }
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Invoice, string>> = {};

    // Champs requis
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.clientEmail)) {
        newErrors.clientEmail = 'Invalid email format';
      }
    }
    
    if (!formData.moveDate.trim()) {
      newErrors.moveDate = 'Move date is required';
    }
    
    if (!formData.fromAddress.trim()) {
      newErrors.fromAddress = 'From address is required';
    }
    
    if (!formData.toAddress.trim()) {
      newErrors.toAddress = 'To address is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      
      // Reset du formulaire
      setFormData({
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        jobType: 'residential',
        moveDate: '',
        fromAddress: '',
        toAddress: '',
        items: DEFAULT_INVOICE_ITEMS.map((item, index) => ({
          id: `item-${index}`,
          ...item,
        })),
        taxRate: GST_RATE,
        notes: '',
        paymentTerms: '7-days',
      });
      
      onClose();
      
      Alert.alert('Success', 'Invoice created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermeture de la modal
  const handleCancel = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      jobType: 'residential',
      moveDate: '',
      fromAddress: '',
      toAddress: '',
      items: DEFAULT_INVOICE_ITEMS.map((item, index) => ({
        id: `item-${index}`,
        ...item,
      })),
      taxRate: GST_RATE,
      notes: '',
      paymentTerms: '7-days',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Invoice</Text>
            <Text style={styles.subtitle}>
              Generate invoice for moving services
            </Text>
          </View>

          {/* Formulaire */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Client Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client Information</Text>
              
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>
                  Client Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.clientName && styles.inputError]}
                  value={formData.clientName}
                  onChangeText={(text) => updateFormData('clientName', text)}
                  placeholder="John Smith"
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.clientName && (
                  <Text style={styles.errorText}>{errors.clientName}</Text>
                )}
              </VStack>

              <VStack style={styles.formGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.clientEmail && styles.inputError]}
                  value={formData.clientEmail}
                  onChangeText={(text) => updateFormData('clientEmail', text)}
                  placeholder="john.smith@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.clientEmail && (
                  <Text style={styles.errorText}>{errors.clientEmail}</Text>
                )}
              </VStack>

              <VStack style={styles.formGroup}>
                <Text style={styles.label}>Client Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.clientAddress}
                  onChangeText={(text) => updateFormData('clientAddress', text)}
                  placeholder="123 Main St, Sydney NSW 2000"
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={colors.textSecondary + '80'}
                />
              </VStack>
            </View>

            {/* Job Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Details</Text>
              
              {/* Job Type */}
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>Job Type</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={{ marginVertical: DESIGN_TOKENS.spacing.sm }}
                >
                  <HStack gap="sm">
                    {JOB_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.jobTypeButton,
                          formData.jobType === type.id && styles.selectedJobTypeButton
                        ]}
                        onPress={() => updateFormData('jobType', type.id)}
                      >
                        <Text style={styles.jobTypeEmoji}>{type.emoji}</Text>
                        <Text style={[
                          styles.jobTypeText,
                          formData.jobType === type.id && styles.selectedJobTypeText
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </HStack>
                </ScrollView>
              </VStack>

              {/* Move Date */}
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>
                  Move Date <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.moveDate && styles.inputError]}
                  value={formData.moveDate}
                  onChangeText={(text) => updateFormData('moveDate', text)}
                  placeholder="25 Oct 2024"
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.moveDate && (
                  <Text style={styles.errorText}>{errors.moveDate}</Text>
                )}
              </VStack>

              {/* Addresses */}
              <VStack style={styles.formGroup}>
                <Text style={styles.label}>
                  From Address <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.fromAddress && styles.inputError]}
                  value={formData.fromAddress}
                  onChangeText={(text) => updateFormData('fromAddress', text)}
                  placeholder="123 Old St, Sydney NSW 2000"
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.fromAddress && (
                  <Text style={styles.errorText}>{errors.fromAddress}</Text>
                )}
              </VStack>

              <VStack style={styles.formGroup}>
                <Text style={styles.label}>
                  To Address <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.toAddress && styles.inputError]}
                  value={formData.toAddress}
                  onChangeText={(text) => updateFormData('toAddress', text)}
                  placeholder="456 New St, Melbourne VIC 3000"
                  placeholderTextColor={colors.textSecondary + '80'}
                />
                {errors.toAddress && (
                  <Text style={styles.errorText}>{errors.toAddress}</Text>
                )}
              </VStack>
            </View>

            {/* Invoice Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invoice Items</Text>
              
              <View style={styles.itemsContainer}>
                {/* Header */}
                <View style={styles.itemsHeader}>
                  <Text style={[styles.headerCell, styles.descriptionHeader]}>Description</Text>
                  <Text style={[styles.headerCell, styles.qtyHeader]}>Qty</Text>
                  <Text style={[styles.headerCell, styles.rateHeader]}>Rate</Text>
                  <Text style={[styles.headerCell, styles.amountHeader]}>Amount</Text>
                  <View style={styles.actionHeader} />
                </View>

                {/* Items */}
                {formData.items.map((item) => (
                  <View key={item.id} style={styles.invoiceItem}>
                    <TextInput
                      style={[styles.itemInput, styles.itemDescription]}
                      value={item.description}
                      onChangeText={(text) => updateItem(item.id, 'description', text)}
                      placeholder="Service description"
                      placeholderTextColor={colors.textSecondary + '80'}
                    />
                    
                    <TextInput
                      style={[styles.itemInput, styles.itemQty]}
                      value={item.quantity.toString()}
                      onChangeText={(text) => updateItem(item.id, 'quantity', parseInt(text) || 0)}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={colors.textSecondary + '80'}
                    />
                    
                    <TextInput
                      style={[styles.itemInput, styles.itemRate]}
                      value={item.rate.toString()}
                      onChangeText={(text) => updateItem(item.id, 'rate', parseFloat(text) || 0)}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={colors.textSecondary + '80'}
                    />
                    
                    <Text style={[styles.itemInput, styles.itemAmount]}>
                      ${item.amount.toFixed(2)}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeItem(item.id)}
                      disabled={formData.items.length === 1}
                    >
                      <Text style={[
                        styles.deleteButtonText,
                        formData.items.length === 1 && { color: colors.textSecondary + '50' }
                      ]}>
                        ×
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Add Item Button */}
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={() => setShowServicesList(true)}
              >
                <Text style={styles.addItemButtonText}>+ Add Service</Text>
              </TouchableOpacity>

              {/* Totals */}
              <View style={styles.totalsContainer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={styles.totalValue}>${calculations.subtotal}</Text>
                </View>
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>GST ({formData.taxRate}%):</Text>
                  <Text style={styles.totalValue}>${calculations.taxAmount}</Text>
                </View>
                
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total:</Text>
                  <Text style={styles.grandTotalValue}>${calculations.total}</Text>
                </View>
              </View>
            </View>

            {/* Payment Terms */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Terms</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: DESIGN_TOKENS.spacing.sm }}>
                {PAYMENT_TERMS.map((term) => (
                  <TouchableOpacity
                    key={term.id}
                    style={[
                      styles.paymentTermButton,
                      formData.paymentTerms === term.id && styles.selectedPaymentTermButton
                    ]}
                    onPress={() => updateFormData('paymentTerms', term.id)}
                  >
                    <Text style={[
                      styles.paymentTermText,
                      formData.paymentTerms === term.id && styles.selectedPaymentTermText
                    ]}>
                      {term.label}
                    </Text>
                    <Text style={styles.paymentTermDescription}>
                      {term.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => updateFormData('notes', text)}
                placeholder="Any additional notes or terms..."
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSecondary + '80'}
              />
            </View>
          </ScrollView>

          {/* Boutons */}
          <HStack gap="md" style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isSubmitting}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </Text>
            </TouchableOpacity>
          </HStack>
        </View>

        {/* Services Selection Modal */}
        {showServicesList && (
          <View style={styles.servicesModal}>
            <View style={styles.servicesContent}>
              <Text style={styles.servicesTitle}>Select Service</Text>
              <ScrollView>
                {COMMON_SERVICES.map((service, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.serviceItem}
                    onPress={() => addItem(service)}
                  >
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                    <Text style={styles.serviceRate}>${service.rate.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.serviceItem}
                  onPress={() => addItem()}
                >
                  <Text style={[styles.serviceDescription, { fontStyle: 'italic' }]}>
                    Custom Service
                  </Text>
                  <Text style={styles.serviceRate}>$0.00</Text>
                </TouchableOpacity>
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.addItemButton, { marginTop: DESIGN_TOKENS.spacing.lg }]}
                onPress={() => setShowServicesList(false)}
              >
                <Text style={styles.addItemButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateInvoiceModal;
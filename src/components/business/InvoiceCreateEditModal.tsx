/**
 * InvoiceCreateEditModal - Modal pour créer/éditer des factures
 */

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeProvider_Advanced';
import { Button, Card, Input } from '../../design-system/components';
import { DESIGN_TOKENS } from '../../design-system/tokens';

export interface Invoice {
  id?: string;
  number: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  createdAt?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceCreateEditModalProps {
  visible: boolean;
  invoice?: Invoice | null;
  onSave: (invoice: Invoice) => Promise<void>;
  onCancel: () => void;
  onDelete?: (invoiceId: string) => Promise<void>;
}

const InvoiceCreateEditModal: React.FC<InvoiceCreateEditModalProps> = ({
  visible,
  invoice,
  onSave,
  onCancel,
  onDelete,
}) => {
  const { colors } = useTheme();
  const [loading, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Invoice>>({
    number: '',
    clientName: '',
    clientEmail: '',
    amount: 0,
    description: '',
    dueDate: '',
    status: 'draft',
    items: [],
  });// Initialize form when invoice changes
  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    } else {
      // Reset form for new invoice
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      
      setFormData({
        number: `INV-${Date.now()}`,
        clientName: '',
        clientEmail: '',
        amount: 0,
        description: '',
        dueDate: nextMonth.toISOString().split('T')[0],
        status: 'draft',
        items: [
          {
            id: '1',
            description: '',
            quantity: 1,
            unitPrice: 0,
            total: 0,
          }
        ],
      });
    }
  }, [invoice, visible]);

  const updateFormField = (field: keyof Invoice, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const updateInvoiceItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => {
      const updatedItems = (prev.items || []).map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate total if quantity or unitPrice changed
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      });// Recalculate total amount
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: updatedItems,
        amount: totalAmount,
      };
    });
  };

  const removeInvoiceItem = (itemId: string) => {
    setFormData(prev => {
      const updatedItems = (prev.items || []).filter(item => item.id !== itemId);
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: updatedItems,
        amount: totalAmount,
      };
    });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.clientName || !formData.clientEmail || !formData.description) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if ((formData.items || []).length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins un élément à la facture');
      return;
    }

    try {
      setSaving(true);
      await onSave(formData as Invoice);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la facture');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice?.id || !onDelete) return;

    Alert.alert(
      'Supprimer la facture',
      'Êtes-vous sûr de vouloir supprimer cette facture ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await onDelete(invoice.id!);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: DESIGN_TOKENS.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <Text style={{
            fontSize: DESIGN_TOKENS.typography.fontSize.xl,
            fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
            color: colors.text,
          }}>
            {invoice ? 'Éditer la facture' : 'Nouvelle facture'}
          </Text>
          
          <TouchableOpacity onPress={onCancel}>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.lg,
              color: colors.primary,
            }}>
              Annuler
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: DESIGN_TOKENS.spacing.lg }}>
          {/* Client Information */}
          <Card padding="lg" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.lg,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}>
              Informations client
            </Text>
            
            <Input
              label="Nom du client *"
              value={formData.clientName}
              onChangeText={(value) => updateFormField('clientName', value)}
              style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
            />
            
            <Input
              label="Email du client *"
              value={formData.clientEmail}
              onChangeText={(value) => updateFormField('clientEmail', value)}
              keyboardType="email-address"
            />
          </Card>

          {/* Invoice Details */}
          <Card padding="lg" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            <Text style={{
              fontSize: DESIGN_TOKENS.typography.fontSize.lg,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: colors.text,
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}>
              Détails de la facture
            </Text>
            
            <Input
              label="Numéro de facture"
              value={formData.number}
              onChangeText={(value) => updateFormField('number', value)}
              style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
            />
            
            <Input
              label="Description *"
              value={formData.description}
              onChangeText={(value) => updateFormField('description', value)}
              multiline
              numberOfLines={3}
              style={{ marginBottom: DESIGN_TOKENS.spacing.md }}
            />
            
            <Input
              label="Date d'échéance"
              value={formData.dueDate}
              onChangeText={(value) => updateFormField('dueDate', value)}
              placeholder="YYYY-MM-DD"
            />
          </Card>

          {/* Invoice Items */}
          <Card padding="lg" style={{ marginBottom: DESIGN_TOKENS.spacing.lg }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}>
              <Text style={{
                fontSize: DESIGN_TOKENS.typography.fontSize.lg,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: colors.text,
              }}>
                Éléments ({(formData.items || []).length})
              </Text>
              
              <Button
                title="Ajouter"
                variant="outline"
                size="sm"
                onPress={addInvoiceItem}
              />
            </View>
            
            {(formData.items || []).map((item, index) => (
              <View key={item.id} style={{
                padding: DESIGN_TOKENS.spacing.md,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: DESIGN_TOKENS.borderRadius.md,
                marginBottom: DESIGN_TOKENS.spacing.sm,
              }}>
                <Input
                  label="Description"
                  value={item.description}
                  onChangeText={(value) => updateInvoiceItem(item.id, 'description', value)}
                  style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}
                />
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: DESIGN_TOKENS.spacing.sm,
                }}>
                  <Input
                    label="Quantité"
                    value={item.quantity.toString()}
                    onChangeText={(value) => updateInvoiceItem(item.id, 'quantity', parseInt(value) || 0)}
                    keyboardType="numeric"
                    style={{ flex: 1, marginRight: DESIGN_TOKENS.spacing.sm }}
                  />
                  
                  <Input
                    label="Prix unitaire"
                    value={item.unitPrice.toString()}
                    onChangeText={(value) => updateInvoiceItem(item.id, 'unitPrice', parseFloat(value) || 0)}
                    keyboardType="numeric"
                    style={{ flex: 1 }}
                  />
                </View>
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: DESIGN_TOKENS.typography.fontSize.md,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                    color: colors.text,
                  }}>
                    Total: {item.total.toFixed(2)} €
                  </Text>
                  
                  {(formData.items || []).length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeInvoiceItem(item.id)}
                      style={{
                        padding: DESIGN_TOKENS.spacing.xs,
                        backgroundColor: colors.error,
                        borderRadius: DESIGN_TOKENS.borderRadius.sm,
                      }}
                    >
                      <Text style={{
                        color: colors.background,
                        fontSize: DESIGN_TOKENS.typography.fontSize.sm,
                      }}>
                        Supprimer
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            
            <View style={{
              marginTop: DESIGN_TOKENS.spacing.md,
              paddingTop: DESIGN_TOKENS.spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
              <Text style={{
                fontSize: DESIGN_TOKENS.typography.fontSize.lg,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
                color: colors.text,
                textAlign: 'right',
              }}>
                Total facture: {formData.amount?.toFixed(2)} €
              </Text>
            </View>
          </Card>
        </ScrollView>

        {/* Actions */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: DESIGN_TOKENS.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
          {invoice?.id && onDelete && (
            <Button
              title="Supprimer"
              variant="outline"
              onPress={handleDelete}
              disabled={loading}
              style={{ flex: 0.3 }}
            />
          )}
          
          <View style={{
            flexDirection: 'row',
            flex: invoice?.id && onDelete ? 0.65 : 1,
            justifyContent: 'flex-end',
          }}>
            <Button
              title="Annuler"
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
              style={{ marginRight: DESIGN_TOKENS.spacing.md, flex: 1 }}
            />
            
            <Button
              title={loading ? 'Sauvegarde...' : 'Sauvegarder'}
              variant="primary"
              onPress={handleSave}
              disabled={loading}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InvoiceCreateEditModal;
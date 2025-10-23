/**
 * useInvoices - Hook pour la gestion des factures
 * Gère l'état des factures avec API intégrée
 */
import { useCallback, useEffect, useState } from 'react';
import {
    createInvoice,
    deleteInvoice,
    fetchInvoiceDetails,
    fetchInvoices,
    markInvoiceAsPaid,
    sendInvoice,
    updateInvoice,
    type Invoice,
    type InvoiceCreateData,
} from '../../services/business';

interface UseInvoicesReturn {
  // État
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  
  // États de chargement
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSending: boolean;
  
  // État d'erreur
  error: string | null;
  
  // Actions
  loadInvoices: () => Promise<void>;
  loadInvoiceDetails: (invoiceId: string) => Promise<void>;
  createNewInvoice: (invoiceData: InvoiceCreateData) => Promise<Invoice | null>;
  updateInvoiceData: (invoiceId: string, updates: Partial<InvoiceCreateData>) => Promise<Invoice | null>;
  sendInvoiceToClient: (invoiceId: string, clientEmail: string) => Promise<void>;
  markAsPaid: (invoiceId: string, paymentDetails?: { method?: string; reference?: string; date?: string }) => Promise<void>;
  removeInvoice: (invoiceId: string) => Promise<void>;
  refreshInvoices: () => Promise<void>;
  clearError: () => void;
  setCurrentInvoice: (invoice: Invoice | null) => void;
  
  // Utilitaires
  getInvoicesByStatus: (status: Invoice['status']) => Invoice[];
  getOverdueInvoices: () => Invoice[];
  searchInvoices: (query: string) => Invoice[];
  getInvoiceStats: () => {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
}

export const useInvoices = (): UseInvoicesReturn => {
  // États
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // État d'erreur
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge la liste des factures
   */
  const loadInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const invoicesList = await fetchInvoices();
      setInvoices(invoicesList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invoices';
      setError(errorMessage);
      console.error('Error loading invoices:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Charge les détails d'une facture spécifique
   */
  const loadInvoiceDetails = useCallback(async (invoiceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const invoice = await fetchInvoiceDetails(invoiceId);
      setCurrentInvoice(invoice);
      
      // Mettre à jour la liste si la facture existe
      setInvoices(prev => 
        prev.map(inv => inv.id === invoiceId ? invoice : inv)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invoice details';
      setError(errorMessage);
      console.error('Error loading invoice details:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crée une nouvelle facture
   */
  const createNewInvoice = useCallback(async (
    invoiceData: InvoiceCreateData
  ): Promise<Invoice | null> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const newInvoice = await createInvoice(invoiceData);
      
      // Ajouter à la liste
      setInvoices(prev => [...prev, newInvoice]);
      
      return newInvoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMessage);
      console.error('Error creating invoice:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Met à jour une facture existante
   */
  const updateInvoiceData = useCallback(async (
    invoiceId: string,
    updates: Partial<InvoiceCreateData>
  ): Promise<Invoice | null> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedInvoice = await updateInvoice(invoiceId, updates);
      
      // Mettre à jour la liste
      setInvoices(prev => 
        prev.map(inv => inv.id === invoiceId ? updatedInvoice : inv)
      );
      
      // Mettre à jour la facture courante si c'est elle
      if (currentInvoice?.id === invoiceId) {
        setCurrentInvoice(updatedInvoice);
      }
      
      return updatedInvoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice';
      setError(errorMessage);
      console.error('Error updating invoice:', err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [currentInvoice]);

  /**
   * Envoie une facture au client
   */
  const sendInvoiceToClient = useCallback(async (invoiceId: string, clientEmail: string) => {
    try {
      setIsSending(true);
      setError(null);
      
      await sendInvoice(invoiceId);
      
      // Mettre à jour le statut de la facture
      setInvoices(prev => 
        prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: 'sent', updated_at: new Date().toISOString() }
            : inv
        )
      );
      
      // Mettre à jour la facture courante si c'est elle
      if (currentInvoice?.id === invoiceId) {
        setCurrentInvoice(prev => prev ? { 
          ...prev, 
          status: 'sent', 
          updated_at: new Date().toISOString() 
        } : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invoice';
      setError(errorMessage);
      console.error('Error sending invoice:', err);
    } finally {
      setIsSending(false);
    }
  }, [currentInvoice]);

  /**
   * Marque une facture comme payée
   */
  const markAsPaid = useCallback(async (
    invoiceId: string, 
    paymentDetails?: { method?: string; reference?: string; date?: string }
  ) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      await markInvoiceAsPaid(invoiceId);
      
      // Mettre à jour le statut de la facture
      setInvoices(prev => 
        prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: 'paid', paidDate: new Date().toISOString() }
            : inv
        )
      );
      
      // Mettre à jour la facture courante si c'est elle
      if (currentInvoice?.id === invoiceId) {
        setCurrentInvoice(prev => prev ? { 
          ...prev, 
          status: 'paid', 
          paidDate: new Date().toISOString() 
        } : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark invoice as paid';
      setError(errorMessage);
      console.error('Error marking invoice as paid:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [currentInvoice]);

  /**
   * Supprime une facture
   */
  const removeInvoice = useCallback(async (invoiceId: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      
      await deleteInvoice(invoiceId);
      
      // Retirer de la liste
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      
      // Si c'était la facture courante, la réinitialiser
      if (currentInvoice?.id === invoiceId) {
        setCurrentInvoice(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(errorMessage);
      console.error('Error deleting invoice:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [currentInvoice]);

  /**
   * Actualise la liste des factures
   */
  const refreshInvoices = useCallback(async () => {
    await loadInvoices();
  }, [loadInvoices]);

  /**
   * Efface l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Filtre les factures par statut
   */
  const getInvoicesByStatus = useCallback((status: Invoice['status']): Invoice[] => {
    return invoices.filter(invoice => invoice.status === status);
  }, [invoices]);

  /**
   * Récupère les factures en retard
   */
  const getOverdueInvoices = useCallback((): Invoice[] => {
    const now = new Date();
    return invoices.filter(invoice => {
      if (invoice.status === 'paid') return false;
      if (!invoice.dueDate) return false;
      const dueDate = new Date(invoice.dueDate);
      return dueDate < now;
    });
  }, [invoices]);

  /**
   * Recherche dans les factures
   */
  const searchInvoices = useCallback((query: string): Invoice[] => {
    const searchLower = query.toLowerCase();
    return invoices.filter(invoice => 
      invoice.id?.toLowerCase().includes(searchLower) ||
      invoice.clientName?.toLowerCase().includes(searchLower) ||
      invoice.clientEmail?.toLowerCase().includes(searchLower)
    );
  }, [invoices]);

  /**
   * Calcule les statistiques des factures
   */
  const getInvoiceStats = useCallback(() => {
    const stats = {
      total: invoices.length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      pending: invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length,
      overdue: getOverdueInvoices().length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
      paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
      pendingAmount: invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.total, 0),
    };

    return stats;
  }, [invoices, getOverdueInvoices]);

  /**
   * Chargement initial
   */
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  return {
    // État
    invoices,
    currentInvoice,
    
    // États de chargement
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isSending,
    
    // État d'erreur
    error,
    
    // Actions
    loadInvoices,
    loadInvoiceDetails,
    createNewInvoice,
    updateInvoiceData,
    sendInvoiceToClient,
    markAsPaid,
    removeInvoice,
    refreshInvoices,
    clearError,
    setCurrentInvoice,
    
    // Utilitaires
    getInvoicesByStatus,
    getOverdueInvoices,
    searchInvoices,
    getInvoiceStats,
  };
};
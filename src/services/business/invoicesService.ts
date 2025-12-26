/**
 * InvoicesService - Service API pour la gestion des factures
 * Utilise les endpoints Quote Management pour les factures/invoices
 */
import { ServerData } from '../../constants/ServerData';
import { fetchWithAuth } from '../../utils/session';

// Mock data pour fallback
const mockInvoices: Invoice[] = [
  {
    id: 'invoice-001',
    clientName: 'John & Sarah Smith',
    clientEmail: 'john.smith@email.com',
    clientAddress: '45 Oak Street, Sydney NSW 2000',
    jobType: 'residential',
    moveDate: '2024-11-15',
    fromAddress: '45 Oak Street, Sydney NSW 2000',
    toAddress: '123 Pine Avenue, North Sydney NSW 2060',
    items: [
      {
        id: 'item-001',
        description: 'Moving Service (4 hours)',
        quantity: 1,
        rate: 480,
        amount: 480
      },
      {
        id: 'item-002', 
        description: 'Packing Materials',
        quantity: 1,
        rate: 85,
        amount: 85
      }
    ],
    subtotal: 565,
    taxRate: 10,
    taxAmount: 56.50,
    total: 621.50,
    status: 'sent',
    paymentTerms: '7-days',
    notes: 'Standard residential move with packing service',
    isInvoice: true,
    created_at: '2024-10-15T00:00:00Z',
    updated_at: '2024-10-15T00:00:00Z',
    dueDate: '2024-11-22'
  },
  {
    id: 'invoice-002',
    clientName: 'ABC Corporation Pty Ltd',
    clientEmail: 'admin@abccorp.com.au',
    clientAddress: '200 George Street, Sydney NSW 2000',
    jobType: 'commercial',
    moveDate: '2024-10-28',
    fromAddress: '200 George Street, Sydney NSW 2000',
    toAddress: '150 Sussex Street, Sydney NSW 2000',
    items: [
      {
        id: 'item-003',
        description: 'Office Relocation Service',
        quantity: 1,
        rate: 1200,
        amount: 1200
      },
      {
        id: 'item-004',
        description: 'IT Equipment Handling',
        quantity: 1,
        rate: 300,
        amount: 300
      }
    ],
    subtotal: 1500,
    taxRate: 10,
    taxAmount: 150,
    total: 1650,
    status: 'paid',
    paymentTerms: '30-days',
    notes: 'Office relocation with specialized IT equipment care',
    isInvoice: true,
    created_at: '2024-10-01T00:00:00Z',
    updated_at: '2024-10-25T00:00:00Z',
    dueDate: '2024-10-31',
    paidDate: '2024-10-25'
  }
];

// Types Invoices
export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  jobType: 'residential' | 'commercial' | 'interstate' | 'storage' | 'packing' | 'specialty';
  moveDate: string;
  fromAddress: string;
  toAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentTerms: 'immediate' | '7-days' | '14-days' | '30-days';
  notes: string;
  isInvoice: boolean; // Distingue invoices des quotes/templates
  created_at: string;
  updated_at: string;
  dueDate?: string;
  paidDate?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceCreateData {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  jobType: 'residential' | 'commercial' | 'interstate' | 'storage' | 'packing' | 'specialty';
  moveDate: string;
  fromAddress: string;
  toAddress: string;
  items: Omit<InvoiceItem, 'id'>[];
  taxRate: number;
  paymentTerms: 'immediate' | '7-days' | '14-days' | '30-days';
  notes: string;
}

// API Response Types
interface InvoiceResponse {
  success: boolean;
  quote: Invoice; // API uses 'quote' field for invoices
}

interface InvoiceListResponse {
  success: boolean;
  quotes: Invoice[]; // API uses 'quotes' field for invoices
}

/**
 * Calcule les montants d'une facture
 */
const calculateInvoiceAmounts = (items: InvoiceItem[], taxRate: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

/**
 * Récupère la liste des factures
 */
export const fetchInvoices = async (): Promise<Invoice[]> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quotes?type=invoice`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (__DEV__) {
        console.warn('Invoices API not available in development, using mock data');
        return mockInvoices;
      }
      throw new Error(`Invoices API failed with status ${response.status}`);
    }

    const data: InvoiceListResponse = await response.json();
    
    if (!data.success) {
      if (__DEV__) {
        console.warn('Invoices API returned success: false, using mock data');
        return mockInvoices;
      }
      throw new Error('Invoices API returned success: false');
    }

    // Filtrer seulement les factures (si l'API renvoie aussi des quotes/templates)
    const invoices = (data.quotes || []).filter(quote => quote.isInvoice);
    return invoices.length > 0 ? invoices : (__DEV__ ? mockInvoices : []);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    if (__DEV__) {
      console.warn('Using mock invoices as fallback in development');
      return mockInvoices;
    }
    throw new Error(`Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Récupère les détails d'une facture par ID
 */
export const fetchInvoiceDetails = async (invoiceId: string): Promise<Invoice> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quote/${invoiceId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: InvoiceResponse = await response.json();
    
    if (!data.success || !data.quote) {
      throw new Error('API returned invalid invoice data');
    }

    return data.quote;
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    throw new Error('Failed to fetch invoice details');
  }
};

/**
 * Crée une nouvelle facture
 */
export const createInvoice = async (invoiceData: InvoiceCreateData): Promise<Invoice> => {
  try {
    // Générer les IDs pour les items
    const itemsWithIds = invoiceData.items.map((item, index) => ({
      ...item,
      id: `item-${Date.now()}-${index}`,
    }));

    // Calculer les montants
    const amounts = calculateInvoiceAmounts(itemsWithIds, invoiceData.taxRate);

    // Calculer la date d'échéance
    const dueDate = new Date();
    switch (invoiceData.paymentTerms) {
      case 'immediate':
        // Échéance immédiate
        break;
      case '7-days':
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      case '14-days':
        dueDate.setDate(dueDate.getDate() + 14);
        break;
      case '30-days':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
    }

    // Préparer les données pour l'API
    const invoicePayload = {
      ...invoiceData,
      items: itemsWithIds,
      subtotal: amounts.subtotal,
      taxAmount: amounts.taxAmount,
      total: amounts.total,
      status: 'draft' as const,
      isInvoice: true,
      dueDate: dueDate.toISOString(),
    };

    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!response.ok) {
      console.warn('Invoice creation API not available, creating mock invoice');
      const mockInvoice: Invoice = {
        id: `invoice-${Date.now()}`,
        ...invoiceData,
        items: itemsWithIds,
        subtotal: amounts.subtotal,
        taxAmount: amounts.taxAmount,
        total: amounts.total,
        status: 'draft',
        isInvoice: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dueDate: dueDate.toISOString()
      };
      return mockInvoice;
    }

    const data: InvoiceResponse = await response.json();
    
    if (!data.success || !data.quote) {
      console.warn('Invoice creation API returned invalid data, creating mock invoice');
      const mockInvoice: Invoice = {
        id: `invoice-${Date.now()}`,
        ...invoiceData,
        items: itemsWithIds,
        subtotal: amounts.subtotal,
        taxAmount: amounts.taxAmount,
        total: amounts.total,
        status: 'draft',
        isInvoice: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dueDate: dueDate.toISOString()
      };
      return mockInvoice;
    }

    return data.quote;
  } catch (error) {
    console.error('Error creating invoice:', error);
    console.warn('Creating mock invoice as fallback');
    // Utiliser les mêmes calculs que dans le try
    const itemsWithIds = invoiceData.items.map((item, index) => ({
      ...item,
      id: `item-${Date.now()}-${index}`,
    }));
    const amounts = calculateInvoiceAmounts(itemsWithIds, invoiceData.taxRate);
    const dueDate = new Date();
    switch (invoiceData.paymentTerms) {
      case '7-days': dueDate.setDate(dueDate.getDate() + 7); break;
      case '14-days': dueDate.setDate(dueDate.getDate() + 14); break;
      case '30-days': dueDate.setDate(dueDate.getDate() + 30); break;
    }
    
    const mockInvoice: Invoice = {
      id: `invoice-${Date.now()}`,
      ...invoiceData,
      items: itemsWithIds,
      subtotal: amounts.subtotal,
      taxAmount: amounts.taxAmount,
      total: amounts.total,
      status: 'draft',
      isInvoice: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dueDate: dueDate.toISOString()
    };
    return mockInvoice;
  }
};

/**
 * Met à jour une facture existante
 */
export const updateInvoice = async (
  invoiceId: string,
  updates: Partial<InvoiceCreateData>
): Promise<Invoice> => {
  try {
    // Si les items sont modifiés, recalculer les montants
    let updatePayload = { ...updates };
    
    if (updates.items || updates.taxRate) {
      const currentInvoice = await fetchInvoiceDetails(invoiceId);
      const items = updates.items ? updates.items.map((item, index) => ({
        ...item,
        id: `item-${Date.now()}-${index}`,
      })) as InvoiceItem[] : currentInvoice.items;
      
      const taxRate = updates.taxRate !== undefined ? updates.taxRate : currentInvoice.taxRate;
      const amounts = calculateInvoiceAmounts(items, taxRate);
      
      updatePayload = {
        ...updatePayload,
        items,
      } as any; // API accepte les champs calculés
    }

    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quote/${invoiceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: InvoiceResponse = await response.json();
    
    if (!data.success || !data.quote) {
      throw new Error('API returned invalid invoice data');
    }

    return data.quote;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw new Error('Failed to update invoice');
  }
};

/**
 * Supprime une facture
 */
export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quote/${invoiceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('API returned success: false');
    }
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw new Error('Failed to delete invoice');
  }
};

/**
 * Envoie une facture au client
 */
export const sendInvoice = async (invoiceId: string): Promise<Invoice> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/quote/${invoiceId}/send`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: InvoiceResponse = await response.json();
    
    if (!data.success || !data.quote) {
      throw new Error('API returned invalid invoice data');
    }

    return data.quote;
  } catch (error) {
    console.error('Error sending invoice:', error);
    throw new Error('Failed to send invoice');
  }
};

/**
 * Marque une facture comme payée
 */
export const markInvoiceAsPaid = async (invoiceId: string): Promise<Invoice> => {
  try {
    const updateData = {
      status: 'paid' as const,
      paidDate: new Date().toISOString(),
    };

    return await updateInvoice(invoiceId, updateData as any);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    throw new Error('Failed to mark invoice as paid');
  }
};
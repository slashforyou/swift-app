// services/clients.ts
import { ServerData } from "../constants/ServerData";
import { getAuthHeaders } from "../utils/auth";

const API = ServerData.serverUrl;

export interface ClientAPI {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  company?: string;
  notes?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  company?: string;
  notes?: string;
}

export interface UpdateClientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  company?: string;
  notes?: string;
}

/**
 * Récupère tous les clients
 */
export async function fetchClients(): Promise<ClientAPI[]> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/clients`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to fetch clients" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to fetch clients`,
    );
  }

  const response = await res.json();

  // Handle API response format: { success: true, data: { clients: [...] } }
  // or direct array, or { clients: [...] }
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.data?.clients && Array.isArray(response.data.clients)) {
    return response.data.clients;
  }
  if (response?.clients && Array.isArray(response.clients)) {
    return response.clients;
  }

  console.warn("[fetchClients] Unexpected response format:", response);
  return [];
}

/**
 * Récupère un client spécifique par ID
 */
export async function fetchClientById(clientId: string): Promise<ClientAPI> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/client/${clientId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to fetch client" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to fetch client`,
    );
  }

  const data = await res.json();
  return data.client || data;
}

/**
 * Crée un nouveau client
 */
export async function createClient(
  clientData: CreateClientRequest,
): Promise<ClientAPI> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/client`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(clientData),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to create client" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to create client`,
    );
  }

  const data = await res.json();
  return data.client || data;
}

/**
 * Met à jour un client existant
 */
export async function updateClient(
  clientId: string,
  clientData: UpdateClientRequest,
): Promise<ClientAPI> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/client/${clientId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(clientData),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to update client" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to update client`,
    );
  }

  const data = await res.json();
  return data.client || data;
}

/**
 * Supprime un client
 */
export async function deleteClient(clientId: string): Promise<void> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/client/${clientId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to delete client" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to delete client`,
    );
  }
}

/**
 * Archive un client
 */
export async function archiveClient(clientId: string): Promise<ClientAPI> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/client/${clientId}/archive`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to archive client" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to archive client`,
    );
  }

  const data = await res.json();
  return data.client || data;
}

/**
 * Désarchive un client
 */
export async function unarchiveClient(clientId: string): Promise<ClientAPI> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API}v1/client/${clientId}/unarchive`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to unarchive client" }));
    throw new Error(
      error.message || `HTTP ${res.status}: Failed to unarchive client`,
    );
  }

  const data = await res.json();
  return data.client || data;
}

/**
 * useAuth - Hook d'authentification
 */

import { createContext, useContext } from "react";

// Import types from user service
import type { Company, CompanyRole } from "../services/user";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
  createdAt: Date;

  // New company relationship fields (API v1.1.0)
  company_id?: number;
  company_role?: CompanyRole;
  company?: Company | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    userData: Partial<User> & { password: string },
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // Retourner un état par défaut si le contexte n'est pas disponible
    return {
      user: null,
      isAuthenticated: false,
      loading: false,
      login: async () => false,
      logout: () => {},
      register: async () => false,
    };
  }
  return context;
};

export { AuthContext };

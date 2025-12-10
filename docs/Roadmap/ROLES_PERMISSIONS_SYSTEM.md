# 🔐 SwiftApp - Système de Permissions et Rôles Enterprise

**Date**: 7 Décembre 2025  
**Version**: 1.0  
**Scope**: Architecture complète des forfaits et permissions  

---

## 🎯 **Vue d'ensemble**

### **Problématique**
L'app actuelle a seulement `userType: 'employee' | 'worker'` mais nous devons supporter **4 types de forfaits** avec des permissions granulaires pour chaque action.

### **Solution**
Architecture **User ↔ Company** séparée avec système de **rôles et permissions** granulaires, contrôlé côté serveur.

---

## 👥 **Architecture des Forfaits**

### **1. 🏭 Fournisseurs (Suppliers)**
**Profil** : Grosses entreprises qui sous-traitent des jobs
- **Taille** : 100-1000+ employés
- **Budget** : €500-5000/mois
- **Besoins** : Gestion massive de jobs, équipes multiples, analytics avancées

### **2. 🏢 Entreprise (Enterprise)**  
**Profil** : PME/ETI qui ont leurs propres équipes
- **Taille** : 10-100 employés
- **Budget** : €100-500/mois
- **Besoins** : Gestion d'équipes, facturation, planning

### **3. 🚀 Prestataire (Contractor)**
**Profil** : Micro-entreprises/freelance qui acceptent jobs
- **Taille** : 1-5 personnes
- **Budget** : €30-100/mois
- **Besoins** : Accepter jobs, facturation simple, timer

### **4. 👷 Employé (Employee)**
**Profil** : Salariés qui exécutent les jobs
- **Taille** : Individuel
- **Budget** : €0 (payé par l'entreprise)
- **Besoins** : Timer, photos, validation étapes

---

## 🗄️ **Architecture Base de Données**

### **Séparation User ↔ Company**

```sql
-- Table companies (séparée des users)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) NOT NULL, -- supplier, enterprise, contractor
    company_type VARCHAR(50) NOT NULL, -- supplier, enterprise, contractor
    siret VARCHAR(50),
    vat_number VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Facturation & limites
    max_users INTEGER NOT NULL,
    max_jobs_per_month INTEGER,
    features_enabled JSONB NOT NULL DEFAULT '[]',
    
    -- Billing
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'active',
    billing_email VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table users (fokus sur l'individu)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Identité personnelle
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    
    -- Rôle dans l'entreprise
    role_id UUID REFERENCES roles(id),
    position VARCHAR(100), -- CEO, Manager, Driver, etc.
    department VARCHAR(100), -- Operations, Admin, etc.
    
    -- Personnel
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    profile_picture VARCHAR(500),
    
    -- Système
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table roles (définit ce qu'un user peut faire)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- 'CEO', 'Manager', 'Driver', 'Contractor'
    description TEXT,
    is_default BOOLEAN DEFAULT false, -- rôle par défaut pour nouveaux users
    permissions JSONB NOT NULL DEFAULT '[]', -- array des permissions
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_company_role_name UNIQUE(company_id, name)
);

-- Table permissions (granularité maximale)
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY, -- 'jobs:create', 'payments:modify', etc.
    category VARCHAR(50) NOT NULL, -- 'jobs', 'payments', 'users', etc.
    action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete'
    resource VARCHAR(50) NOT NULL, -- 'job', 'payment', 'user', etc.
    description TEXT NOT NULL,
    is_system_permission BOOLEAN DEFAULT false -- permissions système non modifiables
);

-- Table user_sessions (sécurité)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    permissions_snapshot JSONB NOT NULL, -- cache des permissions pour perf
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🎭 **Définition des Rôles**

### **🏭 FOURNISSEURS (Suppliers)**

#### **Rôle: Supplier Admin**
```json
{
  "role": "supplier_admin",
  "permissions": [
    "companies:*",
    "users:*", 
    "jobs:*",
    "payments:*",
    "analytics:*",
    "teams:*",
    "billing:*",
    "api:*"
  ],
  "description": "Accès total - CEO/CTO niveau fournisseur"
}
```

#### **Rôle: Supplier Manager** 
```json
{
  "role": "supplier_manager",
  "permissions": [
    "jobs:create", "jobs:read", "jobs:update", "jobs:assign",
    "users:read", "users:invite", 
    "payments:read", "payments:create",
    "teams:read", "teams:manage",
    "analytics:read"
  ],
  "description": "Manager opérationnel - peut créer jobs et gérer équipes"
}
```

#### **Rôle: Supplier Coordinator**
```json
{
  "role": "supplier_coordinator", 
  "permissions": [
    "jobs:read", "jobs:update", "jobs:assign",
    "users:read",
    "teams:read",
    "analytics:basic"
  ],
  "description": "Coordinateur - peut assigner jobs aux équipes"
}
```

### **🏢 ENTREPRISE (Enterprise)**

#### **Rôle: Company Owner**
```json
{
  "role": "company_owner",
  "permissions": [
    "company:*",
    "users:*",
    "jobs:*", 
    "payments:*",
    "teams:*",
    "billing:read"
  ],
  "description": "Propriétaire PME - accès total sauf billing système"
}
```

#### **Rôle: Operations Manager**
```json
{
  "role": "operations_manager",
  "permissions": [
    "jobs:create", "jobs:read", "jobs:update", "jobs:delete",
    "users:read", "users:invite",
    "payments:read", "payments:create", 
    "teams:read", "teams:manage",
    "vehicles:*"
  ],
  "description": "Responsable opérations - gère jobs et équipes"
}
```

#### **Rôle: Team Leader**
```json
{
  "role": "team_leader",
  "permissions": [
    "jobs:read", "jobs:update", "jobs:assign",
    "users:read",
    "teams:read", "teams:manage_assigned",
    "payments:read"
  ],
  "description": "Chef d'équipe - gère son équipe et jobs assignés"
}
```

### **🚀 PRESTATAIRE (Contractor)**

#### **Rôle: Contractor Owner**
```json
{
  "role": "contractor_owner", 
  "permissions": [
    "jobs:read", "jobs:accept", "jobs:execute", "jobs:complete",
    "payments:read", "payments:request",
    "profile:*",
    "vehicles:own"
  ],
  "description": "Micro-entrepreneur - accepte et exécute jobs"
}
```

#### **Rôle: Contractor Employee**
```json
{
  "role": "contractor_employee",
  "permissions": [
    "jobs:read", "jobs:execute",
    "payments:read",
    "profile:basic"
  ],
  "description": "Employé du contractor - exécute jobs assignés"
}
```

### **👷 EMPLOYÉ (Employee)**

#### **Rôle: Field Worker**
```json
{
  "role": "field_worker",
  "permissions": [
    "jobs:read", "jobs:execute", "jobs:update_progress", 
    "timer:*",
    "photos:upload",
    "profile:basic"
  ],
  "description": "Ouvrier terrain - exécute jobs, utilise timer"
}
```

#### **Rôle: Driver**
```json
{
  "role": "driver", 
  "permissions": [
    "jobs:read", "jobs:execute",
    "timer:*", 
    "navigation:*",
    "vehicles:assigned",
    "photos:upload"
  ],
  "description": "Chauffeur - accès navigation et véhicule assigné"
}
```

---

## 📊 **Matrice des Permissions par Action**

### **Jobs Management**

| Action | Supplier Admin | Enterprise Owner | Contractor | Employee |
|--------|---------------|------------------|------------|----------|
| **Créer Job** | ✅ | ✅ | ❌ | ❌ |
| **Modifier Job** | ✅ | ✅ | 🟡 Own only | ❌ |
| **Assigner Job** | ✅ | ✅ | ❌ | ❌ |
| **Accepter Job** | ✅ | ✅ | ✅ | ❌ |
| **Exécuter Job** | ✅ | ✅ | ✅ | ✅ |
| **Annuler Job** | ✅ | ✅ | 🟡 Own only | ❌ |
| **Voir tous Jobs** | ✅ | ✅ | 🟡 Assigned | 🟡 Assigned |

### **Payments & Billing**

| Action | Supplier Admin | Enterprise Owner | Contractor | Employee |
|--------|---------------|------------------|------------|----------|
| **Créer Facture** | ✅ | ✅ | ✅ | ❌ |
| **Modifier Montant** | ✅ | ✅ | ❌ | ❌ |
| **Encaisser Paiement** | ✅ | ✅ | ✅ | 🟡 Execute only |
| **Rembourser** | ✅ | ✅ | ❌ | ❌ |
| **Voir Revenus** | ✅ | ✅ | 🟡 Own only | ❌ |
| **Export Compta** | ✅ | ✅ | ✅ | ❌ |

### **Team & User Management**

| Action | Supplier Admin | Enterprise Owner | Contractor | Employee |
|--------|---------------|------------------|------------|----------|
| **Inviter Users** | ✅ | ✅ | 🟡 Limited | ❌ |
| **Modifier Rôles** | ✅ | ✅ | ❌ | ❌ |
| **Supprimer Users** | ✅ | ✅ | ❌ | ❌ |
| **Voir Équipes** | ✅ | ✅ | 🟡 Own team | 🟡 Own team |
| **Créer Équipes** | ✅ | ✅ | ❌ | ❌ |

### **Analytics & Reports**

| Action | Supplier Admin | Enterprise Owner | Contractor | Employee |
|--------|---------------|------------------|------------|----------|
| **Dashboard Complet** | ✅ | ✅ | ❌ | ❌ |
| **Analytics Revenus** | ✅ | ✅ | 🟡 Own only | ❌ |
| **Reports Équipes** | ✅ | ✅ | ❌ | ❌ |
| **Export Data** | ✅ | ✅ | 🟡 Limited | ❌ |
| **KPIs Business** | ✅ | ✅ | ❌ | ❌ |

---

## 🛠️ **Implementation Technique**

### **1. Backend Middleware de Permissions**

```typescript
// middleware/permissions.ts
export class PermissionMiddleware {
    
    /**
     * Vérifier si user a une permission spécifique
     */
    static async hasPermission(
        userId: string, 
        permission: string,
        resourceId?: string
    ): Promise<boolean> {
        
        // 1. Récupérer session user avec cache permissions
        const session = await this.getUserSession(userId);
        if (!session) return false;
        
        // 2. Check permission directe
        if (session.permissions.includes(permission)) {
            return true;
        }
        
        // 3. Check permission avec wildcard
        const [category, action] = permission.split(':');
        if (session.permissions.includes(`${category}:*`)) {
            return true;
        }
        
        // 4. Check permission conditionnelle (ex: own resources)
        if (resourceId) {
            return this.checkConditionalPermission(
                session, 
                permission, 
                resourceId
            );
        }
        
        return false;
    }
    
    /**
     * Middleware Express pour vérifier permissions
     */
    static requirePermission(permission: string) {
        return async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.user?.id;
            const resourceId = req.params.id || req.body.id;
            
            const hasAccess = await this.hasPermission(
                userId, 
                permission, 
                resourceId
            );
            
            if (!hasAccess) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: permission,
                    code: 'PERMISSION_DENIED'
                });
            }
            
            next();
        };
    }
    
    /**
     * Permissions conditionnelles (ex: own resources only)
     */
    private static async checkConditionalPermission(
        session: UserSession,
        permission: string, 
        resourceId: string
    ): Promise<boolean> {
        
        const conditionalPermissions = {
            'jobs:update_own': async () => {
                const job = await db.table('jobs').where('id', resourceId).first();
                return job?.created_by === session.user_id || 
                       job?.assigned_to === session.user_id;
            },
            
            'payments:read_own': async () => {
                const payment = await db.table('payments').where('id', resourceId).first();
                return payment?.user_id === session.user_id;
            },
            
            'teams:manage_assigned': async () => {
                const team = await db.table('teams').where('id', resourceId).first();
                return team?.leader_id === session.user_id;
            }
        };
        
        const conditionalCheck = conditionalPermissions[permission];
        return conditionalCheck ? await conditionalCheck() : false;
    }
}

// Exemple d'utilisation dans routes
app.post('/api/jobs', 
    authenticateUser,
    PermissionMiddleware.requirePermission('jobs:create'),
    JobController.createJob
);

app.put('/api/jobs/:id',
    authenticateUser, 
    PermissionMiddleware.requirePermission('jobs:update'),
    JobController.updateJob
);

app.delete('/api/users/:id',
    authenticateUser,
    PermissionMiddleware.requirePermission('users:delete'),
    UserController.deleteUser
);
```

### **2. Service de Gestion des Rôles**

```typescript
// services/RoleService.ts
export class RoleService {
    
    /**
     * Créer rôles par défaut pour une nouvelle company
     */
    static async createDefaultRoles(companyId: string, companyType: string): Promise<void> {
        const defaultRoles = this.getDefaultRolesByType(companyType);
        
        for (const roleConfig of defaultRoles) {
            await db.table('roles').insert({
                company_id: companyId,
                name: roleConfig.name,
                description: roleConfig.description,
                permissions: JSON.stringify(roleConfig.permissions),
                is_default: roleConfig.isDefault || false
            });
        }
    }
    
    /**
     * Assigner rôle à un user
     */
    static async assignUserRole(
        userId: string, 
        roleId: string
    ): Promise<void> {
        await db.table('users')
            .where('id', userId)
            .update({
                role_id: roleId,
                updated_at: new Date()
            });
            
        // Invalider cache sessions pour forcer reload permissions
        await this.invalidateUserSessions(userId);
    }
    
    /**
     * Récupérer permissions effectives d'un user
     */
    static async getUserPermissions(userId: string): Promise<string[]> {
        const userRole = await db.table('users')
            .join('roles', 'users.role_id', 'roles.id')
            .where('users.id', userId)
            .select('roles.permissions')
            .first();
            
        if (!userRole?.permissions) {
            return [];
        }
        
        return JSON.parse(userRole.permissions);
    }
    
    /**
     * Configurations des rôles par défaut par type de company
     */
    private static getDefaultRolesByType(companyType: string) {
        const roleConfigs = {
            'supplier': [
                {
                    name: 'Supplier Admin',
                    permissions: ['*'], // Toutes permissions
                    description: 'Administrateur fournisseur',
                    isDefault: true
                },
                {
                    name: 'Supplier Manager', 
                    permissions: [
                        'jobs:create', 'jobs:read', 'jobs:update', 'jobs:assign',
                        'users:read', 'users:invite',
                        'payments:read', 'payments:create',
                        'teams:*', 'analytics:read'
                    ],
                    description: 'Manager opérationnel'
                }
            ],
            
            'enterprise': [
                {
                    name: 'Company Owner',
                    permissions: [
                        'company:*', 'users:*', 'jobs:*', 
                        'payments:*', 'teams:*', 'billing:read'
                    ],
                    description: 'Propriétaire entreprise', 
                    isDefault: true
                },
                {
                    name: 'Operations Manager',
                    permissions: [
                        'jobs:*', 'users:read', 'users:invite',
                        'payments:read', 'payments:create',
                        'teams:*', 'vehicles:*'
                    ],
                    description: 'Responsable opérations'
                },
                {
                    name: 'Employee',
                    permissions: [
                        'jobs:read', 'jobs:execute', 
                        'timer:*', 'photos:upload', 'profile:basic'
                    ],
                    description: 'Employé standard'
                }
            ],
            
            'contractor': [
                {
                    name: 'Contractor Owner',
                    permissions: [
                        'jobs:read', 'jobs:accept', 'jobs:execute', 'jobs:complete',
                        'payments:read', 'payments:request',
                        'profile:*', 'vehicles:own'
                    ],
                    description: 'Propriétaire prestataire',
                    isDefault: true
                }
            ]
        };
        
        return roleConfigs[companyType] || [];
    }
}
```

### **3. Frontend Hook de Permissions**

```typescript
// hooks/usePermissions.ts
export interface UsePermissionsResult {
    hasPermission: (permission: string, resourceId?: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    userRole: string | null;
    companyType: string | null;
    permissions: string[];
    isLoading: boolean;
}

export const usePermissions = (userId: string): UsePermissionsResult => {
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [companyType, setCompanyType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Charger permissions user
    useEffect(() => {
        const loadPermissions = async () => {
            try {
                const response = await fetchWithAuth(`/api/users/${userId}/permissions`);
                const data = await response.json();
                
                setUserPermissions(data.permissions || []);
                setUserRole(data.role);
                setCompanyType(data.companyType);
            } catch (error) {
                console.error('Failed to load permissions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (userId) {
            loadPermissions();
        }
    }, [userId]);
    
    const hasPermission = useCallback((permission: string, resourceId?: string) => {
        if (userPermissions.includes('*')) return true;
        if (userPermissions.includes(permission)) return true;
        
        // Check wildcard permissions
        const [category] = permission.split(':');
        if (userPermissions.includes(`${category}:*`)) return true;
        
        return false;
    }, [userPermissions]);
    
    const hasAnyPermission = useCallback((permissions: string[]) => {
        return permissions.some(permission => hasPermission(permission));
    }, [hasPermission]);
    
    const hasAllPermissions = useCallback((permissions: string[]) => {
        return permissions.every(permission => hasPermission(permission));
    }, [hasPermission]);
    
    return {
        hasPermission,
        hasAnyPermission, 
        hasAllPermissions,
        userRole,
        companyType,
        permissions: userPermissions,
        isLoading
    };
};
```

### **4. Composant de Protection UI**

```typescript
// components/PermissionGate.tsx
interface PermissionGateProps {
    permission: string | string[];
    resourceId?: string;
    fallback?: React.ReactNode;
    children: React.ReactNode;
    requireAll?: boolean; // true = AND, false = OR pour multiple permissions
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    permission,
    resourceId,
    fallback = null,
    children,
    requireAll = false
}) => {
    const { user } = useAuth();
    const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions(user.id);
    
    if (isLoading) {
        return <ActivityIndicator size="small" />;
    }
    
    let hasAccess = false;
    
    if (Array.isArray(permission)) {
        hasAccess = requireAll 
            ? hasAllPermissions(permission)
            : hasAnyPermission(permission);
    } else {
        hasAccess = hasPermission(permission, resourceId);
    }
    
    return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Exemple d'utilisation
export const JobsScreen: React.FC = () => {
    return (
        <View>
            {/* Bouton créer job - seulement admins/managers */}
            <PermissionGate permission="jobs:create">
                <CreateJobButton />
            </PermissionGate>
            
            {/* Analytics - plusieurs permissions possibles */}
            <PermissionGate 
                permission={['analytics:read', 'analytics:advanced']}
                requireAll={false}
            >
                <AnalyticsDashboard />
            </PermissionGate>
            
            {/* Actions sensibles - toutes les permissions requises */}
            <PermissionGate 
                permission={['payments:modify', 'billing:admin']}
                requireAll={true}
                fallback={<Text>Accès restreint</Text>}
            >
                <BillingSettings />
            </PermissionGate>
        </View>
    );
};
```

---

## 🔒 **Sécurité & Validation**

### **Validation Côté Serveur**
```typescript
// Chaque endpoint valide les permissions
app.put('/api/payments/:paymentId/amount', [
    authenticateUser,
    PermissionMiddleware.requirePermission('payments:modify'),
    validatePaymentOwnership, // middleware custom
    PaymentController.updateAmount
]);

// Validation ownership pour resources "own"
const validatePaymentOwnership = async (req, res, next) => {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    
    if (payment.userId !== req.user.id && !req.user.permissions.includes('payments:*')) {
        return res.status(403).json({ error: 'Can only modify own payments' });
    }
    
    next();
};
```

### **Audit Trail**
```sql
-- Table d'audit pour tracer toutes les actions sensibles
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    action VARCHAR(100) NOT NULL, -- 'job:created', 'payment:modified'
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 📱 **Impact Frontend**

### **Navigation Adaptive**
```typescript
// Navigation qui s'adapte aux permissions
export const AppNavigation: React.FC = () => {
    const { hasPermission, companyType } = usePermissions(user.id);
    
    return (
        <NavigationContainer>
            <Tab.Navigator>
                {/* Toujours disponible */}
                <Tab.Screen name="Dashboard" component={DashboardScreen} />
                
                {/* Seulement si peut créer jobs */}
                {hasPermission('jobs:create') && (
                    <Tab.Screen name="CreateJob" component={CreateJobScreen} />
                )}
                
                {/* Analytics pour admins/managers seulement */}
                {hasPermission('analytics:read') && (
                    <Tab.Screen name="Analytics" component={AnalyticsScreen} />
                )}
                
                {/* Facturation selon company type */}
                {companyType !== 'employee' && (
                    <Tab.Screen name="Billing" component={BillingScreen} />
                )}
                
                {/* Toujours disponible */}
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};
```

### **UI Components Adaptatifs**
```typescript
// JobCard qui s'adapte aux permissions
export const JobCard: React.FC<{ job: Job }> = ({ job }) => {
    const { hasPermission } = usePermissions(user.id);
    
    return (
        <Card>
            <JobTitle job={job} />
            <JobDescription job={job} />
            
            <View style={styles.actions}>
                {/* Timer seulement pour executors */}
                {hasPermission('timer:use') && (
                    <TimerButton jobId={job.id} />
                )}
                
                {/* Modifier seulement pour créateurs/managers */}
                <PermissionGate permission="jobs:update" resourceId={job.id}>
                    <EditJobButton job={job} />
                </PermissionGate>
                
                {/* Facturer seulement pour admins */}
                <PermissionGate permission="payments:create">
                    <BillJobButton job={job} />
                </PermissionGate>
                
                {/* Supprimer avec permissions strictes */}
                <PermissionGate permission={['jobs:delete', 'admin:*']}>
                    <DeleteJobButton job={job} />
                </PermissionGate>
            </View>
        </Card>
    );
};
```

---

## 🎯 **Plan d'Migration**

### **Phase 1: Backend Foundation (2 semaines)**
1. **Database Migration**
   - Créer nouvelles tables companies, roles, permissions
   - Migrer data existante (users → companies + users)
   - Setup contraintes et index

2. **Authentication & Permissions**
   - Middleware de permissions
   - Service RoleService
   - API endpoints pour gestion rôles

### **Phase 2: Frontend Integration (2 semaines)**
1. **Hooks & Components** 
   - Hook usePermissions
   - Composant PermissionGate
   - Services frontend

2. **UI Adaptation**
   - Navigation adaptive
   - Components avec contrôles d'accès
   - Écrans d'administration

### **Phase 3: Testing & Polish (1 semaine)**
1. **Tests complets**
2. **Documentation utilisateur** 
3. **Formation équipes**

---

## 💰 **Impact Business**

### **Pricing Tiers** 

| Forfait | Prix/mois | Max Users | Max Jobs/mois | Features |
|---------|-----------|-----------|---------------|----------|
| **Employee** | €0 | 1 | Illimité | Timer, Photos, Execution |
| **Contractor** | €39 | 5 | 100 | + Facturation, Accepter jobs |
| **Enterprise** | €199 | 50 | 500 | + Création jobs, Équipes, Analytics |
| **Supplier** | €999 | 200 | 2000 | + API, White-label, Support prioritaire |

### **Revenue Projections**
- **Q1 2025** : 200 contractors (€7.8k MRR) + 50 enterprises (€9.9k MRR) = €17.7k MRR
- **Q2 2025** : 500 contractors (€19.5k MRR) + 100 enterprises (€19.9k MRR) + 5 suppliers (€5k MRR) = €44.4k MRR
- **Q4 2025** : 1000 contractors (€39k) + 200 enterprises (€39.8k) + 20 suppliers (€19.9k) = €98.7k MRR = €1.18M ARR

**C'est exactement ce qu'il faut pour passer à l'échelle en tant que vrai SaaS B2B !** 🚀
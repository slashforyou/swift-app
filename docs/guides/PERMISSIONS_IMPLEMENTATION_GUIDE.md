# 🛠️ Guide d'Implémentation - Système de Permissions SwiftApp

**Date**: 7 Décembre 2025  
**Version**: 1.0  
**Équipe**: Backend + Frontend + DevOps  
**Estimation**: 5 semaines (4 devs)

---

## 📋 **Plan d'Exécution**

### **🎯 Objectif**
Migrer de `userType: 'employee' | 'worker'` vers un système complet de **4 forfaits avec permissions granulaires** contrôlées côté serveur.

### **🚀 Vue d'ensemble Migration**

#### **Avant (Actuel)**
```typescript
// user.ts - Simple
export type UserType = 'employee' | 'worker';
export interface UserProfile {
  userType: UserType;
  permissions?: string[]; // basique
  companyName?: string; // mélangé avec user
}

// UI - Contrôles basiques
{profile?.userType === 'worker' && <CompanySection />}
```

#### **Après (Cible)**
```typescript
// Architecture séparée
export interface User {
  id: string;
  company_id: string;
  role_id: string;
  // Personal data only
}

export interface Company {
  id: string;
  subscription_plan: 'supplier' | 'enterprise' | 'contractor';
  // Business data only
}

export interface Role {
  permissions: string[]; // granulaire
  company_id: string;
}

// UI - Permissions granulaires
<PermissionGate permission="jobs:create">
  <CreateJobButton />
</PermissionGate>
```

---

## 📅 **Timeline Détaillé**

### **Semaine 1: Database Foundation**
**Équipe**: Backend (2 devs) + DevOps (1 dev)

#### **Jour 1-2: Schema Design & Migration Scripts**
```sql
-- Créer nouvelles tables
CREATE TABLE companies (...);
CREATE TABLE roles (...);
CREATE TABLE permissions (...);
CREATE TABLE user_sessions (...);

-- Migration données existantes
INSERT INTO companies (name, subscription_plan)
SELECT DISTINCT companyName, 
  CASE 
    WHEN userType = 'worker' THEN 'contractor'
    ELSE 'enterprise'
  END
FROM users WHERE companyName IS NOT NULL;

-- Migrer users vers nouvelle structure
UPDATE users SET 
  company_id = (SELECT id FROM companies WHERE name = users.companyName),
  role_id = (SELECT id FROM roles WHERE name = 'default_role');
```

#### **Jour 3: Permissions Seeding**
```typescript
// scripts/seed-permissions.ts
const SYSTEM_PERMISSIONS = [
  'jobs:create', 'jobs:read', 'jobs:update', 'jobs:delete', 'jobs:assign',
  'payments:create', 'payments:read', 'payments:modify', 'payments:refund',
  'users:create', 'users:read', 'users:update', 'users:delete', 'users:invite',
  'teams:create', 'teams:read', 'teams:update', 'teams:delete', 'teams:manage',
  'analytics:read', 'analytics:advanced', 'billing:read', 'billing:admin'
];

// Créer rôles par défaut pour chaque type de company
await createDefaultRoles();
```

#### **Jour 4-5: Backend Services & Middleware**
```typescript
// services/PermissionService.ts
export class PermissionService {
  static async hasPermission(userId: string, permission: string): Promise<boolean>
  static async getUserPermissions(userId: string): Promise<string[]>
  static async assignRole(userId: string, roleId: string): Promise<void>
}

// middleware/permissions.ts  
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Validation logic
  };
};
```

### **Semaine 2: API Integration**
**Équipe**: Backend (2 devs)

#### **Jour 1-2: Endpoints Protection**
```typescript
// Appliquer middleware aux routes existantes
app.post('/api/jobs', 
  authenticateUser,
  requirePermission('jobs:create'),
  JobController.createJob
);

app.put('/api/payments/:id/amount',
  authenticateUser, 
  requirePermission('payments:modify'),
  PaymentController.updateAmount
);

// Nouveaux endpoints pour gestion des rôles
app.get('/api/users/:id/permissions', UserController.getPermissions);
app.post('/api/companies/:id/roles', CompanyController.createRole);
app.put('/api/users/:id/role', UserController.assignRole);
```

#### **Jour 3-4: Authentication Migration**
```typescript
// Mettre à jour JWT tokens pour inclure permissions
export interface JwtPayload {
  userId: string;
  companyId: string;
  permissions: string[];
  role: string;
  iat: number;
  exp: number;
}

// Cache permissions en session pour performance
export class SessionService {
  static async createSession(user: User): Promise<string>
  static async refreshPermissions(sessionId: string): Promise<void>
}
```

#### **Jour 5: Testing Backend**
```typescript
// tests/permissions.test.ts
describe('Permission System', () => {
  it('should deny access without permission', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(403);
  });
  
  it('should allow access with correct permission', async () => {
    const response = await request(app)
      .post('/api/jobs') 
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
  });
});
```

### **Semaine 3: Frontend Foundation**  
**Équipe**: Frontend (2 devs)

#### **Jour 1-2: Services & Hooks**
```typescript
// services/PermissionService.ts
export class PermissionService {
  static async getUserPermissions(userId: string): Promise<UserPermissions>
  static async updateUserRole(userId: string, roleId: string): Promise<void>
}

// hooks/usePermissions.ts
export const usePermissions = (userId: string): UsePermissionsResult => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const hasPermission = useCallback((permission: string) => {
    return permissions.includes(permission) || permissions.includes('*');
  }, [permissions]);
  
  return { hasPermission, permissions, isLoading };
};
```

#### **Jour 3-4: UI Components**
```typescript
// components/PermissionGate.tsx
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null
}) => {
  const { hasPermission, isLoading } = usePermissions(user.id);
  
  if (isLoading) return <LoadingSpinner />;
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
};

// components/RoleSelector.tsx - Pour admin UI
export const RoleSelector: React.FC<RoleSelectorProps> = ({ userId, companyId }) => {
  // Interface pour assigner rôles
};
```

#### **Jour 5: Navigation Adaptation**
```typescript
// navigation/AppNavigator.tsx
export const AppNavigator = () => {
  const { hasPermission, companyType } = usePermissions(user.id);
  
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      
      {hasPermission('jobs:create') && (
        <Tab.Screen name="CreateJob" component={CreateJobScreen} />
      )}
      
      {hasPermission('analytics:read') && (
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      )}
      
      {companyType !== 'employee' && (
        <Tab.Screen name="Billing" component={BillingScreen} />
      )}
    </Tab.Navigator>
  );
};
```

### **Semaine 4: UI Integration**
**Équipe**: Frontend (2 devs) + Backend (1 dev pour support)

#### **Jour 1-2: Screen Updates**
```typescript
// Mettre à jour tous les screens existants
// JobsScreen.tsx
export const JobsScreen = () => {
  const { hasPermission } = usePermissions(user.id);
  
  return (
    <Screen>
      <JobsList />
      
      <PermissionGate permission="jobs:create">
        <CreateJobFAB />
      </PermissionGate>
      
      <PermissionGate permission="analytics:read">
        <AnalyticsWidget />
      </PermissionGate>
    </Screen>
  );
};

// PaymentScreen.tsx - Contrôles fins
export const PaymentScreen = ({ payment }) => {
  return (
    <Screen>
      <PaymentDetails payment={payment} />
      
      {/* Voir montant - permission basique */}
      <PermissionGate permission="payments:read">
        <PaymentAmount amount={payment.amount} />
      </PermissionGate>
      
      {/* Modifier montant - permission restrictive */}  
      <PermissionGate permission="payments:modify">
        <EditAmountButton payment={payment} />
      </PermissionGate>
      
      {/* Rembourser - permission admin */}
      <PermissionGate permission="payments:refund">
        <RefundButton payment={payment} />
      </PermissionGate>
    </Screen>
  );
};
```

#### **Jour 3-4: Company/Admin Screens**
```typescript
// screens/admin/CompanySettingsScreen.tsx - Nouveau
export const CompanySettingsScreen = () => {
  const { company, users, roles } = useCompanyManagement();
  
  return (
    <Screen>
      <CompanyInfo company={company} />
      
      <PermissionGate permission="users:invite">
        <InviteUserSection />
      </PermissionGate>
      
      <PermissionGate permission="users:manage_roles">
        <UserRoleManagement users={users} roles={roles} />
      </PermissionGate>
      
      <PermissionGate permission="billing:admin">
        <SubscriptionSettings company={company} />
      </PermissionGate>
    </Screen>
  );
};

// screens/admin/RoleManagementScreen.tsx - Nouveau
export const RoleManagementScreen = () => {
  const { roles, permissions } = useRoleManagement(companyId);
  
  return (
    <Screen>
      <RolesList roles={roles} />
      <CreateRoleForm permissions={permissions} />
      <PermissionMatrix roles={roles} permissions={permissions} />
    </Screen>
  );
};
```

#### **Jour 5: Testing Frontend**
```typescript
// __tests__/permissions-integration.test.tsx
describe('Permission Integration', () => {
  it('should hide create job button for employees', () => {
    render(<JobsScreen />, { 
      wrapper: ({ children }) => (
        <AuthContext.Provider value={{ user: mockEmployee }}>
          {children}
        </AuthContext.Provider>
      )
    });
    
    expect(screen.queryByTestId('create-job-button')).toBeNull();
  });
  
  it('should show admin features for company owners', () => {
    render(<JobsScreen />, { 
      wrapper: ({ children }) => (
        <AuthContext.Provider value={{ user: mockOwner }}>
          {children}
        </AuthContext.Provider>
      )
    });
    
    expect(screen.getByTestId('analytics-widget')).toBeTruthy();
  });
});
```

### **Semaine 5: Testing & Deployment**
**Équipe**: Full team (4 devs)

#### **Jour 1-2: End-to-End Testing**
```typescript
// e2e/permissions-flow.test.ts
describe('Permission Flows', () => {
  it('should complete full job workflow as contractor', async () => {
    // Login as contractor
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'contractor@example.com');
    await page.click('[data-testid="login-button"]');
    
    // Should see jobs to accept
    await expect(page.locator('[data-testid="available-jobs"]')).toBeVisible();
    
    // Should NOT see create job button
    await expect(page.locator('[data-testid="create-job"]')).not.toBeVisible();
    
    // Can accept and execute job
    await page.click('[data-testid="accept-job-123"]');
    await page.click('[data-testid="start-timer"]');
    // ... continue flow
  });
  
  it('should manage team as enterprise owner', async () => {
    // Login as enterprise owner
    // Should see team management
    // Should be able to invite users
    // Should be able to assign roles
  });
});
```

#### **Jour 3: Migration Production**
```bash
# Script de migration production
#!/bin/bash

echo "🔄 Starting permission system migration..."

# 1. Backup database
pg_dump $DB_URL > backup_pre_permissions_$(date +%Y%m%d).sql

# 2. Run migrations
npm run db:migrate

# 3. Seed permissions and default roles
npm run seed:permissions

# 4. Migrate existing users to new structure
npm run migrate:users-to-companies

# 5. Deploy new API
kubectl apply -f k8s/api-deployment.yaml

# 6. Deploy new frontend
npm run build
aws s3 sync dist/ s3://swiftapp-frontend-prod

# 7. Verify health
npm run health:check

echo "✅ Migration completed successfully!"
```

#### **Jour 4-5: Monitoring & Rollback Plan**
```typescript
// monitoring/permissions-metrics.ts
export class PermissionMetrics {
  // Track permission checks performance
  static trackPermissionCheck(permission: string, duration: number): void
  
  // Monitor failed access attempts
  static trackAccessDenied(userId: string, permission: string): void
  
  // Alert on unusual permission patterns
  static detectAnomalousActivity(userId: string, permissions: string[]): void
}

// rollback/rollback-plan.md
/**
 * ROLLBACK PLAN - Permissions System
 * 
 * Si problème critique:
 * 1. Revenir à version précédente de l'API (kubectl rollout undo)
 * 2. Restaurer database backup
 * 3. Réactiver l'ancienne logique userType
 * 4. Notification équipe + users
 * 
 * Triggers de rollback:
 * - Erreur rate > 5% sur permissions endpoints
 * - Users bloqués > 10% du trafic
 * - Performance dégradée > 2x baseline
 */
```

---

## 📊 **Checklist de Validation**

### **✅ Backend Ready**
- [ ] Database migration completed successfully
- [ ] All endpoints protected with permission middleware
- [ ] Permission service returns correct permissions for each user type
- [ ] JWT tokens include permissions and role information
- [ ] Performance tests pass (< 100ms for permission checks)
- [ ] Security audit completed (no permission bypass possible)

### **✅ Frontend Ready**  
- [ ] usePermissions hook works correctly
- [ ] PermissionGate component hides/shows content appropriately
- [ ] Navigation adapts based on user permissions
- [ ] All screens updated with granular permission controls
- [ ] Admin screens for role management functional
- [ ] No UI elements accessible without proper permissions

### **✅ User Experience**
- [ ] Smooth migration for existing users (no data loss)
- [ ] Clear error messages when access denied
- [ ] Intuitive role assignment for company admins
- [ ] Help documentation updated for new permission system
- [ ] Onboarding flow includes role selection

### **✅ Business Logic**
- [ ] 4 subscription plans correctly mapped to permissions
- [ ] Company creation assigns default roles
- [ ] Billing system updated for new subscription tiers
- [ ] Analytics track permission usage patterns
- [ ] Upselling flow works (employee → contractor → enterprise)

---

## ⚠️ **Risques & Mitigations**

### **🔥 Risque Majeur: Data Migration**
- **Problème** : Perte données ou corruption lors migration users → companies
- **Mitigation** : 
  - Backup complet avant migration
  - Script de migration testé en staging
  - Rollback plan documenté
  - Migration par batch avec validation

### **⚡ Risque Performance**
- **Problème** : Permission checks ralentissent l'app
- **Mitigation** :
  - Cache permissions en session/Redis  
  - Middleware optimisé avec lookup tables
  - Permissions incluses dans JWT
  - Monitoring performance continu

### **🔒 Risque Sécurité**
- **Problème** : Bypass des permissions ou escalation de privilèges
- **Mitigation** :
  - Validation côté serveur TOUJOURS
  - Tests de sécurité automatisés
  - Audit log pour toutes les actions sensibles
  - Principe du moindre privilège par défaut

### **👥 Risque UX**
- **Problème** : Users confus par nouveau système de rôles
- **Mitigation** :
  - Migration transparente (mapping automatique)
  - Documentation claire des nouveaux rôles
  - Support client renforcé pendant transition
  - Feedback loop pour ajuster permissions

---

## 🎯 **Success Metrics**

### **Metrics Techniques**
- **Performance** : Permission checks < 50ms (95th percentile)
- **Availability** : 99.9% uptime pendant migration
- **Security** : 0 security incidents liés aux permissions
- **Data Integrity** : 100% des users migrés correctement

### **Metrics Business**  
- **User Adoption** : 90% des users actifs post-migration (30 jours)
- **Subscription Upgrades** : 25% des contractors upgrade vers enterprise
- **Enterprise Sales** : 50 nouveaux clients enterprise dans 3 mois
- **Support Tickets** : < 5% d'augmentation liée aux permissions

### **Metrics Produit**
- **Feature Usage** : 80% des admins utilisent la gestion des rôles
- **Error Rate** : < 2% d'erreurs sur actions sensibles
- **User Satisfaction** : NPS > 70 sur nouveau système
- **Time to Value** : Nouveaux users productifs en < 30 minutes

---

## 🚀 **Post-Launch Roadmap**

### **Mois +1 : Optimisations**
- Analytics usage patterns permissions
- Fine-tuning rôles based on user feedback
- Performance optimizations caching
- Documentation et formation clients

### **Mois +3 : Advanced Features**
- Custom roles pour enterprise clients
- Temporary permission delegation 
- Audit dashboard pour compliance
- API permissions pour intégrations tierces

### **Mois +6 : Enterprise Extensions**
- SSO integration (SAML, OAuth)
- Advanced compliance features
- Multi-tenant isolation
- White-label branding par company

---

**Le système de permissions transformera SwiftApp d'une app mobile en véritable plateforme SaaS B2B enterprise-ready ! 🚀**
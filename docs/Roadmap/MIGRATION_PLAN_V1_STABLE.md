# 🚨 PLAN DE MIGRATION TECHNIQUE V1 - PRIORITÉ ABSOLUE

## 🔥 **GAPS CRITIQUES IDENTIFIÉS PAR AUDIT EXTERNE**

L'audit externe révèle des **risques majeurs pour la stabilité V1** qui doivent être résolus **AVANT** toute feature entreprise.

---

## 📋 **MIGRATION 1 : SUPPRESSION MOCK DATA**

### **🎯 Objectif :** 0% Mock Data en Production

#### **Hook useStaff.ts** `CRITIQUE`
```typescript
// ❌ ACTUEL (Mock Data)
const mockStaff: StaffMember[] = [
  {
    id: 'emp_1',
    firstName: 'John',
    lastName: 'Smith',
    // ... données hardcodées
  }
];

// ✅ MIGRATION
const { data: staff, isLoading, error } = useFetch('/api/staff');
```

**Actions requises :**
- [ ] Créer endpoints backend `/api/staff` (GET, POST, PUT, DELETE)
- [ ] Remplacer mockStaff par API calls
- [ ] Migrer logique invite/add vers backend
- [ ] Tests avec vraies données API

#### **Hook useJobsBilling.ts** `BLOQUANT`
```typescript
// ❌ ACTUEL (Mock Fallback)
const mockBillingJobs = generateMockJobs();

// ✅ MIGRATION  
const billingJobs = await fetchJobsWithBilling();
```

**Actions requises :**
- [ ] Endpoint `/api/jobs/billing` avec Stripe integration
- [ ] Suppression logique fallback mock
- [ ] API payment status temps réel
- [ ] Invoice generation via Stripe API

#### **Services Business** `URGENT`
```typescript
// ❌ templatesService.ts - mockTemplates
// ❌ businessService.ts - mockBusinessInfo

// ✅ MIGRATION
const templates = await apiClient.get('/quotes/templates');
const businessStats = await apiClient.get('/business/stats');
```

---

## 🎨 **MIGRATION 2 : DESIGN SYSTEM COMPLET**

### **🎯 Objectif :** Design System Unifié 100%

#### **Audit des Composants**
```bash
# Identifier composants legacy
grep -r "old-style" src/components/
grep -r "legacy-tokens" src/styles/

# Composants à migrer:
- StaffCrewScreen styling
- JobsBillingScreen layout  
- Business components theming
- Test mocks design tokens
```

#### **Plan de Migration**
- [ ] **Semaine 1 :** i18n complète + Audit complet composants legacy
- [ ] **Semaine 2 :** Migration API + Migration vers design tokens unifés
- [ ] **Semaine 3 :** Tests + validation cross-platform
- [ ] **Semaine 4 :** Documentation design system final

## 🌍 **MIGRATION 3 : INTERNATIONALISATION CRITIQUE**

### **🎯 Objectif :** App 100% Multilingue

#### **Problem Identifié** `CRITIQUE`
- ✅ Système i18n technique excellent (7 langues supportées)
- ❌ Couverture production 0% - Textes hardcodés partout !
- ❌ paymentWindow.tsx : français hardcodé 
- ❌ staffCrewScreen.tsx : aucun t() utilisé
- ❌ VehicleFleetScreen.tsx : anglais hardcodé

#### **Migration i18n Urgente**
```typescript
// AVANT - Textes hardcodés
Alert.alert("Informations manquantes", "Veuillez remplir tous les champs");

// APRÈS - Traductions
const { t } = useTranslation();
Alert.alert(t('payment.errors.missingInfo'), t('payment.errors.missingInfoDesc'));
```

**Actions critiques :**
- [ ] Compléter clés traduction business/payment/profile
- [ ] Migrer TOUS screens vers useTranslation()
- [ ] Éliminer 100% textes hardcodés
- [ ] Support 7 langues production

---

## 🔧 **MIGRATION 4 : API BACKEND COMPLÈTE**

### **🎯 Objectif :** APIs Production-Ready

#### **Stripe Backend** `CRITIQUE`
**Endpoints manquants :**
```yaml
# Payments
POST /api/stripe/create-payment-intent
POST /api/stripe/confirm-payment  
GET /api/stripe/payment-status/{id}

# Invoices  
POST /api/stripe/create-invoice
GET /api/stripe/invoices
POST /api/stripe/send-invoice

# Refunds
POST /api/stripe/refund/{payment_id}
GET /api/stripe/refunds
```

#### **Staff Management API** `URGENT`
```yaml
# CRUD Staff
GET /api/staff              # List all staff
POST /api/staff/invite      # Invite employee  
POST /api/staff/contractor  # Add contractor
PUT /api/staff/{id}         # Update staff
DELETE /api/staff/{id}      # Remove staff

# Stats
GET /api/staff/stats        # Dashboard metrics
```

#### **Business Statistics** `BLOQUANT`
```yaml
# Business Dashboard  
GET /api/business/stats     # Revenue, jobs, performance
GET /api/business/reports   # Detailed analytics
GET /api/business/profile   # Company information
```

---

## ⚡ **TIMELINE MIGRATION URGENTE**

### **SEMAINE 1 (DEC 9-15) : APIs Critiques**
- 🔥 **Lundi-Mardi :** Stripe endpoints backend
- 🔥 **Mercredi-Jeudi :** Staff Management API  
- 🔥 **Vendredi :** Business Stats API + tests

### **SEMAINE 2 (DEC 16-22) : Frontend Migration**
- 📱 **Lundi :** useStaff → API integration
- 📱 **Mardi :** useJobsBilling → Stripe API
- 📱 **Mercredi-Jeudi :** Business services migration
- 📱 **Vendredi :** Tests intégration complète

### **SEMAINE 3 (DEC 23-29) : Design System**
- 🎨 **Lundi-Mardi :** Audit + migration composants
- 🎨 **Mercredi-Jeudi :** Tests + validation
- 🎨 **Vendredi :** Documentation finale

### **SEMAINE 4 (DEC 30-JAN 5) : Validation Complète**
- ✅ **Lundi-Mardi :** Tests E2E avec vraies APIs
- ✅ **Mercredi-Jeudi :** Performance testing
- ✅ **Vendredi :** Sign-off V1 stable

---

## 🔍 **CRITÈRES DE VALIDATION V1**

### **✅ Mock Data = 0%**
```bash
# Audit final
grep -r "mock" src/ --exclude-dir=__tests__ | wc -l  # = 0
grep -r "hardcoded" src/ --exclude-dir=__tests__ | wc -l  # = 0
```

### **✅ APIs Production-Ready**
- [ ] Stripe endpoints 100% fonctionnels
- [ ] Staff CRUD complet avec auth
- [ ] Business stats temps réel
- [ ] Error handling + retry logic

### **✅ Design System Unifié**
- [ ] 0 composant legacy
- [ ] Design tokens cohérents
- [ ] Tests UI tous passants
- [ ] Documentation complète

### **✅ Performance Production**
- [ ] Loading time < 3s  
- [ ] API response < 500ms
- [ ] Error rate < 0.1%
- [ ] Memory usage stable

---

## ⚠️ **RISQUES & MITIGATIONS**

### **Risque 1 :** Délais backend API
**Mitigation :** 
- Prioriser endpoints critiques (Stripe, Staff)
- Paralléliser développement frontend/backend  
- Fallback graceful si API indisponible

### **Risque 2 :** Breaking changes design
**Mitigation :**
- Tests visuels automatisés
- Validation step-by-step
- Rollback plan si régressions

### **Risque 3 :** Data migration  
**Mitigation :**
- Scripts migration automatisés
- Backup données critiques
- Validation data integrity

---

## 🎯 **SUCCESS METRICS**

- **Stabilité :** 0 crash lié à mock data
- **Performance :** APIs < 500ms response time
- **UX :** Design 100% cohérent cross-platform  
- **Business :** Prêt pour features entreprise Q1 2026

**🚀 CETTE MIGRATION EST LA FONDATION pour le succès des systèmes de gamification et permissions enterprise !**
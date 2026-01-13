# 📊 Guide d'utilisation - Analytics & Monitoring Swift App

## Vue d'ensemble
Le système analytics/monitoring de Swift App fournit une surveillance complète de l'application avec tracking des événements, monitoring des performances, alertes automatiques et logging centralisé.

## 🏗️ Architecture

### Services principaux
```
src/services/
├── analytics.ts          # Service principal d'analytics
├── alertService.ts       # Système d'alertes et monitoring  
├── logger.ts            # Logging centralisé
└── navigationService.ts  # Navigation avec tracking
```

### Components & Hooks
```
src/components/analytics/
├── AnalyticsDashboard.tsx  # Dashboard temps réel
└── AlertsPanel.tsx        # Panel des alertes

src/hooks/
└── useAnalytics.ts        # Hook React pour analytics
```

## 🚀 Utilisation rapide

### 1. Analytics de base dans un composant

```tsx
import { useAnalytics } from '../hooks/useAnalytics';

function MyScreen() {
  // Auto-track screen view et screen time
  const analytics = useAnalytics('MyScreen', 'PreviousScreen');

  const handleButtonClick = () => {
    // Track action utilisateur
    analytics.track.userAction('button_clicked', {
      button_name: 'primary_action',
      context: 'homepage'
    });
  };

  const handleJobStep = async (jobId: string) => {
    // Track progression de job
    analytics.track.jobStep(jobId, 2, 5, 'Notes optionnelles');
  };

  return (
    <View>
      <TouchableOpacity onPress={handleButtonClick}>
        <Text>Mon Bouton</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 2. Tracking des API calls

```tsx
import { updateJobStep } from '../services/jobSteps';

// Le service jobSteps.ts intègre automatiquement :
// - Mesure du temps de réponse
// - Tracking des erreurs
// - Logging des appels API
// - Alertes en cas d'échec

const result = await updateJobStep(jobId, newStep, notes);
// ✅ Analytics automatiques inclus
```

### 3. Navigation avec analytics

```tsx
import { navigationService } from '../services/navigationService';

// Navigation avec tracking automatique
await navigationService.navigate('JobDetails', {
  params: { jobId: '123' }
});

// Stats de navigation disponibles
const stats = navigationService.getNavigationStats();
console.log(stats);
```

## 📈 Dashboard Analytics

### Intégration du Dashboard

```tsx
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';

function AdminScreen() {
  return (
    <ScrollView>
      <AnalyticsDashboard />
      {/* Autres composants */}
    </ScrollView>
  );
}
```

### Métriques disponibles
- **Business**: Jobs créés, terminés, revenus
- **Paiements**: Tentatives, succès, échecs
- **Utilisateurs**: Sessions actives, rétention
- **Performance**: Temps API, erreurs, uptime

## 🚨 Système d'alertes

### Alerts automatiques configurées

```typescript
// Règles pré-configurées dans alertService.ts
const DEFAULT_ALERT_RULES = [
  {
    name: 'payment_failure_rate',
    condition: 'payment_failure_rate > 5%',
    channels: ['email', 'push']
  },
  {
    name: 'api_response_time',
    condition: 'avg_api_response_time > 2000ms',
    channels: ['email']
  },
  {
    name: 'system_uptime',
    condition: 'uptime < 99%',
    channels: ['email', 'sms']
  }
];
```

### Intégration du panel d'alertes

```tsx
import { AlertsPanel } from '../components/analytics/AlertsPanel';

function MonitoringScreen() {
  return (
    <View>
      <AlertsPanel />
    </View>
  );
}
```

## 📝 Logging centralisé

### Utilisation du logger

```tsx
import { logger } from '../services/logger';

// Différents niveaux de log
logger.debug('Information de debug', { context: 'data' });
logger.info('Information générale', { userId: '123' });
logger.warn('Avertissement', { issue: 'deprecated_api' });
logger.error('Erreur critique', { error: error.message });
logger.fatal('Erreur fatale', { system: 'payment' });

// Logging avec corrélation
const correlationId = logger.generateCorrelationId();
logger.info('Début opération', { correlationId });
logger.info('Fin opération', { correlationId });
```

### Logs automatiques
- ✅ Toutes les erreurs d'API
- ✅ Navigation entre écrans
- ✅ Évènements analytics
- ✅ Alertes déclenchées
- ✅ Performance de l'app

## 🎯 Événements trackés automatiquement

### Navigation
```typescript
// Auto-trackés via useAnalytics et navigationService
- screen_view          # Vue d'écran
- screen_time         # Temps passé sur écran  
- navigation_back     # Retour arrière
```

### Job Management
```typescript
// Via updateJobStep() et useAnalytics
- job_step_advanced   # Progression d'étape
- job_completed      # Job terminé
- job_created        # Nouveau job
```

### Paiements
```typescript
// Via services de paiement
- payment_initiated  # Paiement démarré
- payment_completed  # Paiement réussi  
- payment_failed     # Échec de paiement
```

### Performance
```typescript
// Auto-trackés par les services
- api_call           # Appel API avec timing
- performance_metric # Métriques custom
- error_occurred     # Erreurs applicatives
```

## 🔧 Configuration

### Variables d'environnement
```env
# Backend analytics endpoint
ANALYTICS_ENDPOINT=https://altivo.fr/swift-app/analytics

# Logging configuration  
LOG_LEVEL=info          # debug|info|warn|error|fatal
LOG_FLUSH_INTERVAL=30   # secondes
LOG_BATCH_SIZE=50       # nombre d'événements

# Alerts configuration
ALERT_EMAIL=admin@swiftapp.com
ALERT_SMS=+61400000000
```

### Activation/désactivation

```tsx
import { analytics } from '../services/analytics';

// Désactiver temporairement
analytics.disable();

// Réactiver
analytics.enable();

// Vérifier le statut
console.log(analytics.isEnabled);
```

## 📊 Métriques business importantes

### 1. KPIs Jobs
```typescript
// Automatically tracked
- jobs_created_today
- jobs_completed_today  
- average_completion_time
- completion_rate
```

### 2. KPIs Paiements
```typescript
// Automatically tracked
- total_revenue_today
- payment_success_rate
- average_payment_amount
- failed_payments_count
```

### 3. KPIs Utilisateurs
```typescript
// Automatically tracked  
- active_users_today
- session_duration
- screen_views_per_session
- retention_rate
```

## 🚀 Déploiement & Monitoring

### 1. Validation pré-production
```bash
# Vérifier la configuration
npm run test:analytics

# Test des endpoints
npm run test:api-endpoints

# Validation du logging
npm run test:logging
```

### 2. Monitoring production
- ✅ Dashboard temps réel accessible
- ✅ Alertes par email/SMS configurées  
- ✅ Logs sauvegardés au backend
- ✅ Métriques business trackées

### 3. Maintenance
```typescript
// Nettoyage périodique des logs (automatique)
logger.cleanup(); 

// Export des données analytics
analytics.exportData('2024-12-01', '2024-12-31');

// Backup des métriques
analytics.backup();
```

## 🆘 Dépannage

### Problèmes courants

1. **Analytics pas trackés**
```typescript
// Vérifier que le service est activé
console.log(analytics.isEnabled); // true ?

// Vérifier les headers d'auth
import { getAuthHeaders } from '../utils/auth';
console.log(await getAuthHeaders());
```

2. **Logs non sauvegardés**
```typescript
// Forcer la synchronisation
logger.flush();

// Vérifier la queue
console.log(logger.getQueueSize());
```

3. **Alertes non reçues**
```typescript
// Tester manuellement une alerte
alertService.triggerTestAlert('payment_failure_test');
```

## 📚 Ressources

- **Tests**: `/tests/analytics/` - Suites de tests complètes
- **Documentation API**: Backend endpoints documentation  
- **Examples**: `/src/screens/JobStepScreenWithAnalytics.tsx`
- **Types**: `/src/types/analytics.ts` - Définitions TypeScript

---

**Support**: Pour questions techniques, voir `RAPPORT_SITUATION_GENERALE_SWIFTAPP.md`

**Version**: 1.0.0 - Système complet déployé  
**Dernière mise à jour**: Décembre 2024
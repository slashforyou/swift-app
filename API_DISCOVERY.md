# 📚 API DISCOVERY - DOCUMENTATION ENDPOINT

**Date :** 17 décembre 2025  
**Endpoint :** `/swift-app/v1/api/discover`  
**Méthode :** GET  
**Authentification :** Non requise (endpoint public)

---

## 🎯 OBJECTIF

L'endpoint **API Discovery** scanne automatiquement tous les endpoints disponibles de votre API SwiftApp et retourne une documentation structurée en temps réel. 

**Avantages :**
- ✅ **Toujours à jour** - Scanne les routes réelles du serveur
- ✅ **Aucune maintenance** - Pas de fichier JSON statique à maintenir
- ✅ **Découverte automatique** - Détecte les nouveaux endpoints automatiquement
- ✅ **Catégorisation intelligente** - Organise par fonctionnalité
- ✅ **Informations complètes** - Méthodes, paramètres, authentification

---

## 📡 ENDPOINTS DISPONIBLES

### 1. **GET** `/swift-app/v1/api/discover`
**Description :** Retourne la documentation complète de tous les endpoints

**Réponse :**
```json
{
  "success": true,
  "data": {
    "api_info": {
      "version": "v1",
      "base_url": "https://altivo.fr/swift-app/v1",
      "total_endpoints": 222,
      "scanned_at": "2025-12-17T10:30:00.000Z",
      "server_time": "2025-12-17T10:30:00.000Z",
      "authentication": {
        "type": "JWT Bearer Token",
        "header": "Authorization: Bearer {token}",
        "description": "La plupart des endpoints nécessitent un token JWT valide"
      }
    },
    "categories": {
      "Stripe & Payments": {
        "count": 17,
        "routes": [
          {
            "method": "POST",
            "path": "/swift-app/v1/stripe/connect/create"
          },
          ...
        ]
      },
      "Jobs Management": {
        "count": 45,
        "routes": [...]
      },
      ...
    },
    "endpoints": [
      {
        "method": "POST",
        "path": "/swift-app/v1/stripe/connect/create",
        "full_url": "https://altivo.fr/swift-app/v1/stripe/connect/create",
        "category": "Stripe & Payments",
        "description": "Créer un compte Stripe Connect",
        "authentication_required": true,
        "parameters": {
          "path": [],
          "query": [],
          "body": []
        },
        "responses": {
          "success": "200 - Success",
          "created": "201 - Created",
          "unauthorized": "401 - Unauthorized",
          "forbidden": "403 - Forbidden",
          "notFound": "404 - Not Found",
          "error": "500 - Internal Server Error"
        }
      },
      ...
    ],
    "usage_example": {
      "description": "Exemple d'utilisation avec fetch",
      "code": "..."
    }
  }
}
```

---

### 2. **GET** `/swift-app/v1/api/discover/summary`
**Description :** Retourne un résumé condensé par catégorie

**Réponse :**
```json
{
  "success": true,
  "data": {
    "total_endpoints": 222,
    "base_url": "https://altivo.fr/swift-app/v1",
    "categories": {
      "Stripe & Payments": {
        "count": 17,
        "routes": [
          {"method": "POST", "path": "/swift-app/v1/stripe/connect/create"},
          {"method": "GET", "path": "/swift-app/v1/stripe/connect/status"}
        ]
      },
      "Jobs Management": {
        "count": 45,
        "routes": [...]
      }
    },
    "scanned_at": "2025-12-17T10:30:00.000Z"
  }
}
```

---

### 3. **GET** `/swift-app/v1/api/discover/category/:category`
**Description :** Retourne les endpoints d'une catégorie spécifique

**Paramètres :**
- `category` (path) : Nom de la catégorie (case insensitive)

**Catégories disponibles :**
- `Stripe & Payments`
- `Payments`
- `Jobs Management`
- `Clients`
- `Users`
- `Authentication`
- `API Documentation`
- `General`

**Exemple :**
```bash
GET /swift-app/v1/api/discover/category/payments
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "category": "Payments",
    "count": 16,
    "endpoints": [
      {
        "method": "POST",
        "path": "/swift-app/v1/jobs/:job_id/payment/create",
        "full_url": "https://altivo.fr/swift-app/v1/jobs/:job_id/payment/create",
        "category": "Payments",
        "description": "Créer un Payment Intent",
        "authentication_required": true,
        "parameters": {
          "path": [
            {
              "name": "job_id",
              "type": "path",
              "required": true
            }
          ],
          "query": [],
          "body": []
        },
        "responses": {
          "success": "200 - Success",
          "created": "201 - Created",
          "unauthorized": "401 - Unauthorized",
          "forbidden": "403 - Forbidden",
          "notFound": "404 - Not Found",
          "error": "500 - Internal Server Error"
        }
      }
    ]
  }
}
```

**Erreur si catégorie inexistante :**
```json
{
  "success": false,
  "error": "Category not found",
  "message": "No endpoints found in category: invalid-category",
  "available_categories": [
    "General",
    "API Documentation",
    "Authentication",
    "Clients",
    "Jobs Management",
    "Stripe & Payments",
    "Payments"
  ]
}
```

---

## 💻 EXEMPLES D'INTÉGRATION FRONTEND

### JavaScript Vanilla

```javascript
// Récupérer tous les endpoints
async function getAllEndpoints() {
  const response = await fetch('https://altivo.fr/swift-app/v1/api/discover');
  const data = await response.json();
  
  if (data.success) {
    console.log(`Total endpoints: ${data.data.api_info.total_endpoints}`);
    console.log('Endpoints:', data.data.endpoints);
    return data.data.endpoints;
  }
}

// Récupérer uniquement les endpoints Stripe
async function getStripeEndpoints() {
  const response = await fetch('https://altivo.fr/swift-app/v1/api/discover/category/stripe & payments');
  const data = await response.json();
  
  if (data.success) {
    console.log('Stripe endpoints:', data.data.endpoints);
    return data.data.endpoints;
  }
}

// Récupérer le résumé
async function getApiSummary() {
  const response = await fetch('https://altivo.fr/swift-app/v1/api/discover/summary');
  const data = await response.json();
  
  if (data.success) {
    console.log('Categories:', Object.keys(data.data.categories));
    return data.data;
  }
}
```

---

### React Hook

```typescript
import { useState, useEffect } from 'react';

interface ApiEndpoint {
  method: string;
  path: string;
  full_url: string;
  category: string;
  description: string;
  authentication_required: boolean;
  parameters: {
    path: Array<{ name: string; type: string; required: boolean }>;
    query: any[];
    body: any[];
  };
  responses: Record<string, string>;
}

interface ApiDiscoveryData {
  api_info: {
    version: string;
    base_url: string;
    total_endpoints: number;
    scanned_at: string;
  };
  categories: Record<string, { count: number; routes: any[] }>;
  endpoints: ApiEndpoint[];
}

export function useApiDiscovery(category?: string) {
  const [data, setData] = useState<ApiDiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = category 
          ? `https://altivo.fr/swift-app/v1/api/discover/category/${category}`
          : 'https://altivo.fr/swift-app/v1/api/discover';
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || 'Failed to fetch API documentation');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category]);

  return { data, loading, error };
}

// Utilisation dans un composant
function ApiDocumentation() {
  const { data, loading, error } = useApiDiscovery();

  if (loading) return <div>Loading API documentation...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>API Documentation</h1>
      <p>Total endpoints: {data.api_info.total_endpoints}</p>
      
      <h2>Categories</h2>
      {Object.entries(data.categories).map(([category, info]) => (
        <div key={category}>
          <h3>{category} ({info.count} endpoints)</h3>
        </div>
      ))}
      
      <h2>All Endpoints</h2>
      {data.endpoints.map((endpoint, index) => (
        <div key={index}>
          <code>{endpoint.method} {endpoint.path}</code>
          <p>{endpoint.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### Service TypeScript

```typescript
interface ApiDiscoveryService {
  getAllEndpoints(): Promise<ApiEndpoint[]>;
  getEndpointsByCategory(category: string): Promise<ApiEndpoint[]>;
  getSummary(): Promise<any>;
  getCategories(): Promise<string[]>;
  findEndpoint(path: string): Promise<ApiEndpoint | null>;
}

class SwiftAppApiDiscovery implements ApiDiscoveryService {
  private baseUrl = 'https://altivo.fr/swift-app/v1/api/discover';
  private cache: Map<string, any> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async getAllEndpoints(): Promise<ApiEndpoint[]> {
    const cacheKey = 'all-endpoints';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(this.baseUrl);
    const data = await response.json();
    
    if (data.success) {
      this.setCache(cacheKey, data.data.endpoints);
      return data.data.endpoints;
    }
    throw new Error('Failed to fetch endpoints');
  }

  async getEndpointsByCategory(category: string): Promise<ApiEndpoint[]> {
    const cacheKey = `category-${category}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${this.baseUrl}/category/${category}`);
    const data = await response.json();
    
    if (data.success) {
      this.setCache(cacheKey, data.data.endpoints);
      return data.data.endpoints;
    }
    throw new Error(`Category ${category} not found`);
  }

  async getSummary() {
    const cacheKey = 'summary';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${this.baseUrl}/summary`);
    const data = await response.json();
    
    if (data.success) {
      this.setCache(cacheKey, data.data);
      return data.data;
    }
    throw new Error('Failed to fetch summary');
  }

  async getCategories(): Promise<string[]> {
    const summary = await this.getSummary();
    return Object.keys(summary.categories);
  }

  async findEndpoint(path: string): Promise<ApiEndpoint | null> {
    const endpoints = await this.getAllEndpoints();
    return endpoints.find(e => e.path === path) || null;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    if (Date.now() - timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    return data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Export singleton
export const apiDiscovery = new SwiftAppApiDiscovery();
```

---

## 🔍 CAS D'USAGE

### 1. **Générer automatiquement la navigation de l'app**
```javascript
const categories = await apiDiscovery.getCategories();
const navigation = categories.map(category => ({
  label: category,
  endpoints: await apiDiscovery.getEndpointsByCategory(category)
}));
```

### 2. **Créer un testeur d'API interactif**
```javascript
const endpoint = await apiDiscovery.findEndpoint('/swift-app/v1/jobs/:job_id/payment/create');
// Afficher un formulaire avec les paramètres requis
console.log('Required parameters:', endpoint.parameters.path);
```

### 3. **Vérifier la disponibilité d'un endpoint**
```javascript
async function isEndpointAvailable(path) {
  const endpoint = await apiDiscovery.findEndpoint(path);
  return endpoint !== null;
}
```

### 4. **Générer automatiquement un SDK client**
```javascript
const endpoints = await apiDiscovery.getAllEndpoints();
const sdk = generateSdkFromEndpoints(endpoints);
```

---

## 📊 STATISTIQUES

Le scanner détecte actuellement :
- **222 endpoints** au total
- **17 endpoints** Stripe & Payments
- **16 endpoints** Payments
- **45 endpoints** Jobs Management
- **7 catégories** distinctes

---

## 🔄 MISE À JOUR AUTOMATIQUE

L'endpoint scanne le serveur **en temps réel** à chaque appel. Cela signifie :

✅ **Nouveaux endpoints** détectés automatiquement  
✅ **Endpoints supprimés** retirés immédiatement  
✅ **Modifications** reflétées instantanément  
✅ **Pas de cache côté serveur** (toujours actuel)

**Recommandation :** Implémenter un cache côté frontend (5-10 minutes) pour optimiser les performances.

---

## 🎯 PROCHAINES AMÉLIORATIONS

### Phase 2 (Optionnel)
- [ ] Annotations JSDoc pour enrichir les descriptions
- [ ] Extraction automatique des schémas body (Joi/Zod)
- [ ] Exemples de requêtes/réponses automatiques
- [ ] Support OpenAPI 3.0 complet
- [ ] Interface web Swagger UI intégrée

---

## 💡 BONNES PRATIQUES

### Frontend
1. **Cache les résultats** pendant 5-10 minutes
2. **Utilise le summary** pour la navigation principale
3. **Filtre par catégorie** pour des pages spécialisées
4. **Vérifie `authentication_required`** avant d'appeler un endpoint

### Performance
- L'endpoint `/summary` est plus léger que `/discover` complet
- Utilisez les filtres par catégorie pour réduire la payload
- Implémentez un cache côté client

---

## 🔗 LIENS UTILES

- **Documentation complète :** `/swift-app/v1/api/discover`
- **Résumé rapide :** `/swift-app/v1/api/discover/summary`
- **Par catégorie :** `/swift-app/v1/api/discover/category/{category}`

---

## 📞 SUPPORT

Pour toute question sur l'utilisation de l'API Discovery :
- Consultez cette documentation
- Testez avec curl ou Postman
- Vérifiez les exemples d'intégration ci-dessus

**Votre API est maintenant auto-documentée ! 🎉**

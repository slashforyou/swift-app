# 🎯 PLAN D'ACTION - 100% TESTS

## 📊 ÉTAT ACTUEL
- **Tests** : 206/355 (58.0%)
- **Objectif** : 355/355 (100%)
- **À corriger** : 149 tests (42%)
- **Suites en échec** : 9/23

---

## 🎯 STRATÉGIE PAR PHASES

### **PHASE 1 : Quick Wins - Hooks (30-40 tests)** ⚡
**Temps estimé** : 1-2h

1. **useStaff.test.ts** (9 échecs)
   - Problème : `loadStaff()` ne s'exécute pas au mount
   - Solution : Mock `useEffect` ou attendre avec `waitFor`
   - Impact : +9 tests

2. **useStaff-fixed.test.ts** (15 échecs)
   - Problème : Similaire à useStaff.test.ts
   - Solution : Même correction
   - Impact : +15 tests

3. **useJobPhotos.test.ts** (2 échecs)
   - Problème : Warnings `act()` - updates non wrappés
   - Solution : Wrapper dans `act()` ou utiliser `waitFor`
   - Impact : +2 tests

4. **useJobsBilling.test.ts** (? échecs)
   - À analyser
   - Impact : Estim é +5-10 tests

**Sous-total Phase 1** : ~31-36 tests

---

### **PHASE 2 : Components Modals (40-50 tests)** 🎨
**Temps estimé** : 2-3h

5. **InviteEmployeeModal.test.tsx**
   - Problème : Textes FR vs EN, navigation
   - Solution : Adapter textes, mocker navigation
   - Impact : +15-20 tests

6. **AddContractorModal.test.tsx**
   - Problème : Même type - textes, navigation
   - Solution : Adapter comme InviteEmployeeModal
   - Impact : +15-20 tests

**Sous-total Phase 2** : ~30-40 tests

---

### **PHASE 3 : Screens (30-40 tests)** 📱
**Temps estimé** : 2-3h

7. **staffCrewScreen.test.tsx**
   - Problème : Intégration avec hooks, navigation
   - Solution : Mocks complets hooks + navigation
   - Impact : +10-15 tests

8. **TrucksScreen.test.tsx**
   - Problème : Similaire à staffCrewScreen
   - Solution : Mocks hooks + state management
   - Impact : +10-15 tests

9. **JobsBillingScreen.test.tsx**
   - Problème : Hook billing + data display
   - Solution : Mock useJobsBilling
   - Impact : +10-15 tests

**Sous-total Phase 3** : ~30-45 tests

---

## 📊 PROJECTION

| Phase | Tests | Cumul | % Total |
|-------|-------|-------|---------|
| Actuel | 206 | 206 | 58.0% |
| Phase 1 | +35 | 241 | 67.9% ✅ |
| Phase 2 | +35 | 276 | 77.7% ✅ |
| Phase 3 | +35 | 311 | 87.6% ✅ |
| Polish | +44 | 355 | **100%** 🎉 |

---

## 🚀 ORDRE D'EXÉCUTION OPTIMAL

### **QUICK WINS IMMÉDIATS** (30 min)
1. useStaff.test.ts - Corriger loadStaff
2. useJobPhotos.test.ts - Wrapper act()
3. **+11 tests → 217 tests (61%)** ✅

### **HOOKS COMPLETION** (1h)
4. useStaff-fixed.test.ts
5. useJobsBilling.test.ts
6. **+20 tests → 237 tests (67%)** ✅

### **MODALS FIX** (2h)
7. InviteEmployeeModal
8. AddContractorModal
9. **+35 tests → 272 tests (77%)** ✅

### **SCREENS FIX** (2h)
10. staffCrewScreen
11. TrucksScreen
12. JobsBillingScreen
13. **+35 tests → 307 tests (86%)** ✅

### **FINAL POLISH** (1-2h)
14. Tous les tests restants
15. **+48 tests → 355 tests (100%)** 🎉

---

## 💡 PRINCIPES CLÉS

### **1. Tester les hooks React correctement**
```typescript
// ✅ BON
const { result } = renderHook(() => useStaff());
await waitFor(() => {
  expect(result.current.staff.length).toBeGreaterThan(0);
});

// ❌ MAUVAIS
const hook = useStaff(); // Ne fonctionne pas hors composant
```

### **2. Wrapper les state updates**
```typescript
// ✅ BON
await act(async () => {
  await result.current.inviteEmployee(data);
});

// ❌ MAUVAIS
await result.current.inviteEmployee(data); // Warning act()
```

### **3. Attendre les données async**
```typescript
// ✅ BON
await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
}, { timeout: 3000 });

// ❌ MAUVAIS
expect(result.current.isLoading).toBe(false); // Trop tôt
```

---

## ⏱️ TIMELINE ESTIMÉE

| Tâche | Temps | Tests | Total |
|-------|-------|-------|-------|
| Quick Wins | 30 min | +11 | 217 (61%) |
| Hooks | 1h | +20 | 237 (67%) |
| Modals | 2h | +35 | 272 (77%) |
| Screens | 2h | +35 | 307 (86%) |
| Polish | 2h | +48 | 355 (100%) |
| **TOTAL** | **7.5h** | **+149** | **100%** 🏆 |

---

## 🎯 MILESTONE TARGETS

- ✅ **60% (213 tests)** - Dans 30 min
- ✅ **70% (249 tests)** - Dans 2h
- ✅ **80% (284 tests)** - Dans 4h
- ✅ **90% (320 tests)** - Dans 6h
- 🏆 **100% (355 tests)** - Dans 7.5h

---

*Let's do this! 🚀*

/**
 * Test de diagnostic pour useStaff
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

// Démock useStaff pour tester le vrai hook
jest.unmock('../../src/hooks/useStaff');

import { useStaff } from '../../src/hooks/useStaff';

describe('useStaff Diagnostic', () => {
  it('should load data after refreshStaff', async () => {
    const { result } = renderHook(() => useStaff());
    
    const beforeKeys = Object.keys(result.current);
    const beforeStaffLength = result.current.staff.length;
    
    // Essayons de charger
    await act(async () => {
      await result.current.refreshStaff();
    });
    
    const afterStaffLength = result.current.staff.length;
    const afterEmployeesLength = result.current.employees.length;
    const afterContractorsLength = result.current.contractors.length;
    
    // Snapshot pour voir ce qui se passe
    expect({
      beforeKeys,
      beforeStaffLength,
      afterStaffLength,
      afterEmployeesLength,
      afterContractorsLength,
      hasRefreshStaff: typeof result.current.refreshStaff,
      hasRefreshData: typeof result.current.refreshData,
    }).toMatchSnapshot();
    
    // Test réel
    expect(afterStaffLength).toBeGreaterThan(0);
  });
});

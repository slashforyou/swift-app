/**
 * Test de debug pour useStaff
 */

import { renderHook } from '@testing-library/react-native';
import { useStaff } from '../../src/hooks/useStaff';

describe('useStaff Debug', () => {
  it('should show what is returned', () => {
    const { result } = renderHook(() => useStaff());
    
    const keys = Object.keys(result.current);
    const refreshDataType = typeof result.current.refreshData;
    const filterStaffType = typeof result.current.filterStaff;
    const refreshStaffType = typeof result.current.refreshStaff;
    const inviteEmployeeType = typeof result.current.inviteEmployee;
    
    // Forcer l'échec pour voir les valeurs
    expect({
      keys,
      types: {
        refreshData: refreshDataType,
        filterStaff: filterStaffType,
        refreshStaff: refreshStaffType,
        inviteEmployee: inviteEmployeeType,
      }
    }).toMatchSnapshot();
  });
});

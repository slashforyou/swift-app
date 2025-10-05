/**
 * Hook for accessing common styles with theming
 * Combines our color system with common styles for consistent UI
 */

import { useThemeColors } from '../../hooks/useThemeColor';
import { useCommonStyles } from '../constants/Styles';

export const useCommonThemedStyles = () => {
  const colors = useThemeColors();
  const commonStyles = useCommonStyles(colors);
  
  return {
    colors,
    styles: commonStyles,
  };
};

export default useCommonThemedStyles;
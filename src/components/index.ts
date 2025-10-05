/**
 * Export des composants primitifs conformes aux meilleures pratiques UI mobiles
 * Facilite l'adoption progressive des nouveaux patterns
 */

// Layout primitives
export { Screen } from './primitives/Screen';
export { VStack, HStack } from './primitives/Stack';

// UI components
export { Card } from './ui/Card';
export { Button } from './ui/Button';
export { Input } from './ui/Input';

// Typography
export { Title, Subtitle, Body, Muted } from './typography/Typography';

// Re-export du système de design
export { 
  DESIGN_TOKENS, 
  LAYOUT_PRIMITIVES, 
  STACK_PRIMITIVES, 
  CARD_PRIMITIVES, 
  TEXT_PRIMITIVES, 
  BUTTON_PRIMITIVES, 
  INPUT_PRIMITIVES,
  useCommonThemedStyles 
} from '../constants/Styles';
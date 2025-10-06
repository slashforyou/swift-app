# 🎨 Common Styles System - Swift App

## Overview

This system provides a comprehensive set of reusable styles to maintain a consistent user interface throughout the application. It respects our design principles:

- **Orange/Blue-Grey Palette**: Primary orange with blue-grey nuances
- **Soft Shadows**: Never harsh shadows, always subtle
- **No Pure Black**: Strict rule, we use our dark blue-grey (#233551)
- **Responsive**: Automatic adaptation to different screen sizes
- **Theming**: Complete light/dark mode support

## 🚀 Quick Usage

```tsx
import { useCommonThemedStyles } from '../hooks/useCommonStyles';

const MyComponent = () => {
  const { colors, styles } = useCommonThemedStyles();
  
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>My Title</Text>
      <Text style={styles.body}>My content</Text>
    </View>
  );
};
```

## 📦 Available Styles

### Containers
- `container` - Main container with themed background
- `containerCentered` - Centered container with padding
- `containerSafeArea` - Container with safe area
- `contentContainer` - Content container with padding
- `scrollContainer` - Container for ScrollView
- `card` - Card with medium shadow
- `cardElevated` - Card with strong shadow
- `panel` - Simple panel with soft shadow

### Typography
- `h1, h2, h3, h4` - Hierarchical titles
- `body, bodyLarge, bodySmall` - Body text
- `textMuted, textSecondary` - Muted texts
- `textCenter, textBold, textSemiBold` - Text utilities

### Buttons
- `buttonPrimary` - Primary orange button
- `buttonPrimaryLarge` - Large version of primary button
- `buttonSecondary` - Secondary button (tertiary background)
- `buttonOutline` - Orange outline button
- `buttonIcon` - Circular button for icons
- `buttonIconLarge` - Large version of icon button

### Forms
- `input` - Standard input field
- `inputFocused` - Focused field (orange border)
- `inputError` - Field with error (red border)
- `label` - Field label
- `labelRequired` - Required label (orange color)

### Lists
- `listItem` - List item with shadow
- `listItemContent` - List item content
- `listItemTitle` - List item title
- `listItemSubtitle` - List item subtitle

### Status
- `statusSuccess` - Success message (green)
- `statusWarning` - Warning message (yellow)
- `statusError` - Error message (red)
- `statusInfo` - Information message (blue)

### Navigation
- `tabBar` - Tab bar with shadow
- `navigationHeader` - Navigation header

### Modals and Overlays
- `overlay` - Semi-transparent overlay
- `modal` - Modal container
- `modalHeader` - Modal header
- `modalContent` - Modal content
- `modalActions` - Modal actions area

### Utilities
- `flex1, flexRow, flexColumn` - Flexbox
- `alignCenter, justifyCenter, justifyBetween` - Alignment
- `centerContent, rowBetween, rowCenter` - Common combinations
- `marginTop, marginBottom, paddingVertical, etc.` - Spacing

## 🎯 Components with Built-in Styles

### Enhanced HomeButton
```tsx
<HomeButton 
  title="My Button" 
  onPress={() => {}}
  variant="primary" // primary | secondary | outline
  size="default" // default | large
  disabled={false}
/>
```

## 📱 Responsive Design

The system adapts automatically:
- **Screens < 350px**: Reduced font sizes
- **Normal screens**: Standard sizes
- **Smart padding**: Adapts to screen width
- **Container max-width**: Limits to 600px on large screens

## 🌈 Color System

```tsx
colors.primary          // #FF6A4A (Primary orange)
colors.text            // #233551 (Dark blue-grey, never pure black)
colors.textSecondary    // #516386 (Medium blue-grey)
colors.background       // #F6F8FC (Light background)
colors.backgroundSecondary // #EDF1F8 (Cards/panels)
colors.success          // #22C55E (Success green)
colors.warning          // #F59E0B (Warning yellow)
colors.error           // #EF4444 (Error red)
colors.info            // #3B82F6 (Info blue)
```

## 🎭 Predefined Shadows

```tsx
import { SHADOWS } from '../constants/Styles';

// Usage in your custom styles
const myStyle = {
  ...SHADOWS.soft,    // Light shadow
  ...SHADOWS.medium,  // Standard shadow
  ...SHADOWS.strong,  // Pronounced shadow
  ...SHADOWS.floating // Hover shadow
};
```

## 📏 Responsive Values

```tsx
import { RESPONSIVE } from '../constants/Styles';

const myStyle = {
  padding: RESPONSIVE.md,          // 16px
  fontSize: RESPONSIVE.fontBase,   // Adaptive according to screen
  borderRadius: RESPONSIVE.radiusMedium, // 8px
};
```

## ✨ Best Practices

1. **Always use common styles** rather than creating custom styles
2. **Combine styles** with the spread operator: `[styles.card, styles.marginTop]`
3. **Respect the hierarchy** of titles (h1 > h2 > h3 > h4)
4. **Use themed colors** rather than hardcode
5. **Test in light/dark mode** to verify consistency

## 🔧 System Extension

To add new common styles:

1. Modify `src/constants/Styles.ts`
2. Add the new style in `createCommonStyles`
3. Document here
4. Test in responsive and both themes

## 🎨 Complete Examples

See the file `src/screens/StylesExampleScreen.tsx` for concrete examples of using all available styles.

---

**Note**: This system ensures a professional, consistent and pleasant interface. Orange is used sparingly for important interactive elements, and our soft shadows create a subtle visual hierarchy.
/**
 * XpGainToast
 * Affiche une notification flottante quand l'utilisateur gagne des XP.
 *
 * Usage:
 *   const toastRef = useRef<XpGainToastHandle>(null);
 *   <XpGainToast ref={toastRef} />
 *   toastRef.current?.show({ xp: 20, label: 'Job complété' });
 */
import React, {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface XpGainPayload {
  xp: number;
  label?: string;
}

export interface XpGainToastHandle {
  show: (payload: XpGainPayload) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const XpGainToast = forwardRef<XpGainToastHandle>((_, ref) => {
  const [payload, setPayload] = useState<XpGainPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((p: XpGainPayload) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setPayload(p);

    // reset
    opacity.setValue(0);
    translateY.setValue(-20);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => setPayload(null));
    }, 2800);
  }, [opacity, translateY]);

  useImperativeHandle(ref, () => ({ show }), [show]);

  if (!payload) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Text style={styles.xpText}>+{payload.xp} XP</Text>
        {payload.label ? (
          <Text style={styles.labelText} numberOfLines={1}>
            {payload.label}
          </Text>
        ) : null}
        <Text style={styles.starEmoji}>⭐</Text>
      </View>
    </Animated.View>
  );
});

XpGainToast.displayName = 'XpGainToast';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none' as any,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.sm,
    backgroundColor: '#1a1a2e',
    borderRadius: DESIGN_TOKENS.radius.full,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    ...DESIGN_TOKENS.shadows.lg,
  },
  xpText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelText: {
    color: '#e0e0e0',
    fontSize: 13,
    fontWeight: '400',
    maxWidth: 180,
  },
  starEmoji: {
    fontSize: 16,
  },
});

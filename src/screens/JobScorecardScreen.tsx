/**
 * JobScorecardScreen.tsx — Écran scorecard d'un job
 * Route: JobScorecard, params: { jobId: number | string, jobCode?: string }
 */
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useLocalization } from '../localization/useLocalization';
import type { Checkpoint, ClientReview, Scorecard } from '../services/scorecard';
import { fetchJobScorecard, sendReviewRequest } from '../services/scorecard';

// ─── Types internes ───────────────────────────────────────────────────────────

interface RouteParams {
  jobId: number | string;
  jobCode?: string;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function JobScorecardScreen() {
  const route      = useRoute();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t }      = useLocalization();

  const { jobId, jobCode } = (route.params as RouteParams) ?? {};

  const [scorecard,    setScorecard]    = useState<Scorecard | null>(null);
  const [clientReview, setClientReview] = useState<ClientReview | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobScorecard(jobId);
      setScorecard(data.scorecard);
      setClientReview(data.client_review);
    } catch (e: any) {
      setError(e.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const handleSendReview = async () => {
    if (!jobId) return;
    setSending(true);
    try {
      await sendReviewRequest(jobId);
      Alert.alert('✅', t('gamification.scorecard.reviewRequestSent'));
    } catch (e: any) {
      Alert.alert('❌', e.message ?? t('gamification.scorecard.reviewRequestError'));
    } finally {
      setSending(false);
    }
  };

  const pct = scorecard?.percentage ?? 0;
  const pctColor = pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.backgroundSecondary }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('gamification.scorecard.title')}
          {jobCode ? ` — #${jobCode}` : ''}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={load}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : !scorecard ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>{t('gamification.scorecard.noScorecard')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Client Review Banner */}
          {clientReview && (
            <ReviewBanner review={clientReview} colors={colors} t={t} />
          )}

          {/* Score global */}
          <View style={[styles.scoreCard, { backgroundColor: colors.backgroundSecondary }]}>
            <CircleScore percentage={pct} color={pctColor} />
            <View style={styles.scoreInfo}>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                {t('gamification.scorecard.score')}
              </Text>
              <Text style={[styles.scoreValue, { color: colors.text }]}>
                {scorecard.total_score} / {scorecard.max_score}
              </Text>
            </View>
          </View>

          {/* Checkpoints par catégorie */}
          <CheckpointList checkpoints={scorecard.checkpoints} colors={colors} t={t} />

          {/* Bouton demande de review */}
          {!clientReview && (
            <Pressable
              style={[styles.reviewBtn, { backgroundColor: colors.primary }, sending && { opacity: 0.6 }]}
              onPress={handleSendReview}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.reviewBtnText}>{t('gamification.scorecard.sendReviewRequest')}</Text>
              }
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── CircleScore ─────────────────────────────────────────────────────────────

const CircleScore = ({ percentage, color }: { percentage: number; color: string }) => (
  <View style={[styles.circle, { borderColor: color }]}>
    <Text style={[styles.circleText, { color }]}>{percentage}%</Text>
  </View>
);

// ─── ReviewBanner ─────────────────────────────────────────────────────────────
const ReviewBanner = ({
  review,
  colors,
  t,
}: { review: ClientReview; colors: any; t: any }) => {
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < (review.rating_overall ?? 0) ? '★' : '☆'
  ).join('');

  return (
    <View style={[styles.reviewBanner, { backgroundColor: '#FFF7ED', borderColor: '#F59E0B' }]}>
      <Text style={styles.reviewBannerTitle}>{t('gamification.scorecard.reviewBannerTitle')}</Text>
      <Text style={styles.reviewStars}>{stars}</Text>
      {review.comment ? (
        <Text style={styles.reviewComment}>&ldquo;{review.comment}&rdquo;</Text>
      ) : null}
    </View>
  );
};

// ─── CheckpointList ───────────────────────────────────────────────────────────

const CATEGORY_ORDER = ['steps', 'photos', 'documents', 'notes'] as const;

const CheckpointList = ({
  checkpoints,
  colors,
  t,
}: { checkpoints: Checkpoint[]; colors: any; t: any }) => {
  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    items: checkpoints.filter(c => c.category === cat),
  })).filter(g => g.items.length > 0);

  const catLabel = (cat: string) => {
    const map: Record<string, string> = {
      photos:    t('gamification.scorecard.categoryPhotos'),
      documents: t('gamification.scorecard.categoryDocuments'),
      steps:     t('gamification.scorecard.categorySteps'),
      notes:     t('gamification.scorecard.categoryNotes'),
    };
    return map[cat] ?? cat;
  };

  return (
    <View>
      {grouped.map(({ cat, items }) => (
        <View key={cat} style={styles.cpSection}>
          <Text style={[styles.cpCatTitle, { color: colors.textSecondary }]}>
            {catLabel(cat)}
          </Text>
          {items.map(cp => (
            <CheckpointRow key={cp.code} checkpoint={cp} colors={colors} t={t} />
          ))}
        </View>
      ))}
    </View>
  );
};

const CheckpointRow = ({
  checkpoint: cp,
  colors,
  t,
}: { checkpoint: Checkpoint; colors: any; t: any }) => (
  <View style={[styles.cpRow, { backgroundColor: colors.surface }]}>
    <View style={[styles.cpDot, { backgroundColor: cp.passed ? '#22C55E' : '#EF4444' }]} />
    <View style={styles.cpBody}>
      <Text style={[styles.cpLabel, { color: colors.text }]}>{cp.label_fr}</Text>
      {cp.value_text ? (
        <Text style={[styles.cpValue, { color: colors.textSecondary }]}>{cp.value_text}</Text>
      ) : null}
    </View>
    <Text style={[styles.cpStatus, { color: cp.passed ? '#22C55E' : '#EF4444' }]}>
      {cp.passed
        ? t('gamification.scorecard.checkpointPassed')
        : t('gamification.scorecard.checkpointFailed')
      }
    </Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, elevation: 2 },
  backBtn:     { width: 40, alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll:      { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  scoreCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: DESIGN_TOKENS.radius.lg, padding: 20, gap: 20, elevation: 1 },
  scoreInfo:   { gap: 4 },
  scoreLabel:  { fontSize: 13 },
  scoreValue:  { fontSize: 24, fontWeight: '700' },
  circle:      { width: 72, height: 72, borderRadius: 36, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  circleText:  { fontSize: 18, fontWeight: '700' },
  retryBtn:    { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  retryBtnText:{ color: '#fff', fontWeight: '600' },
  reviewBtn:   { borderRadius: DESIGN_TOKENS.radius.md, paddingVertical: 14, alignItems: 'center' },
  reviewBtnText:{ color: '#fff', fontWeight: '600', fontSize: 15 },
  reviewBanner:{ borderRadius: DESIGN_TOKENS.radius.md, borderWidth: 1, padding: 16, gap: 6 },
  reviewBannerTitle:{ fontWeight: '700', fontSize: 15, color: '#92400E' },
  reviewStars: { fontSize: 22, letterSpacing: 2 },
  reviewComment:{ fontStyle: 'italic', color: '#78350F', fontSize: 13 },
  cpSection:   { gap: 8 },
  cpCatTitle:  { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  cpRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: DESIGN_TOKENS.radius.sm, padding: 12, gap: 10, elevation: 1 },
  cpDot:       { width: 10, height: 10, borderRadius: 5 },
  cpBody:      { flex: 1, gap: 2 },
  cpLabel:     { fontSize: 14, fontWeight: '500' },
  cpValue:     { fontSize: 12 },
  cpStatus:    { fontSize: 12, fontWeight: '600' },
});

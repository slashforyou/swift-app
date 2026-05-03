/**
 * ScorecardSummarySection.tsx
 * Carte compacte affichée dans le détail job (onglet Summary).
 * - Affiche le score % avec cercle coloré
 * - Bannière si le client a laissé un avis
 * - Bouton "Voir scorecard" → JobScorecardScreen
 */
import Ionicons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../context/ThemeProvider";
import { useLocalization } from "../../../localization/useLocalization";
import type { ClientReview, Scorecard } from "../../../services/scorecard";
import { fetchJobScorecard } from "../../../services/scorecard";
import type { JobSummaryData } from "../../../types/jobSummary";
import SectionCard from "../SectionCard";

interface Props {
  job: JobSummaryData;
}

const ScorecardSummarySection: React.FC<Props> = React.memo(function ScorecardSummarySection({ job }) {
  const { colors }  = useTheme();
  const { t }       = useLocalization();
  const navigation  = useNavigation();

  const [scorecard,    setScorecard]    = useState<Scorecard | null>(null);
  const [clientReview, setClientReview] = useState<ClientReview | null>(null);
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(async () => {
    if (!job?.id) return;
    try {
      const data = await fetchJobScorecard(job.id);
      setScorecard(data.scorecard);
      setClientReview(data.client_review);
    } catch {
      // Scorecard pas encore générée — pas d'erreur visible
    } finally {
      setLoading(false);
    }
  }, [job?.id]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = () => {
    (navigation as any).navigate('JobScorecard', {
      jobId:   job.id,
      jobCode: job.code,
    });
  };

  // Pas de scorecard et job pas complété → ne rien afficher
  const handleOpenReview = () => {
    (navigation as any).navigate('JobReview', { jobId: job.id });
  };

  if (!loading && !scorecard && job.status !== 'completed') return null;

  const pct      = scorecard?.percentage ?? 0;
  const pctColor = pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <SectionCard elevated>
      {/* Bannière avis client */}
      {clientReview && (
        <Pressable
          style={[styles.reviewBanner, { borderBottomColor: colors.border }]}
          onPress={handleOpen}
        >
          <Text style={[styles.reviewBannerTitle, { color: '#92400E' }]}>
            {t('gamification.scorecard.reviewBannerTitle')}
          </Text>
          <Text style={styles.reviewStars}>
            {'★'.repeat(clientReview.rating_overall ?? 0)}{'☆'.repeat(5 - (clientReview.rating_overall ?? 0))}
          </Text>
        </Pressable>
      )}

      {/* Corps de la carte */}
      <Pressable style={styles.row} onPress={handleOpen}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : scorecard ? (
          <>
            {/* Mini cercle score */}
            <View style={[styles.miniCircle, { borderColor: pctColor }]}>
              <Text style={[styles.miniPct, { color: pctColor }]}>{pct}%</Text>
            </View>

            <View style={styles.info}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t('gamification.scorecard.title')}
              </Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                {scorecard.total_score} / {scorecard.max_score} pts
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.textSecondary }]}>
              {t('gamification.scorecard.title')}
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              {t('gamification.scorecard.noScorecard')}
            </Text>
          </View>
        )}

        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      {/* Bouton demander un avis — visible uniquement si job complété et pas encore d'avis */}
      {job.status === 'completed' && !clientReview && !loading && (
        <Pressable
          onPress={handleOpenReview}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 10, paddingVertical: 10, borderRadius: 10,
            backgroundColor: pressed ? colors.primary + 'cc' : colors.primary + '15',
            borderWidth: 1, borderColor: colors.primary + '40',
          })}
        >
          <Ionicons name="star-outline" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
            {t('gamification.scorecard.requestReview') || 'Demander un avis client'}
          </Text>
        </Pressable>
      )}
    </SectionCard>
  );
});

export default ScorecardSummarySection;

const styles = StyleSheet.create({
  reviewBanner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, backgroundColor: '#FFF7ED' },
  reviewBannerTitle: { fontWeight: '600', fontSize: 13, flex: 1 },
  reviewStars:     { fontSize: 16, letterSpacing: 1 },
  row:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  loader:          { marginRight: 8 },
  miniCircle:      { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  miniPct:         { fontSize: 13, fontWeight: '700' },
  info:            { flex: 1, gap: 2 },
  title:           { fontSize: 14, fontWeight: '600' },
  sub:             { fontSize: 12 },
});

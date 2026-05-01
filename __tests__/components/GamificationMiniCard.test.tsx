/**
 * Tests — GamificationMiniCard
 * Teste la logique de rendu, les états (skeleton, chargé, sans badges/streak) et la navigation.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('../../src/hooks/useGamificationV2', () => ({
  useGamificationV2: jest.fn(),
}));

jest.mock('../../src/context/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      backgroundSecondary: '#F5F5F5',
      backgroundTertiary: '#EFEFEF',
      text: '#000000',
      textMuted: '#888888',
      border: '#E0E0E0',
    },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  const MockIonicons = (props: any) => {
    const React = require('react');
    return React.createElement(View, { testID: `icon-${props.name}` });
  };
  return { Ionicons: MockIonicons };
});

jest.mock('../../src/constants/Styles', () => ({
  DESIGN_TOKENS: {
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────────────────────────────────────

import { render } from '@testing-library/react-native';
import { GamificationMiniCard } from '../../src/components/GamificationMiniCard';
import { useGamificationV2 } from '../../src/hooks/useGamificationV2';

const mockUseGamificationV2 = useGamificationV2 as jest.Mock;

// Profil de base utilisé dans les tests
const baseProfile = {
  total_xp: 1200,
  total_trophies: 8,
  current_streak_days: 5,
  longest_streak_days: 10,
  jobs_completed_count: 42,
  photos_uploaded_count: 150,
  signatures_collected_count: 40,
  notes_added_count: 20,
  reviews_received_count: 12,
  last_active_date: '2024-01-01',
  updated_at: '2024-01-01',
  level: 7,
  experience: 1200,
  level_label: 'Confirmé',
  level_min_xp: 1000,
  level_max_xp: 1500,
  rank_label: 'Pro',
  rank_icon: '🏆',
};

const baseHookReturn = {
  profile: baseProfile,
  xpProgress: 40,           // (1200-1000)/(1500-1000) * 100 = 40%
  isLoadingProfile: false,
  profileError: null,
  refreshProfile: jest.fn().mockResolvedValue(undefined),
  // autres champs du hook non utilisés par le composant
  leaderboard: [],
  isLoadingLeaderboard: false,
  history: [],
  isLoadingHistory: false,
  quests: [],
  isLoadingQuests: false,
  leaderboardError: null,
  historyError: null,
  questsError: null,
  refreshLeaderboard: jest.fn(),
  refreshHistory: jest.fn(),
  refreshQuests: jest.fn(),
  claimQuest: jest.fn(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('GamificationMiniCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le skeleton quand isLoadingProfile=true', () => {
    mockUseGamificationV2.mockReturnValue({
      ...baseHookReturn,
      isLoadingProfile: true,
      profile: null,
    });

    const { getByTestId, queryByTestId } = render(<GamificationMiniCard />);

    expect(getByTestId('gamification-mini-card-skeleton')).toBeTruthy();
    expect(queryByTestId('gamification-mini-card')).toBeNull();
  });

  it('affiche le skeleton quand profile=null', () => {
    mockUseGamificationV2.mockReturnValue({
      ...baseHookReturn,
      isLoadingProfile: false,
      profile: null,
    });

    const { getByTestId } = render(<GamificationMiniCard />);
    expect(getByTestId('gamification-mini-card-skeleton')).toBeTruthy();
  });

  it('affiche la card chargée avec level label', () => {
    mockUseGamificationV2.mockReturnValue(baseHookReturn);

    const { getByTestId } = render(<GamificationMiniCard />);

    expect(getByTestId('gamification-mini-card')).toBeTruthy();
    expect(getByTestId('gamification-level-label')).toBeTruthy();
  });

  it('affiche la progress bar XP', () => {
    mockUseGamificationV2.mockReturnValue(baseHookReturn);

    const { getByTestId } = render(<GamificationMiniCard />);
    expect(getByTestId('gamification-xp-bar')).toBeTruthy();
  });

  it('affiche la stat streak quand > 0', () => {
    mockUseGamificationV2.mockReturnValue(baseHookReturn);

    const { getByTestId } = render(<GamificationMiniCard />);
    // streak label visible
    expect(getByTestId('gamification-stat-streak')).toBeTruthy();
  });

  it("n'affiche pas la stat streak quand = 0", () => {
    mockUseGamificationV2.mockReturnValue({
      ...baseHookReturn,
      profile: { ...baseProfile, current_streak_days: 0 },
    });

    const { queryByTestId } = render(<GamificationMiniCard />);
    expect(queryByTestId('gamification-stat-streak')).toBeNull();
  });

  it("n'affiche pas les trophées quand = 0", () => {
    mockUseGamificationV2.mockReturnValue({
      ...baseHookReturn,
      profile: { ...baseProfile, total_trophies: 0 },
    });

    const { queryByTestId } = render(<GamificationMiniCard />);
    expect(queryByTestId('gamification-stat-trophées')).toBeNull();
  });

  it('utilise le label niveau 1 si level_label absent', () => {
    mockUseGamificationV2.mockReturnValue({
      ...baseHookReturn,
      profile: { ...baseProfile, level_label: undefined, level: 3 },
    });

    const { getByTestId } = render(<GamificationMiniCard />);
    expect(getByTestId('gamification-level-label').props.children).toBe('Niveau 3');
  });

  it('appelle refreshProfile au montage', () => {
    const refreshProfile = jest.fn().mockResolvedValue(undefined);
    mockUseGamificationV2.mockReturnValue({ ...baseHookReturn, refreshProfile });

    render(<GamificationMiniCard />);
    expect(refreshProfile).toHaveBeenCalledTimes(1);
  });

  it('appelle onPress custom si fourni', () => {
    mockUseGamificationV2.mockReturnValue(baseHookReturn);
    const onPress = jest.fn();

    const { getByTestId } = render(<GamificationMiniCard onPress={onPress} />);
    getByTestId('gamification-mini-card').props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("navigue vers GamificationV2 sans onPress custom", () => {
    const navigate = jest.fn();
    const { useNavigation } = require('@react-navigation/native');
    (useNavigation as jest.Mock).mockReturnValue({ navigate });

    mockUseGamificationV2.mockReturnValue(baseHookReturn);

    const { getByTestId } = render(<GamificationMiniCard />);
    getByTestId('gamification-mini-card').props.onPress();
    expect(navigate).toHaveBeenCalledWith('GamificationV2');
  });
});

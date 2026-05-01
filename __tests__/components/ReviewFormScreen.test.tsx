/**
 * Tests — ReviewFormScreen
 * Couvre la logique de soumission, la validation et les états d'écran.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
  useRoute: jest.fn(() => ({ params: { token: 'valid-test-token-abc123' } })),
  createNavigationContainerRef: jest.fn(() => ({ current: null, isReady: jest.fn(() => false) })),
}));

jest.mock('../../src/context/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      backgroundSecondary: '#F5F5F5',
      text: '#000000',
      textMuted: '#888888',
      border: '#E0E0E0',
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
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

jest.mock('../../src/services/scorecard', () => ({
  submitClientReview: jest.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────────────────────────────────────

import { useRoute } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ReviewFormScreen from '../../src/screens/ReviewFormScreen';
import { submitClientReview } from '../../src/services/scorecard';

const mockSubmit = submitClientReview as jest.Mock;
const mockUseRoute = useRoute as jest.Mock;

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('ReviewFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoute.mockReturnValue({ params: { token: 'valid-test-token-abc123' } });
  });

  it('affiche le formulaire quand le token est présent', () => {
    const { getByTestId } = render(<ReviewFormScreen />);
    expect(getByTestId('review-form-scroll')).toBeTruthy();
    expect(getByTestId('review-rating-overall')).toBeTruthy();
    expect(getByTestId('review-submit-button')).toBeTruthy();
  });

  it("affiche l'écran d'erreur quand aucun token n'est fourni", () => {
    mockUseRoute.mockReturnValue({ params: {} });

    const { getByTestId, queryByTestId } = render(<ReviewFormScreen />);

    expect(getByTestId('review-form-error')).toBeTruthy();
    expect(queryByTestId('review-form-scroll')).toBeNull();
    // Sans token valide, le bouton "Réessayer" ne doit PAS être affiché
    expect(queryByTestId('review-form-retry-button')).toBeNull();
  });

  it('affiche les 3 groupes de notation', () => {
    const { getByTestId } = render(<ReviewFormScreen />);

    expect(getByTestId('review-rating-overall')).toBeTruthy();
    expect(getByTestId('review-rating-service')).toBeTruthy();
    expect(getByTestId('review-rating-team')).toBeTruthy();
  });

  it('le bouton submit est actif après sélection de la note globale', () => {
    const { getByTestId } = render(<ReviewFormScreen />);

    // Cliquer étoile 4 pour la note globale
    fireEvent.press(getByTestId('review-rating-overall-star-4'));

    const submitBtn = getByTestId('review-submit-button');
    expect(submitBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('le bouton submit est désactivé sans note globale', () => {
    const { getByTestId } = render(<ReviewFormScreen />);

    const submitBtn = getByTestId('review-submit-button');
    expect(submitBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it('soumet le formulaire et affiche le succès', async () => {
    mockSubmit.mockResolvedValue({ success: true });

    const { getByTestId, queryByTestId } = render(<ReviewFormScreen />);

    // Sélectionner note 5
    fireEvent.press(getByTestId('review-rating-overall-star-5'));
    // Écrire un commentaire
    fireEvent.changeText(getByTestId('review-comment-input'), 'Super déménagement !');
    // Soumettre
    fireEvent.press(getByTestId('review-submit-button'));

    // Loading state
    await waitFor(() => expect(queryByTestId('review-form-loading')).toBeTruthy());

    // Success state
    await waitFor(() => expect(getByTestId('review-form-success')).toBeTruthy());
    expect(mockSubmit).toHaveBeenCalledWith('valid-test-token-abc123', {
      rating_overall: 5,
      comment: 'Super déménagement !',
    });
  });

  it("soumet uniquement les notes optionnelles si elles ont été renseignées", async () => {
    mockSubmit.mockResolvedValue({ success: true });

    const { getByTestId } = render(<ReviewFormScreen />);

    fireEvent.press(getByTestId('review-rating-overall-star-4'));
    fireEvent.press(getByTestId('review-rating-service-star-3'));
    fireEvent.press(getByTestId('review-rating-team-star-5'));
    fireEvent.press(getByTestId('review-submit-button'));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledWith('valid-test-token-abc123', {
      rating_overall: 4,
      rating_service: 3,
      rating_team: 5,
    }));
  });

  it("affiche un message d'erreur si l'API échoue", async () => {
    mockSubmit.mockRejectedValue(new Error('Serveur indisponible'));

    const { getByTestId } = render(<ReviewFormScreen />);

    fireEvent.press(getByTestId('review-rating-overall-star-3'));
    fireEvent.press(getByTestId('review-submit-button'));

    await waitFor(() => {
      expect(getByTestId('review-form-error')).toBeTruthy();
    });
    // Bouton réessayer présent car token valide
    expect(getByTestId('review-form-retry-button')).toBeTruthy();
  });

  it('permet de réessayer après erreur', async () => {
    mockSubmit
      .mockRejectedValueOnce(new Error('Erreur réseau'))
      .mockResolvedValueOnce({ success: true });

    const { getByTestId } = render(<ReviewFormScreen />);

    fireEvent.press(getByTestId('review-rating-overall-star-4'));
    fireEvent.press(getByTestId('review-submit-button'));

    await waitFor(() => getByTestId('review-form-error'));

    // Réessayer
    fireEvent.press(getByTestId('review-form-retry-button'));
    expect(getByTestId('review-form-scroll')).toBeTruthy();
  });

  it('tronque le commentaire à 1000 caractères', () => {
    const { getByTestId } = render(<ReviewFormScreen />);

    const longText = 'A'.repeat(1500);
    fireEvent.changeText(getByTestId('review-comment-input'), longText);

    const input = getByTestId('review-comment-input');
    expect(input.props.value.length).toBe(1000);
  });

  it('affiche le bouton retour quand canGoBack=true', () => {
    mockCanGoBack.mockReturnValue(true);
    const { getByTestId } = render(<ReviewFormScreen />);
    expect(getByTestId('review-form-back-button')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests unitaires submitClientReview (service)
// ─────────────────────────────────────────────────────────────────────────────

describe('submitClientReview (service)', () => {
  const realSubmit = jest.requireActual('../../src/services/scorecard').submitClientReview;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lève une erreur si le token est trop court', async () => {
    await expect(realSubmit('abc', { rating_overall: 5 })).rejects.toThrow('Token invalide');
  });

  it('lève une erreur si rating_overall < 1', async () => {
    await expect(realSubmit('valid-token-long', { rating_overall: 0 })).rejects.toThrow(
      'La note globale doit être entre 1 et 5',
    );
  });

  it('lève une erreur si rating_overall > 5', async () => {
    await expect(realSubmit('valid-token-long', { rating_overall: 6 })).rejects.toThrow(
      'La note globale doit être entre 1 et 5',
    );
  });

  it('lève une erreur si rating_service hors bornes', async () => {
    await expect(
      realSubmit('valid-token-long', { rating_overall: 4, rating_service: 6 }),
    ).rejects.toThrow('La note service doit être entre 1 et 5');
  });

  it('lève une erreur si rating_team hors bornes', async () => {
    await expect(
      realSubmit('valid-token-long', { rating_overall: 4, rating_team: 0 }),
    ).rejects.toThrow('La note équipe doit être entre 1 et 5');
  });

  it('lève une erreur si commentaire > 1000 chars', async () => {
    await expect(
      realSubmit('valid-token-long', { rating_overall: 4, comment: 'A'.repeat(1001) }),
    ).rejects.toThrow('Le commentaire ne peut pas dépasser 1000 caractères');
  });

  it('appelle fetch avec le bon endpoint et les bonnes données', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await realSubmit('my-valid-token-xyz', { rating_overall: 4, comment: 'Très bien' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('review/my-valid-token-xyz/submit'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it("retourne l'erreur API si le serveur renvoie non-ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Token expiré' }),
    });

    await expect(
      realSubmit('my-valid-token-xyz', { rating_overall: 4 }),
    ).rejects.toThrow('Token expiré');
  });
});

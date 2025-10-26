/**
 * Tests unitaires pour useJobPhotos Hook
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useJobPhotos } from '../../src/hooks/useJobPhotos';

// Mock des services
jest.mock('../../src/services/jobPhotos', () => ({
  fetchJobPhotos: jest.fn(),
  uploadJobPhoto: jest.fn(),
  uploadJobPhotos: jest.fn(),
  updatePhotoDescription: jest.fn(),
  deletePhoto: jest.fn(),
  getPhotoServeUrl: jest.fn(),
}));

jest.mock('../../src/utils/auth', () => ({
  isLoggedIn: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../src/hooks/useUserProfile', () => ({
  useUserProfile: jest.fn(() => ({
    profile: { id: 'test-user-123' },
  })),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('useJobPhotos Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec un état de chargement', async () => {
      const { result } = renderHook(() => useJobPhotos('123'));
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.photos).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.totalPhotos).toBe(0);
    });

    it('devrait gérer un jobId vide', async () => {
      const { result } = renderHook(() => useJobPhotos(''));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.photos).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Stockage local', () => {
    it('devrait charger les photos depuis AsyncStorage si l\'API échoue', async () => {
      const mockPhotos = [
        {
          id: 'local-123',
          job_id: '123',
          user_id: 'test-user-123',
          filename: 'test.jpg',
          original_name: 'test.jpg',
          description: 'Test photo',
          file_size: 1024,
          mime_type: 'image/jpeg',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockPhotos));

      const { fetchJobPhotos } = require('../../src/services/jobPhotos');
      fetchJobPhotos.mockRejectedValue(new Error('API unavailable'));

      const { result } = renderHook(() => useJobPhotos('123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.photos).toEqual(mockPhotos);
      expect(result.current.totalPhotos).toBe(1);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Fonctions', () => {
    it('devrait exposer toutes les fonctions nécessaires', () => {
      const { result } = renderHook(() => useJobPhotos('123'));

      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.uploadPhoto).toBe('function');
      expect(typeof result.current.uploadMultiplePhotos).toBe('function');
      expect(typeof result.current.updatePhotoDescription).toBe('function');
      expect(typeof result.current.deletePhoto).toBe('function');
      expect(typeof result.current.getPhotoUrl).toBe('function');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer une erreur d\'authentification', async () => {
      const { isLoggedIn } = require('../../src/utils/auth');
      isLoggedIn.mockResolvedValue(false);

      const { result } = renderHook(() => useJobPhotos('123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Vous devez être connecté pour voir les photos.');
      expect(result.current.photos).toEqual([]);
    });
  });

  describe('Upload de photos', () => {
    it('devrait gérer l\'upload local si l\'API n\'est pas disponible', async () => {
      const { uploadJobPhoto } = require('../../src/services/jobPhotos');
      uploadJobPhoto.mockRejectedValue(new Error('404 Not Found'));

      const { result } = renderHook(() => useJobPhotos('123'));

      // Attendre l'initialisation
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Tester l'upload
      const photoUri = 'file://test.jpg';
      const description = 'Test description';

      let uploadedPhoto: any = null;
      await act(async () => {
        uploadedPhoto = await result.current.uploadPhoto(photoUri, description);
      });

      expect(uploadedPhoto).toBeTruthy();
      expect(uploadedPhoto?.id).toContain('local-');
      expect(uploadedPhoto?.description).toBe(description);
      
      // Attendre que le state soit mis à jour
      await waitFor(() => {
        expect(result.current.photos).toHaveLength(1);
      });
    });
  });
});
/**
 * Tests CRUD - Photos & Media
 * Basé sur SWIFT_APP_TEST_SUITE.json
 */

// Mock des dépendances
jest.mock('../../src/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({
    Authorization: 'Bearer test-token',
  }),
}));

jest.mock('../../src/constants/ServerData', () => ({
  ServerData: {
    serverUrl: 'https://api.test.com/',
  },
}));

// Import après les mocks
import {
  uploadJobPhoto,
  uploadJobPhotos,
  fetchJobPhotos,
  deletePhoto,
  type JobPhotoAPI,
} from '../../src/services/jobPhotos';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CRUD - Photos & Media', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  // ===================================
  // photo_upload_success
  // ===================================
  describe('photo_upload_success', () => {
    it('should upload a photo successfully', async () => {
      const mockResponse: JobPhotoAPI = {
        id: '123',
        job_id: 'job-001',
        filename: 'photo_12345.jpg',
        original_name: 'test.jpg',
        description: 'Test photo',
        file_size: 1024,
        mime_type: 'image/jpeg',
        created_at: '2026-01-13T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse }),
      });

      const result = await uploadJobPhoto(
        'job-001',
        'file:///test/photo.jpg',
        'Test description'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/v1/job/job-001/image',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      );
      expect(result.id).toBe('123');
    });

    it('should handle upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(
        uploadJobPhoto('job-001', 'file:///test/photo.jpg')
      ).rejects.toThrow('Server error');
    });
  });

  // ===================================
  // photo_multiple_upload
  // ===================================
  describe('photo_multiple_upload', () => {
    it('should upload multiple photos successfully', async () => {
      const mockPhotos: JobPhotoAPI[] = [
        { id: '1', filename: 'photo1.jpg', created_at: '2026-01-13T10:00:00Z' },
        { id: '2', filename: 'photo2.jpg', created_at: '2026-01-13T10:01:00Z' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ photos: mockPhotos }),
      });

      const result = await uploadJobPhotos('job-001', [
        'file:///test/photo1.jpg',
        'file:///test/photo2.jpg',
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should reject more than 10 photos', async () => {
      const tooManyPhotos = Array(11)
        .fill(null)
        .map((_, i) => `file:///test/photo${i}.jpg`);

      await expect(uploadJobPhotos('job-001', tooManyPhotos)).rejects.toThrow(
        'Maximum 10 photos allowed per upload'
      );
    });
  });

  // ===================================
  // photo_read_list (fetchJobPhotos)
  // ===================================
  describe('photo_read_list', () => {
    it('should fetch photos for a job with pagination', async () => {
      const mockPhotos: JobPhotoAPI[] = [
        { id: '1', filename: 'photo1.jpg', created_at: '2026-01-13T10:00:00Z' },
        { id: '2', filename: 'photo2.jpg', created_at: '2026-01-13T10:01:00Z' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            images: mockPhotos,
            pagination: { total: 2, hasMore: false, count: 2 },
          },
        }),
      });

      const result = await fetchJobPhotos('job-001', { limit: 10, offset: 0 });

      expect(result.photos).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('job-001/images'),
        expect.any(Object)
      );
    });

    it('should handle empty photo list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            images: [],
            pagination: { total: 0, hasMore: false, count: 0 },
          },
        }),
      });

      const result = await fetchJobPhotos('job-001');

      expect(result.photos).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ===================================
  // photo_delete
  // ===================================
  describe('photo_delete', () => {
    it('should delete a photo successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await expect(deletePhoto('photo-123')).resolves.not.toThrow();

      // The service uses /v1/image/{photoId} endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('image/photo-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should handle delete failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Photo not found' }),
      });

      await expect(deletePhoto('invalid-id')).rejects.toThrow('Photo not found');
    });
  });

  // ===================================
  // photo_compression (validation)
  // ===================================
  describe('photo_compression', () => {
    it('should send correct content type for image upload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: '1', filename: 'photo.jpg' },
        }),
      });

      await uploadJobPhoto('job-001', 'file:///test/photo.jpg');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      );
    });
  });

  // ===================================
  // photo_metadata
  // ===================================
  describe('photo_metadata', () => {
    it('should include description in photo upload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: '1',
            filename: 'photo.jpg',
            description: 'Before moving',
          },
        }),
      });

      const result = await uploadJobPhoto(
        'job-001',
        'file:///test/photo.jpg',
        'Before moving'
      );

      expect(result.description).toBe('Before moving');
    });
  });
});

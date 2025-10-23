/**
 * Tests pour le service jobNotes
 */
import { addJobNote, CreateJobNoteRequest, deleteJobNote, fetchJobNotes, updateJobNote, UpdateJobNoteRequest } from '../../src/services/jobNotes';

// Mock des dépendances
jest.mock('../../src/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({
    'Authorization': 'Bearer test-token',
    'x-user-id': 'test-user-123'
  })
}));

jest.mock('../../src/constants/ServerData', () => ({
  ServerData: {
    serverUrl: 'https://test-api.com/swift-app/'
  }
}));

// Mock de fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('JobNotes Service', () => {
  const mockJobId = 'test-job-123';
  const mockNoteId = 'test-note-456';
  
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('fetchJobNotes', () => {
    it('devrait récupérer les notes d\'un job', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          job_id: mockJobId,
          title: 'Test Note 1',
          content: 'Content 1',
          note_type: 'general' as const,
          created_by: 'user-123',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notes: mockNotes })
      });

      const result = await fetchJobNotes(mockJobId);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/swift-app/v1/job/test-job-123/notes',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );
      expect(result).toEqual(mockNotes);
    });

    it('devrait inclure les paramètres de pagination', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ notes: [] })
      });

      await fetchJobNotes(mockJobId, 10, 0);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/swift-app/v1/job/test-job-123/notes?limit=10&offset=0',
        expect.any(Object)
      );
    });
  });

  describe('addJobNote', () => {
    it('devrait créer une nouvelle note', async () => {
      const noteData: CreateJobNoteRequest = {
        title: 'Test Note',
        content: 'Test content',
        note_type: 'important',
        created_by: 'user-123'
      };

      const expectedNote = {
        id: 'new-note-123',
        job_id: mockJobId,
        ...noteData,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ note: expectedNote })
      });

      const result = await addJobNote(mockJobId, noteData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/swift-app/v1/job/test-job-123/notes',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            title: noteData.title,
            content: noteData.content,
            note_type: noteData.note_type,
            created_by: noteData.created_by
          })
        })
      );
      expect(result).toEqual(expectedNote);
    });
  });

  describe('updateJobNote', () => {
    it('devrait mettre à jour une note', async () => {
      const updateData: UpdateJobNoteRequest = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      const updatedNote = {
        id: mockNoteId,
        job_id: mockJobId,
        title: 'Updated Title',
        content: 'Updated content',
        note_type: 'general' as const,
        created_by: 'user-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T01:00:00Z'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ note: updatedNote })
      });

      const result = await updateJobNote(mockNoteId, updateData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/swift-app/v1/notes/test-note-456',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(updateData)
        })
      );
      expect(result).toEqual(updatedNote);
    });
  });

  describe('deleteJobNote', () => {
    it('devrait supprimer une note', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      await deleteJobNote(mockJobId, mockNoteId);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/swift-app/v1/job/test-job-123/notes/test-note-456',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs HTTP', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Job not found' })
      });

      await expect(fetchJobNotes(mockJobId)).rejects.toThrow('Job not found');
    });

    it('devrait gérer les erreurs de parsing JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(fetchJobNotes(mockJobId)).rejects.toThrow('Failed to fetch job notes');
    });
  });
});
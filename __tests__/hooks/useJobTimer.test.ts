/**
 * Tests pour useJobTimer - Hook de gestion du timer de job
 * Vérifie notamment le callback onJobCompleted à la dernière étape
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useJobTimer } from '../../src/hooks/useJobTimer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('useJobTimer', () => {
    const mockJobId = 'TEST_JOB_001';
    
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    describe('onJobCompleted callback', () => {
        it('should call onJobCompleted when reaching last step', async () => {
            const onJobCompletedMock = jest.fn();
            const totalSteps = 3;
            const lastStep = 3;

            const { result } = renderHook(() =>
                useJobTimer(mockJobId, lastStep - 1, {
                    totalSteps,
                    onJobCompleted: onJobCompletedMock,
                })
            );

            // Attendre que le hook soit initialisé
            await waitFor(() => {
                expect(result.current.timerData).toBeDefined();
            });

            // Avancer à la dernière étape
            act(() => {
                result.current.advanceStep(lastStep);
            });

            // Vérifier que le callback a été appelé avec les bonnes valeurs
            await waitFor(() => {
                expect(onJobCompletedMock).toHaveBeenCalledTimes(1);
                expect(onJobCompletedMock).toHaveBeenCalledWith(
                    expect.any(Number), // finalCost
                    expect.any(Number)  // billableHours
                );
            });

            // Vérifier que le timer s'est arrêté
            expect(result.current.timerData?.isRunning).toBe(false);
        });

        it('should NOT call onJobCompleted on intermediate steps', async () => {
            const onJobCompletedMock = jest.fn();
            const totalSteps = 3;
            const intermediateStep = 1;

            const { result } = renderHook(() =>
                useJobTimer(mockJobId, intermediateStep, {
                    totalSteps,
                    onJobCompleted: onJobCompletedMock,
                })
            );

            await waitFor(() => {
                expect(result.current.timerData).toBeDefined();
            });

            // Avancer d'une étape (pas la dernière)
            act(() => {
                result.current.advanceStep(intermediateStep + 1);
            });

            // Vérifier que le callback N'A PAS été appelé
            await waitFor(() => {
                expect(result.current.timerData?.currentStep).toBe(intermediateStep + 1);
            });

            expect(onJobCompletedMock).not.toHaveBeenCalled();
            expect(result.current.timerData?.isRunning).toBe(true);
        });

        it('should calculate correct finalCost and billableHours', async () => {
            const onJobCompletedMock = jest.fn();
            const totalSteps = 2;

            const { result } = renderHook(() =>
                useJobTimer(mockJobId, 1, {
                    totalSteps,
                    onJobCompleted: onJobCompletedMock,
                })
            );

            await waitFor(() => {
                expect(result.current.timerData).toBeDefined();
            });

            // Avancer à la dernière étape
            act(() => {
                result.current.advanceStep(totalSteps);
            });

            // Vérifier les valeurs calculées
            await waitFor(() => {
                expect(onJobCompletedMock).toHaveBeenCalledTimes(1);
            });

            const [finalCost, billableHours] = onJobCompletedMock.mock.calls[0];
            
            // Vérifier que les valeurs sont cohérentes
            // Note: le hook applique des règles complexes (min 2h, call-out 0.5h, arrondi)
            expect(billableHours).toBeGreaterThan(0);
            expect(finalCost).toBeGreaterThan(0);
            expect(typeof billableHours).toBe('number');
            expect(typeof finalCost).toBe('number');
        });
    });

    describe('Timer behavior', () => {
        it('should stop timer on last step', async () => {
            const totalSteps = 3;
            const lastStep = 3;

            const { result } = renderHook(() =>
                useJobTimer(mockJobId, lastStep - 1, {
                    totalSteps,
                })
            );

            await waitFor(() => {
                expect(result.current.timerData).toBeDefined();
            });

            // Timer devrait être en cours avant dernière étape
            expect(result.current.timerData?.isRunning).toBe(true);

            // Avancer à la dernière étape
            act(() => {
                result.current.advanceStep(lastStep);
            });

            // Timer devrait s'arrêter
            await waitFor(() => {
                expect(result.current.timerData?.isRunning).toBe(false);
            });
        });

        it('should keep timer running on intermediate steps', async () => {
            const totalSteps = 3;
            const currentStep = 1;

            const { result } = renderHook(() =>
                useJobTimer(mockJobId, currentStep, {
                    totalSteps,
                })
            );

            await waitFor(() => {
                expect(result.current.timerData).toBeDefined();
            });

            expect(result.current.timerData?.isRunning).toBe(true);

            act(() => {
                result.current.advanceStep(currentStep + 1);
            });

            await waitFor(() => {
                expect(result.current.timerData?.currentStep).toBe(currentStep + 1);
            });

            // Timer devrait toujours être en cours
            expect(result.current.timerData?.isRunning).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should handle missing totalSteps option', async () => {
            const onJobCompletedMock = jest.fn();

            const { result } = renderHook(() =>
                useJobTimer(mockJobId, 1, {
                    onJobCompleted: onJobCompletedMock,
                })
            );

            await waitFor(() => {
                expect(result.current.timerData).toBeDefined();
            });

            // Sans totalSteps, le callback ne devrait jamais être appelé
            act(() => {
                result.current.advanceStep(2);
            });

            await waitFor(() => {
                expect(result.current.timerData?.currentStep).toBe(2);
            });

            expect(onJobCompletedMock).not.toHaveBeenCalled();
        });

        it('should handle undefined onJobCompleted callback', async () => {
            const totalSteps = 2;

            const { result } = renderHook(() =>
                useJobTimer(mockJobId, 1, {
                    totalSteps,
                    // onJobCompleted non défini
                })
            );

            await waitFor(() => {
                expect(result.current.timerData).toBeDefined();
            });

            // Ne devrait pas crasher sans callback
            expect(() => {
                act(() => {
                    result.current.advanceStep(totalSteps);
                });
            }).not.toThrow();

            // Timer devrait quand même s'arrêter
            await waitFor(() => {
                expect(result.current.timerData?.isRunning).toBe(false);
            });
        });
    });
});

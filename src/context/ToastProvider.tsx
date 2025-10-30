/**
 * ToastContext - Context et hook pour gérer les notifications toast globalement
 */
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import Toast, { ToastType } from '../components/ui/Toast';

interface ToastData {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    showSuccess: (title: string, message?: string, duration?: number) => void;
    showError: (title: string, message?: string, duration?: number) => void;
    showWarning: (title: string, message?: string, duration?: number) => void;
    showInfo: (title: string, message?: string, duration?: number) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const generateId = () => {
        return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []); // ✅ Pas de dépendances, stable

    const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
        const id = generateId();
        const newToast: ToastData = {
            id,
            type,
            title,
            message,
            duration: duration || 3000,
        };

        setToasts(prev => [...prev, newToast]);
        
        // Auto-remove après la durée + animation
        setTimeout(() => {
            hideToast(id);
        }, (duration || 3000) + 300);
    }, [hideToast]); // ✅ Dépend de hideToast (stable)

    const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
        showToast('success', title, message, duration);
    }, [showToast]); // ✅ Dépend de showToast (stable)

    const showError = useCallback((title: string, message?: string, duration?: number) => {
        showToast('error', title, message, duration);
    }, [showToast]);

    const showWarning = useCallback((title: string, message?: string, duration?: number) => {
        showToast('warning', title, message, duration);
    }, [showToast]);

    const showInfo = useCallback((title: string, message?: string, duration?: number) => {
        showToast('info', title, message, duration);
    }, [showToast]);

    const contextValue: ToastContextType = useMemo(() => ({
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
    }), [showToast, showSuccess, showError, showWarning, showInfo, hideToast]); // ✅ Mémorisé, stable

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            
            {/* Render all active toasts */}
            {toasts.map((toast, index) => (
                <Toast
                    key={toast.id}
                    visible={true}
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    duration={toast.duration}
                    onHide={() => hideToast(toast.id)}
                />
            ))}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
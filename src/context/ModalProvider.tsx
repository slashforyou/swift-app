/**
 * ModalPortal - Context pour rendre les modaux au niveau root
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dimensions } from 'react-native';

interface ModalContextType {
    showModal: (content: ReactNode) => void;
    hideModal: () => void;
    isModalVisible: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
    const [modalContent, setModalContent] = useState<ReactNode | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = (content: ReactNode) => {
        setModalContent(content);
        setIsModalVisible(true);
    };

    const hideModal = () => {
        setIsModalVisible(false);
        setModalContent(null);
    };

    return (
        <ModalContext.Provider value={{ showModal, hideModal, isModalVisible }}>
            {children}
            {/* Portal au niveau root pour les modaux */}
            {isModalVisible && modalContent && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 9999,
                }}>
                    {modalContent}
                </div>
            )}
        </ModalContext.Provider>
    );
};
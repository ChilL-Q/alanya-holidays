import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = 'login' | 'register' | null;

interface ModalContextType {
    activeModal: ModalType;
    openLogin: () => void;
    openRegister: () => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const openLogin = () => setActiveModal('login');
    const openRegister = () => setActiveModal('register');
    const closeModal = () => setActiveModal(null);

    return (
        <ModalContext.Provider value={{ activeModal, openLogin, openRegister, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';

interface LoginRedirectProps {
  mode: 'login' | 'register';
}

export const LoginRedirect: React.FC<LoginRedirectProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { openLogin, openRegister } = useModal();

  useEffect(() => {
    // Redirect to home so the modal overlays the main page
    navigate('/', { replace: true });
    
    // Open the appropriate modal
    if (mode === 'login') {
      openLogin();
    } else {
      openRegister();
    }
  }, [mode, navigate, openLogin, openRegister]);

  // Return nothing since we redirect immediately
  return null;
};

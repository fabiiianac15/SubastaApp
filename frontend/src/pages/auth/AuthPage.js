import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthForm from '../../components/auth/AuthForm';

const AuthPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <AuthForm />
    </div>
  );
};

export default AuthPage;
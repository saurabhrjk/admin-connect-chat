
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function AuthScreen() {
  const [authState, setAuthState] = useState<'login' | 'register' | 'forgotPassword'>('login');
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-white to-chat-light">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-lg border animate-fade-in">
          {authState === 'login' && (
            <LoginForm 
              onSwitchToRegister={() => setAuthState('register')} 
              onForgotPassword={() => setAuthState('forgotPassword')}
            />
          )}
          {authState === 'register' && (
            <RegisterForm onSwitchToLogin={() => setAuthState('login')} />
          )}
          {authState === 'forgotPassword' && (
            <ForgotPasswordForm onSwitchToLogin={() => setAuthState('login')} />
          )}
        </div>
      </div>
    </div>
  );
}

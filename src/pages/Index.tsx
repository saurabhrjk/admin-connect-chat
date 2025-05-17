
import React from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ChatProvider } from '@/hooks/useChat';
import AuthScreen from '@/components/auth/AuthScreen';
import ChatScreen from '@/components/chat/ChatScreen';

const ConnectWithMe = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-chat-primary">
          <div className="h-8 w-8 rounded-full bg-chat-primary animate-pulse-dot"></div>
          <p className="mt-2 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <ChatScreen /> : <AuthScreen />;
};

const Index = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <ConnectWithMe />
      </ChatProvider>
    </AuthProvider>
  );
};

export default Index;

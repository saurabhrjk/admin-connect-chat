
import React from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function ChatHeader() {
  const { selectedContact } = useChat();
  const { user, logout } = useAuth();
  
  return (
    <header className="border-b dark:border-gray-800 bg-white dark:bg-gray-950 p-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {selectedContact ? (
          <>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-chat-light dark:bg-gray-800 flex items-center justify-center">
                {selectedContact.avatar ? (
                  <img 
                    src={selectedContact.avatar} 
                    alt={selectedContact.name} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold">
                    {selectedContact.name.charAt(0)}
                  </span>
                )}
              </div>
              {selectedContact.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-chat-online rounded-full border-2 border-white dark:border-gray-900"></span>
              )}
            </div>
            <div>
              <h2 className="font-medium text-gray-900 dark:text-gray-100">{selectedContact.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedContact.isTyping 
                  ? <span className="text-chat-primary">Typing...</span> 
                  : (selectedContact.isOnline ? 'Online' : 'Offline')}
              </p>
            </div>
          </>
        ) : (
          <h2 className="font-medium">{user?.isAdmin ? 'Admin Dashboard' : 'Chat'}</h2>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

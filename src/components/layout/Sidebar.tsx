
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import ContactsList from '../chat/ContactsList';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg dark:text-gray-100">Connect</h2>
            <p className="text-sm text-muted-foreground">
              {user?.isAdmin ? 'Admin Account' : 'User Account'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {user && (
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chat-light dark:bg-gray-800 flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full object-cover" 
                />
              ) : (
                <span className="text-lg font-semibold">{user.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="font-medium dark:text-gray-100">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="text-sm font-medium text-muted-foreground px-3 py-2">Contacts</h3>
          <ContactsList />
        </div>
      </div>
    </div>
  );
}

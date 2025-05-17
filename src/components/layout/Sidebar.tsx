
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut, Settings } from 'lucide-react';
import ContactsList from '../chat/ContactsList';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const { user, logout } = useAuth();
  
  return (
    <div className="w-[280px] border-r bg-background flex flex-col h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-chat-primary">ConnectWithMe</h1>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-3 mb-2">
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-chat-primary text-white">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">{user?.name || 'User'}</h2>
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-chat-online animate-pulse-dot" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex-1 overflow-auto p-3">
        <ContactsList />
      </div>
      
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

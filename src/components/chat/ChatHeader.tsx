
import React from 'react';
import { useChat } from '@/hooks/useChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ChatHeader() {
  const { selectedContact } = useChat();
  const isMobile = useIsMobile();

  if (!selectedContact) {
    return (
      <div className="border-b p-4 flex items-center justify-between h-16">
        <h1 className="text-lg font-medium">Select a conversation</h1>
      </div>
    );
  }

  return (
    <div className="border-b p-2 md:p-4 flex items-center justify-between h-16">
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={selectedContact.avatar} />
          <AvatarFallback className="bg-chat-primary text-white">
            {selectedContact.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-medium">{selectedContact.name}</h2>
          <div className="flex items-center space-x-1">
            {selectedContact.isTyping ? (
              <span className="text-xs text-chat-primary">Typing...</span>
            ) : (
              <>
                <span className={`h-2 w-2 rounded-full ${selectedContact.isOnline ? 'bg-chat-online' : 'bg-chat-offline'}`} />
                <span className="text-xs text-muted-foreground">
                  {selectedContact.isOnline ? 'Online' : 'Offline'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-1">
        {!isMobile && (
          <>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Video className="h-5 w-5" />
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

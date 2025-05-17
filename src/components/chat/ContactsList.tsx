
import React from 'react';
import { useChat, Contact } from '@/hooks/useChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function ContactsList() {
  const { contacts, selectedContact, selectContact } = useChat();

  const handleSelectContact = (contact: Contact) => {
    selectContact(contact.id);
  };

  return (
    <div className="space-y-1">
      <h2 className="text-sm font-medium text-muted-foreground mb-2">Conversations</h2>
      <ul className="space-y-1">
        {contacts.map((contact) => (
          <li key={contact.id}>
            <button
              onClick={() => handleSelectContact(contact)}
              className={cn(
                "flex items-center w-full rounded-lg p-2 hover:bg-muted transition-colors",
                selectedContact?.id === contact.id && "bg-muted"
              )}
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="bg-chat-primary text-white">
                    {contact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {contact.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chat-online border-2 border-background"></span>
                )}
              </div>
              <div className="ml-3 flex-1 text-left">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{contact.name}</span>
                  {contact.lastMessageTime && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(contact.lastMessageTime, { addSuffix: true })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {contact.isTyping ? (
                      <span className="text-xs text-chat-primary">Typing...</span>
                    ) : (
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {contact.lastMessage || "No messages yet"}
                      </span>
                    )}
                  </div>
                  {contact.unreadCount > 0 && (
                    <span className="rounded-full bg-chat-primary text-white text-xs px-2 py-0.5 min-w-[20px] text-center">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

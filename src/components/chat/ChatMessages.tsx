
import React, { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import MessageBubble from './MessageBubble';

export default function ChatMessages() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { selectedContact, messages } = useChat();
  const { user } = useAuth();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  // Group messages by date
  const groupMessagesByDate = () => {
    if (!selectedContact || !user || !messages[selectedContact.id]) {
      return {};
    }
    
    const groupedMessages: Record<string, typeof messages[string]> = {};
    
    messages[selectedContact.id].forEach((message) => {
      const date = new Date(message.timestamp);
      const dateString = date.toLocaleDateString();
      
      if (!groupedMessages[dateString]) {
        groupedMessages[dateString] = [];
      }
      
      groupedMessages[dateString].push(message);
    });
    
    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate();

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-chat-light bg-opacity-30 dark:bg-opacity-10">
        <div className="text-center text-muted-foreground">
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  if (Object.keys(groupedMessages).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-chat-light bg-opacity-30 dark:bg-opacity-10">
        <div className="text-center text-muted-foreground">
          <p>No messages yet</p>
          <p className="text-sm">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-chat-light bg-opacity-30 dark:bg-opacity-10">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
              {new Date(date).toLocaleDateString(undefined, { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          {dateMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isUser={message.senderId === user?.id}
            />
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

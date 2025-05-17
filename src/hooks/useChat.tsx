
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'file' | 'image' | 'video';
  fileUrl?: string;
}

interface ChatContextType {
  contacts: Contact[];
  messages: Record<string, Message[]>;
  selectedContact: Contact | null;
  selectContact: (contactId: string) => void;
  sendMessage: (content: string, type?: 'text' | 'file' | 'image' | 'video', fileUrl?: string) => void;
  setTyping: (isTyping: boolean) => void;
  markAsRead: (messageIds: string[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Mock initial data
const MOCK_ADMIN_CONTACT: Contact = {
  id: 'admin-1',
  name: 'Admin',
  avatar: 'https://i.pravatar.cc/150?u=admin',
  lastMessage: 'How can I help you today?',
  lastMessageTime: new Date(),
  unreadCount: 1,
  isOnline: true,
  isTyping: false
};

const MOCK_CONTACTS: Contact[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?u=john',
    lastMessage: 'Hello there!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    unreadCount: 0,
    isOnline: true,
    isTyping: false
  }
];

// Initialize messages with separate conversations for each user
const MOCK_MESSAGES: Record<string, Message[]> = {
  'user-1': [
    {
      id: 'msg-1',
      senderId: 'admin-1',
      recipientId: 'user-1',
      content: 'Hello! How can I help you today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      isRead: true,
      type: 'text'
    },
    {
      id: 'msg-2',
      senderId: 'user-1',
      recipientId: 'admin-1',
      content: 'I have a question about the service.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      isRead: false,
      type: 'text'
    }
  ]
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    // Set up contacts based on user role
    if (!user) return;

    if (user.isAdmin) {
      // Admin sees all users
      setContacts(MOCK_CONTACTS);
      
      // If no contact is selected and there are contacts, select the first one
      if (!selectedContact && MOCK_CONTACTS.length > 0) {
        selectContact(MOCK_CONTACTS[0].id);
      }
    } else {
      // Regular users only see the admin
      setContacts([MOCK_ADMIN_CONTACT]);
      
      // If no contact is selected, select the admin
      if (!selectedContact) {
        selectContact(MOCK_ADMIN_CONTACT.id);
      }
    }
  }, [user, selectedContact]);

  // Select contact and mark messages as read
  const selectContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setSelectedContact(contact);
      
      // Update contact unread count
      setContacts(prevContacts => 
        prevContacts.map(c => 
          c.id === contactId ? { ...c, unreadCount: 0 } : c
        )
      );
      
      // Mark messages as read
      if (!user) return;
      
      // Get the conversation based on whether the user is admin or regular user
      const conversationId = user.isAdmin ? contactId : user.id;
      const conversation = messages[conversationId] || [];
      
      const unreadMessageIds = conversation
        .filter(m => !m.isRead && m.senderId === contactId)
        .map(m => m.id);
      
      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
      }
    }
  };

  // Send a new message
  const sendMessage = (
    content: string, 
    type: 'text' | 'file' | 'image' | 'video' = 'text', 
    fileUrl?: string
  ) => {
    if (!user || !selectedContact || (!content.trim() && !fileUrl)) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      recipientId: selectedContact.id,
      content: content.trim() || (type !== 'text' ? 'Attachment' : ''),
      timestamp: new Date(),
      isRead: false,
      type,
      fileUrl
    };
    
    // Determine the conversation ID based on user type
    const conversationId = user.isAdmin ? selectedContact.id : user.id;
    
    // Add message to conversation
    setMessages(prev => {
      const updatedMessages = { ...prev };
      if (!updatedMessages[conversationId]) {
        updatedMessages[conversationId] = [];
      }
      
      updatedMessages[conversationId] = [...updatedMessages[conversationId], newMessage];
      return updatedMessages;
    });
    
    // Update contact's last message
    let lastMessageText = content;
    if (!content && type !== 'text') {
      switch (type) {
        case 'image': 
          lastMessageText = 'Image sent';
          break;
        case 'file':
          lastMessageText = 'File sent';
          break;
        case 'video':
          lastMessageText = 'Video sent';
          break;
      }
    }
    
    setContacts(prevContacts => 
      prevContacts.map(c => 
        c.id === selectedContact.id 
          ? { 
              ...c, 
              lastMessage: lastMessageText.length > 30 ? lastMessageText.substring(0, 30) + '...' : lastMessageText,
              lastMessageTime: new Date()
            } 
          : c
      )
    );
    
    // No auto-responses anymore
  };

  // Set typing indicator for a contact
  const setTyping = (isTyping: boolean) => {
    if (!selectedContact) return;
    
    // Update typing status for the selected contact
    setContacts(prevContacts => 
      prevContacts.map(c => 
        c.id === selectedContact.id ? { ...c, isTyping } : c
      )
    );

    // If user is typing, automatically turn it off after a delay
    if (isTyping) {
      setTimeout(() => {
        setContacts(prevContacts => 
          prevContacts.map(c => 
            c.id === selectedContact?.id ? { ...c, isTyping: false } : c
          )
        );
      }, 3000);
    }
  };

  // Mark messages as read
  const markAsRead = (messageIds: string[]) => {
    if (!messageIds.length) return;
    
    setMessages(prev => {
      const updatedMessages = { ...prev };
      
      // Update all conversations
      for (const contactId in updatedMessages) {
        updatedMessages[contactId] = updatedMessages[contactId].map(msg => 
          messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
        );
      }
      
      return updatedMessages;
    });
  };

  return (
    <ChatContext.Provider
      value={{
        contacts,
        messages,
        selectedContact,
        selectContact,
        sendMessage,
        setTyping,
        markAsRead
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

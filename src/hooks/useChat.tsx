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

// Empty initial data
const MOCK_MESSAGES: Record<string, Message[]> = {};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Keep track of all users for contact management
  const [allUsers, setAllUsers] = useState<{id: string, name: string, avatar?: string, isAdmin: boolean}[]>([]);

  // Get all users from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      
      // Add current user to allUsers if not already there
      setAllUsers(prev => {
        if (!prev.find(u => u.id === currentUser.id)) {
          return [...prev, currentUser];
        }
        return prev;
      });
    }
  }, []);

  // Update allUsers when user logs in
  useEffect(() => {
    if (user) {
      setAllUsers(prev => {
        if (!prev.find(u => u.id === user.id)) {
          return [...prev, user];
        }
        return prev;
      });
    }
  }, [user]);

  // Set up contacts based on user role
  useEffect(() => {
    if (!user) return;

    // Generate contacts based on all known users
    const userContacts = allUsers
      .filter(u => u.id !== user.id) // Don't include self as contact
      .map(u => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        unreadCount: 0,
        isOnline: true,
        isTyping: false
      }));

    setContacts(userContacts);
    
    // If no contact is selected and there are contacts, select the first one
    if (!selectedContact && userContacts.length > 0) {
      selectContact(userContacts[0].id);
    }
  }, [user, allUsers, selectedContact]);

  // Initialize conversation for new users
  useEffect(() => {
    if (!user) return;
    
    // For each contact, ensure there's a conversation entry
    contacts.forEach(contact => {
      const conversationId = contact.id;
      
      if (!messages[conversationId]) {
        setMessages(prev => ({
          ...prev,
          [conversationId]: []
        }));
      }
    });
  }, [user, contacts, messages]);

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
      
      // Get the conversation 
      const conversation = messages[contactId] || [];
      
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
    
    // Add message to conversation
    setMessages(prev => {
      const updatedMessages = { ...prev };
      const conversationId = selectedContact.id;
      
      if (!updatedMessages[conversationId]) {
        updatedMessages[conversationId] = [];
      }
      
      updatedMessages[conversationId] = [
        ...updatedMessages[conversationId], 
        newMessage
      ];
      
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

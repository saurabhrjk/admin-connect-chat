
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

// Store conversations by pairs (user1-user2)
const CONVERSATIONS: Record<string, Message[]> = {};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, getAllUsers } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>(CONVERSATIONS);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Update contacts when user changes or users are added
  useEffect(() => {
    if (!user) return;

    // Get all users from auth context
    const allUsers = getAllUsers();
    
    let userContacts: Contact[] = [];
    
    if (user.isAdmin) {
      // Admin can see all non-admin users
      userContacts = allUsers
        .filter(u => u.id !== user.id) // Don't include self as contact
        .map(u => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          unreadCount: 0,
          isOnline: true,
          isTyping: false
        }));
    } else {
      // Regular users can only see admin
      const admin = allUsers.find(u => u.isAdmin);
      if (admin) {
        userContacts = [{
          id: admin.id,
          name: admin.name,
          avatar: admin.avatar,
          unreadCount: 0,
          isOnline: true,
          isTyping: false
        }];
      }
    }

    setContacts(userContacts);
    
    // If no contact is selected and there are contacts, select the first one
    if (!selectedContact && userContacts.length > 0) {
      selectContact(userContacts[0].id);
    }
  }, [user, getAllUsers]);

  // Helper function to generate a unique conversation ID between two users
  const getConversationId = (user1Id: string, user2Id: string) => {
    // Sort IDs to ensure consistent conversation IDs regardless of who initiates
    const sortedIds = [user1Id, user2Id].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  };

  // Initialize conversation for new users
  useEffect(() => {
    if (!user) return;
    
    // For each contact, ensure there's a conversation entry
    contacts.forEach(contact => {
      const conversationId = getConversationId(user.id, contact.id);
      
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
      
      const conversationId = getConversationId(user.id, contactId);
      
      // Get the conversation 
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
    
    // Add message to conversation using the conversation ID
    const conversationId = getConversationId(user.id, selectedContact.id);
    
    setMessages(prev => {
      const updatedMessages = { ...prev };
      
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
    if (!messageIds.length || !user) return;
    
    setMessages(prev => {
      const updatedMessages = { ...prev };
      
      // Update all conversations
      for (const conversationId in updatedMessages) {
        updatedMessages[conversationId] = updatedMessages[conversationId].map(msg => 
          messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
        );
      }
      
      return updatedMessages;
    });
  };

  // Get messages for the current selected contact
  const getVisibleMessages = () => {
    if (!user || !selectedContact) {
      return {};
    }
    
    const conversationId = getConversationId(user.id, selectedContact.id);
    const conversation = messages[conversationId] || [];
    
    return {
      [selectedContact.id]: conversation
    };
  };

  // Get visible messages for the current user and selected contact
  const visibleMessages = getVisibleMessages();

  return (
    <ChatContext.Provider
      value={{
        contacts,
        messages: visibleMessages,
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

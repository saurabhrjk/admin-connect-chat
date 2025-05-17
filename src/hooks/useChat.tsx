
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
  },
  {
    id: 'user-2',
    name: 'Alice Smith',
    avatar: 'https://i.pravatar.cc/150?u=alice',
    lastMessage: 'Thanks for your help!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    unreadCount: 2,
    isOnline: false,
    isTyping: false
  }
];

// Initialize messages with separate conversations for each user with the admin
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
  ],
  'user-2': [
    {
      id: 'msg-3',
      senderId: 'user-2',
      recipientId: 'admin-1',
      content: 'Hello there!',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isRead: true,
      type: 'text'
    },
    {
      id: 'msg-4',
      senderId: 'admin-1',
      recipientId: 'user-2',
      content: 'Hi Alice, what can I do for you today?',
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
      setContacts(MOCK_CONTACTS);
      // Admin sees all users
    } else {
      // Regular users only see the admin
      setContacts([MOCK_ADMIN_CONTACT]);
    }
  }, [user]);

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
      if (messages[contactId]) {
        const unreadMessageIds = messages[contactId]
          .filter(m => !m.isRead && m.senderId === contactId)
          .map(m => m.id);
        
        if (unreadMessageIds.length > 0) {
          markAsRead(unreadMessageIds);
        }
      }
    }
  };

  // Send a new message
  const sendMessage = (
    content: string, 
    type: 'text' | 'file' | 'image' | 'video' = 'text', 
    fileUrl?: string
  ) => {
    if (!user || !selectedContact || !content.trim()) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      recipientId: selectedContact.id,
      content,
      timestamp: new Date(),
      isRead: false,
      type,
      fileUrl
    };
    
    // Get the correct conversation ID based on who's talking to whom
    const conversationId = user.isAdmin ? selectedContact.id : user.id;
    
    // Add message to conversation
    setMessages(prev => {
      return { 
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage]
      };
    });
    
    // Update contact's last message
    setContacts(prevContacts => 
      prevContacts.map(c => 
        c.id === selectedContact.id 
          ? { 
              ...c, 
              lastMessage: content.length > 30 ? content.substring(0, 30) + '...' : content,
              lastMessageTime: new Date()
            } 
          : c
      )
    );
    
    // Simulate receiving a response after a delay
    setTimeout(() => {
      // Only auto-respond to non-admin users
      if (!user.isAdmin) {
        const responseMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          senderId: selectedContact.id,
          recipientId: user.id,
          content: getAutoResponse(content),
          timestamp: new Date(),
          isRead: false,
          type: 'text'
        };
        
        // First show typing indicator
        setContacts(prevContacts => 
          prevContacts.map(c => 
            c.id === selectedContact.id ? { ...c, isTyping: true } : c
          )
        );
        
        // Then after a delay, send the message and remove typing indicator
        setTimeout(() => {
          setMessages(prev => {
            // Store in user's conversation
            return { 
              ...prev,
              [user.id]: [...(prev[user.id] || []), responseMessage]
            };
          });
          
          // Update contact with new last message and increment unread count
          setContacts(prevContacts => 
            prevContacts.map(c => 
              c.id === selectedContact.id 
                ? { 
                    ...c, 
                    lastMessage: responseMessage.content.length > 30 
                      ? responseMessage.content.substring(0, 30) + '...' 
                      : responseMessage.content,
                    lastMessageTime: new Date(),
                    unreadCount: c.unreadCount + 1,
                    isTyping: false
                  } 
                : c
            )
          );
        }, 1500 + Math.random() * 1000);
      }
    }, 1000);
  };

  // Helper function to generate auto responses
  const getAutoResponse = (message: string): string => {
    const responses = [
      "Thanks for your message! I'll get back to you shortly.",
      "Got it! Let me check on that for you.",
      "Thanks for reaching out. Is there anything else you'd like to know?",
      "I'll look into this and respond as soon as possible.",
      "Thank you for your inquiry. I'm processing your request."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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


import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

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

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, getAllUsers } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Update contacts when user changes
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      
      try {
        // Get all users from database
        const allUsers = await getAllUsers();
        
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
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };
    
    fetchContacts();
  }, [user, getAllUsers]);

  // Fetch messages for selected contact
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !selectedContact) return;
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }
        
        const formattedMessages: Record<string, Message[]> = {};
        
        if (data) {
          // Process messages and group by contact
          data.forEach(msg => {
            const contactId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
            
            if (!formattedMessages[contactId]) {
              formattedMessages[contactId] = [];
            }
            
            formattedMessages[contactId].push({
              id: msg.id,
              senderId: msg.sender_id,
              recipientId: msg.recipient_id,
              content: msg.content,
              timestamp: new Date(msg.created_at),
              isRead: msg.is_read,
              type: msg.type as 'text' | 'file' | 'image' | 'video',
              fileUrl: msg.file_url || undefined
            });
          });
        }
        
        setMessages(formattedMessages);
        
        // Update contact unread count
        updateContactsWithMessageInfo(formattedMessages);
      } catch (error) {
        console.error('Error in fetchMessages:', error);
      }
    };
    
    fetchMessages();
    
    // Set up real-time listener for new messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages'
      }, payload => {
        if (payload.new) {
          handleNewMessage(payload.new);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedContact]);

  const handleNewMessage = (newMsg: any) => {
    if (!user) return;
    
    const isForCurrentUser = newMsg.sender_id === user.id || newMsg.recipient_id === user.id;
    
    if (isForCurrentUser) {
      const contactId = newMsg.sender_id === user.id ? newMsg.recipient_id : newMsg.sender_id;
      const newMessage: Message = {
        id: newMsg.id,
        senderId: newMsg.sender_id,
        recipientId: newMsg.recipient_id,
        content: newMsg.content,
        timestamp: new Date(newMsg.created_at),
        isRead: newMsg.is_read,
        type: newMsg.type as 'text' | 'file' | 'image' | 'video',
        fileUrl: newMsg.file_url || undefined
      };
      
      setMessages(prev => {
        const updated = { ...prev };
        
        if (!updated[contactId]) {
          updated[contactId] = [];
        }
        
        // Check if message already exists to avoid duplicates
        const messageExists = updated[contactId].some(msg => msg.id === newMsg.id);
        
        if (!messageExists) {
          updated[contactId] = [...updated[contactId], newMessage];
        }
        
        return updated;
      });
      
      // Update contacts with new message info
      setContacts(prev => 
        prev.map(contact => 
          contact.id === contactId
            ? { 
                ...contact, 
                lastMessage: newMsg.content.length > 30 ? newMsg.content.substring(0, 30) + '...' : newMsg.content,
                lastMessageTime: new Date(newMsg.created_at),
                unreadCount: contact.unreadCount + (newMsg.sender_id !== user.id && !newMsg.is_read ? 1 : 0)
              }
            : contact
        )
      );
    }
  };

  const updateContactsWithMessageInfo = (messagesMap: Record<string, Message[]>) => {
    setContacts(prev => 
      prev.map(contact => {
        const contactMessages = messagesMap[contact.id] || [];
        const lastMsg = contactMessages[contactMessages.length - 1];
        const unreadCount = contactMessages.filter(msg => msg.senderId === contact.id && !msg.isRead).length;
        
        return {
          ...contact,
          lastMessage: lastMsg?.content,
          lastMessageTime: lastMsg?.timestamp,
          unreadCount
        };
      })
    );
  };

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
      
      const conversationMessages = messages[contactId] || [];
      
      const unreadMessageIds = conversationMessages
        .filter(m => !m.isRead && m.senderId === contactId)
        .map(m => m.id);
      
      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
      }
    }
  };

  // Send a new message
  const sendMessage = async (
    content: string, 
    type: 'text' | 'file' | 'image' | 'video' = 'text', 
    fileUrl?: string
  ) => {
    if (!user || !selectedContact || (!content.trim() && !fileUrl)) return;
    
    try {
      const newMessage = {
        sender_id: user.id,
        recipient_id: selectedContact.id,
        content: content.trim() || (type !== 'text' ? 'Attachment' : ''),
        type,
        file_url: fileUrl || null,
        is_read: false
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();
      
      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }
      
      // Update local state handled by real-time subscription
      
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
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast.error('Failed to send message');
    }
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
  const markAsRead = async (messageIds: string[]) => {
    if (!messageIds.length || !user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds);
      
      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }
      
      // Update local state
      setMessages(prev => {
        const updated = { ...prev };
        
        // Update all conversations
        for (const contactId in updated) {
          updated[contactId] = updated[contactId].map(msg => 
            messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
          );
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  // Get messages for the current selected contact
  const getVisibleMessages = () => {
    if (!user || !selectedContact) {
      return {};
    }
    
    const conversation = messages[selectedContact.id] || [];
    
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

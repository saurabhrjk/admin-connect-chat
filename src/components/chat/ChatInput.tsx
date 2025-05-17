
import React, { useState, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, setTyping, selectedContact } = useChat();

  const handleSendMessage = () => {
    if (message.trim() && selectedContact) {
      sendMessage(message.trim());
      setMessage('');
      setTyping(false);
      toast.success("Message sent");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (e.target.value.trim() && selectedContact) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const handleAttachment = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Get file type
    const fileType = file.type.split('/')[0]; // 'image', 'video', etc.
    let messageType: 'image' | 'video' | 'file' = 'file';
    
    if (fileType === 'image') {
      messageType = 'image';
    } else if (fileType === 'video') {
      messageType = 'video';
    }
    
    // Create a URL for the file
    const fileUrl = URL.createObjectURL(file);
    
    // Send file message
    sendMessage(file.name, messageType, fileUrl);
    toast.success(`${file.name} attached successfully`);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!selectedContact) return null;

  return (
    <div className="border-t p-4">
      <div className="flex space-x-2 items-end">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[80px] resize-none"
          />
        </div>
        <div className="flex space-x-2">
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          
          <Button 
            onClick={handleAttachment} 
            size="icon" 
            variant="ghost"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim()} 
            size="icon"
            className="bg-chat-primary hover:bg-chat-secondary text-white rounded-full"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

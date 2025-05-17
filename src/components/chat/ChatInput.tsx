
import React, { useState, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Smile, Send } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, setTyping, selectedContact } = useChat();

  const handleSendMessage = () => {
    if (message.trim() && selectedContact) {
      sendMessage(message);
      setMessage('');
      setTyping(false);
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

  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.native);
    textareaRef.current?.focus();
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
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost">
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-none" side="top" align="end">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>
          
          <Button size="icon" variant="ghost">
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

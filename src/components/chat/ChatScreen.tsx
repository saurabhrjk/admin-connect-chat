
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useChat } from '@/hooks/useChat';
import Sidebar from '../layout/Sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function ChatScreen() {
  const isMobile = useIsMobile();
  const { selectedContact } = useChat();
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-2 left-2 z-50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]" showCloseButton={false}>
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-[280px] border-r">
          <Sidebar />
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <ChatMessages />
        {selectedContact && <ChatInput />}
      </div>
    </div>
  );
}

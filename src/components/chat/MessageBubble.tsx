
import React from 'react';
import { Message } from '@/hooks/useChat';
import { Check, CheckCheck, FileText, FileImage, FileVideo } from 'lucide-react';
import { formatRelative } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return <p className="whitespace-pre-wrap">{message.content}</p>;
      case 'image':
        return (
          <div>
            <img
              src={message.fileUrl}
              alt="Image message"
              className="max-w-full rounded-lg max-h-[200px] object-contain"
            />
            {message.content && <p className="mt-1">{message.content}</p>}
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center p-2 bg-white bg-opacity-20 rounded-md">
            <FileText className="h-5 w-5 mr-2" />
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {message.content || "Attachment"}
            </a>
          </div>
        );
      case 'video':
        return (
          <div>
            <video
              src={message.fileUrl}
              controls
              className="max-w-full rounded-lg max-h-[200px]"
            />
            {message.content && <p className="mt-1">{message.content}</p>}
          </div>
        );
      default:
        return <p>{message.content}</p>;
    }
  };

  const formattedDate = formatRelative(new Date(message.timestamp), new Date());

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[75%] p-3 rounded-lg ${
        isUser 
          ? 'bg-chat-primary text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-800 rounded-bl-none'
      }`}>
        {renderMessageContent()}
        <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${isUser ? 'text-white text-opacity-70' : 'text-gray-500'}`}>
          <span>{formattedDate}</span>
          {isUser && (
            message.isRead ? 
            <CheckCheck className="h-3 w-3" /> : 
            <Check className="h-3 w-3" />
          )}
        </div>
      </div>
    </div>
  );
}

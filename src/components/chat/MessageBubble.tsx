
import React from 'react';
import { Message } from '@/hooks/useChat';
import { Check, CheckCheck } from 'lucide-react';
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
              className="max-w-full rounded-lg max-h-[200px]"
            />
            <p className="mt-1">{message.content}</p>
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center p-2 bg-white bg-opacity-20 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {message.content}
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
            <p className="mt-1">{message.content}</p>
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

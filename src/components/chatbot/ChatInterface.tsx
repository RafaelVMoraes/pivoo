import React, { useRef, useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatMessage } from './types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading || disabled) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = (text: string): ReactNode => {
    const lines = text.split('\n');
    const elements: ReactNode[] = [];
    let list: ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (list.length > 0 && listType) {
        const Tag = listType;
        elements.push(
          <Tag key={`list-${elements.length}`} className={`ml-4 ${listType === 'ul' ? 'list-disc' : 'list-decimal'} space-y-0.5 my-1`}>
            {list}
          </Tag>
        );
        list = [];
        listType = null;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        flushList();
        elements.push(
          <p key={idx} className="font-semibold text-sm mt-2 mb-1">
            {processInline(headingMatch[2])}
          </p>
        );
        return;
      }

      const listMatch = trimmed.match(/^(\*|-|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const isOrdered = /\d+\./.test(listMatch[1]);
        const newType = isOrdered ? 'ol' : 'ul';
        if (listType && listType !== newType) flushList();
        listType = newType;
        list.push(<li key={idx} className="text-sm">{processInline(listMatch[2])}</li>);
        return;
      }

      flushList();
      elements.push(<p key={idx} className="text-sm mb-1">{processInline(trimmed)}</p>);
    });

    flushList();
    return elements;
  };

  const processInline = (text: string): ReactNode => {
    const parts: ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

      const matches = [
        boldMatch ? { type: 'bold', match: boldMatch, idx: boldMatch.index! } : null,
        italicMatch ? { type: 'italic', match: italicMatch, idx: italicMatch.index! } : null,
      ].filter(Boolean) as Array<{ type: string; match: RegExpMatchArray; idx: number }>;

      if (matches.length === 0) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      const first = matches.reduce((min, curr) => curr.idx < min.idx ? curr : min);

      if (first.idx > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, first.idx)}</span>);
      }

      if (first.type === 'bold') {
        parts.push(<strong key={key++} className="font-semibold">{first.match[1]}</strong>);
      } else {
        parts.push(<em key={key++} className="italic">{first.match[1]}</em>);
      }

      remaining = remaining.slice(first.idx + first.match[0].length);
    }

    return parts.length > 0 ? parts : text;
  };

  // Filter out the initial analysis message for chat display (it's shown separately)
  const chatMessages = messages.filter(m => !m.isInitialAnalysis);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t('chatbot.continueAnalysis')}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('chatbot.followUpHint')}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {chatMessages.length > 0 && (
          <ScrollArea className="h-[250px]" ref={scrollRef as any}>
            <div className="space-y-3 pr-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose-sm">{renderContent(message.content)}</div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm text-muted-foreground">{t('chatbot.thinking')}</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder={t('chatbot.followUpPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading || disabled}
            className="min-h-[44px] max-h-[88px] resize-none text-sm"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim() || disabled}
            size="icon"
            className="h-[44px] w-[44px] shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;

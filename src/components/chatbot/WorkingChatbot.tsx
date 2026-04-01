import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChatbot } from '@/hooks/useChatbot';
import { useTranslation } from '@/hooks/useTranslation';
import { Send, Bot, User, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkingChatbotProps {
  className?: string;
}

export const WorkingChatbot: React.FC<WorkingChatbotProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useChatbot();
  const { t, language } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Wrapper to inject preferred language as system prompt/context
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');

    // Attach a system instruction about user language to the AI for context.
    // This assumes sendMessage can optionally accept metadata/context,
    // If not, you can prepend the language instruction directly.

    // Option 1: If sendMessage supports a 'systemPrompt', send as parameter:
    // await sendMessage(message, { systemPrompt: `The user's preferred language is "${lang}". Please answer in this language.` });

    // Option 2: If not, prepend the language hint to the user's prompt:
    const languageInstruction =
    language && language !== 'en'
        ? `[The user's preferred language is "${language}". Please answer in this language.]\n`
        : '';
    await sendMessage(languageInstruction + message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Markdown renderer for chat messages (headings, lists, bold/italic, and placeholders)
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentListItems: React.ReactNode[] = [];
    let currentListType: 'ul' | 'ol' | null = null;

    const pushCurrentList = () => {
      if (currentListItems.length === 0 || !currentListType) return;
      const ListTag = currentListType === 'ul' ? 'ul' : 'ol';
      elements.push(
        <ListTag key={`list-${elements.length}`} className="ml-4 list-disc space-y-1">
          {currentListItems}
        </ListTag>
      );
      currentListItems = [];
      currentListType = null;
    };

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();

      // Blank lines break paragraphs/lists
      if (!trimmed) {
        pushCurrentList();
        elements.push(<br key={`br-${lineIndex}`} />);
        return;
      }

      // Headings: #, ##, ### ...
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        pushCurrentList();
        const level = headingMatch[1].length;
        const content = processInlineMarkdown(headingMatch[2]);
        const HeadingTag = (`h${Math.min(level, 3)}` as keyof JSX.IntrinsicElements);
        elements.push(
          <HeadingTag
            key={`h-${lineIndex}`}
            className="mt-2 mb-1 font-semibold text-sm"
          >
            {content}
          </HeadingTag>
        );
        return;
      }

      // Lists: -, *, or 1.
      const listMatch = trimmed.match(/^(\*|-|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const isOrdered = /\d+\./.test(listMatch[1]);
        const listContent = processInlineMarkdown(listMatch[2]);

        if (!currentListType) {
          currentListType = isOrdered ? 'ol' : 'ul';
        } else if (
          (isOrdered && currentListType !== 'ol') ||
          (!isOrdered && currentListType !== 'ul')
        ) {
          // Different list type – close current and start new
          pushCurrentList();
          currentListType = isOrdered ? 'ol' : 'ul';
        }

        currentListItems.push(
          <li key={`li-${lineIndex}`} className="ml-1">
            {listContent}
          </li>
        );
        return;
      }

      // Regular text line
      pushCurrentList();
      const content = processInlineMarkdown(line);
      elements.push(
        <p key={`p-${lineIndex}`} className="mb-1">
          {content}
        </p>
      );
    });

    pushCurrentList();
    return elements;
  };

  const processInlineMarkdown = (text: string): React.ReactNode => {
    // Process bold, italic, and placeholders like [e.g., ...]
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Detect placeholders that look like examples
      const placeholderRegex = /\[([^\]]+)\]/;
      const boldRegex = /\*\*(.+?)\*\*/;
      const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/;

      const placeholderMatch = remaining.match(placeholderRegex);
      const boldMatch = remaining.match(boldRegex);
      const italicMatch = remaining.match(italicRegex);

      // Choose the earliest match among placeholder, bold, italic
      const candidates = [
        placeholderMatch && placeholderMatch.index !== undefined
          ? { type: 'placeholder' as const, match: placeholderMatch, index: placeholderMatch.index }
          : null,
        boldMatch && boldMatch.index !== undefined
          ? { type: 'bold' as const, match: boldMatch, index: boldMatch.index }
          : null,
        italicMatch && italicMatch.index !== undefined
          ? { type: 'italic' as const, match: italicMatch, index: italicMatch.index }
          : null,
      ].filter(Boolean) as Array<{
        type: 'placeholder' | 'bold' | 'italic';
        match: RegExpMatchArray;
        index: number;
      }>;

      if (candidates.length === 0) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      const earliest = candidates.reduce((min, curr) =>
        curr.index < min.index ? curr : min
      );

      if (earliest.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, earliest.index)}</span>);
      }

      const fullMatch = earliest.match[0];
      const innerText = earliest.match[1];

      if (earliest.type === 'bold') {
        parts.push(
          <strong key={key++} className="font-semibold">
            {innerText}
          </strong>
        );
      } else if (earliest.type === 'italic') {
        parts.push(
          <em key={key++} className="italic">
            {innerText}
          </em>
        );
      } else if (earliest.type === 'placeholder') {
        // Only treat as interactive placeholder if it looks like an example
        const isExample =
          /e\.g\./i.test(innerText) ||
          /example/i.test(innerText) ||
          /\.\.\./.test(innerText);

        if (isExample) {
          parts.push(
            <input
              key={key++}
              defaultValue={innerText.replace(/^\s*\(?e\.g\.\)?\s*/i, '').trim() || ''}
              className="inline-block border-b border-dashed border-muted-foreground bg-transparent px-1 text-xs focus:outline-none focus:border-primary"
            />
          );
        } else {
          // Fallback: render as plain text with brackets
          parts.push(<span key={key++}>{fullMatch}</span>);
        }
      }

      remaining = remaining.slice(earliest.index + fullMatch.length);
    }

    return parts.length > 0 ? parts : text;
  };

  const MessageBubble: React.FC<{ message: any }> = ({ message }) => (
    <div className={cn(
      'flex gap-3 p-4 rounded-xl transition-all duration-300',
      message.role === 'user' 
        ? 'flex-row-reverse bg-primary/10 ml-8' 
        : 'flex-row bg-muted/30 mr-8'
    )}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        message.role === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      )}>
        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {message.role === 'user' ? t('common.you') || 'You' : t('chatbot.assistant') || 'Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="text-sm break-words prose prose-sm dark:prose-invert max-w-none">
          {message.role === 'assistant' ? renderMarkdown(message.content) : message.content}
        </div>
      </div>
    </div>
  );

  if (!isOpen) {
    return (
      <div className={cn('fixed bottom-20 right-4 z-[9999]', className)}>
        <Button
          onClick={() => {
            console.log('WorkingChatbot button clicked');
            setIsOpen(true);
          }}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground"
          title={t('chatbot.openChat') || 'Open AI Chat'}
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('fixed inset-x-0 bottom-0 z-[9999] sm:inset-x-auto sm:right-4 sm:bottom-20 sm:w-96 sm:h-[600px] h-[calc(100dvh-0px)] w-full', className)}>
      <Card className="h-full flex flex-col shadow-2xl border-0 rounded-none sm:rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">
              {t('chatbot.title') || 'AI Assistant'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="h-8 w-8"
              title={t('chatbot.clearChat') || 'Clear chat'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
              title={t('chatbot.closeChat') || 'Close chat'}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">
                  {t('chatbot.welcomeMessage') || 'Hi! I\'m your AI assistant. How can I help you today?'}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 p-4 rounded-xl bg-muted/30 mr-8">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {t('chatbot.assistant') || 'Assistant'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chatbot.typeMessage') || 'Type your message...'}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

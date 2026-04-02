import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { useTranslation } from '@/hooks/useTranslation';

interface QuickAssistantPanelProps {
  onFirstMessage: () => void;
}

export const QuickAssistantPanel: React.FC<QuickAssistantPanelProps> = ({ onFirstMessage }) => {
  const { t } = useTranslation();
  const { messages, isLoading, sendMessage } = useChatbot();
  const [inputValue, setInputValue] = useState('');
  const hasTrackedFirstMessage = useRef(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (!hasTrackedFirstMessage.current) {
      onFirstMessage();
      hasTrackedFirstMessage.current = true;
    }
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('chatbot.quickModeTitle')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('chatbot.quickModeDescription')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-[260px] rounded-md border p-3">
          <div className="space-y-2">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('chatbot.quickModeEmpty')}</p>
            )}
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('chatbot.thinking')}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('chatbot.quickModePlaceholder')}
            className="min-h-[44px] max-h-[88px] resize-none text-sm"
          />
          <Button onClick={handleSend} disabled={isLoading || !inputValue.trim()} size="icon" className="h-[44px] w-[44px] shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAssistantPanel;

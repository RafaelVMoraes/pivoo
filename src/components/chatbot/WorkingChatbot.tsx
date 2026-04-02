import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { trackAIModeEvent } from '@/lib/aiModeEvents';

interface WorkingChatbotProps {
  className?: string;
}

export const WorkingChatbot: React.FC<WorkingChatbotProps> = ({ className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={cn('fixed bottom-20 right-4 z-[9999]', className)}>
      <Button
        onClick={() => {
          trackAIModeEvent({ event: 'mode_opened', mode: 'assistant_quick', metadata: { source: 'floating_shortcut' } });
          navigate('/ai-chatbot?mode=assistant_quick');
        }}
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground"
        title={t('chatbot.openQuickAssistant')}
      >
        <Bot className="w-6 h-6" />
      </Button>
    </div>
  );
};

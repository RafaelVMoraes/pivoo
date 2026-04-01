import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Target, Brain, TrendingUp, Compass, Lock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getLocalizedModuleContent } from '@/lib/chatbotModules';
import type { ModuleDefinition } from './types';

const iconMap: Record<string, React.ReactNode> = {
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Compass: <Compass className="h-5 w-5" />,
};

interface ModuleCardProps {
  module: ModuleDefinition;
  onSelect: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onSelect,
  disabled = false,
  disabledReason,
}) => {
  const { t } = useTranslation();
  const localizedModule = getLocalizedModuleContent(module.id, t);

  return (
    <Card 
      className={`transition-all duration-200 ${
        disabled 
          ? 'opacity-60 cursor-not-allowed' 
          : 'hover:shadow-md hover:border-primary/50 cursor-pointer'
      }`}
      onClick={disabled ? undefined : onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${disabled ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
            {disabled ? <Lock className="h-5 w-5 text-muted-foreground" /> : iconMap[module.icon]}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight">{localizedModule.title}</CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-2">
              {localizedModule.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-xs text-muted-foreground italic">
          "{localizedModule.dominantQuestion}"
        </p>
        <ul className="text-xs space-y-1">
          {localizedModule.expectedOutputs.map((output, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span>
              <span>{output}</span>
            </li>
          ))}
        </ul>
        {disabled && disabledReason && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            {disabledReason}
          </p>
        )}
        <Button 
          variant={disabled ? 'outline' : 'secondary'} 
          size="sm" 
          className="w-full"
          disabled={disabled}
        >
          {disabled ? t('chatbot.unavailable') : t('chatbot.startAnalysis')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;

import { Card, CardContent } from '@/components/ui/card';
import { Heart, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface KPIData {
  goalsCompletedPercentage: number;
  longestStreak: number;
  strongestLifeArea: string;
  weakestLifeArea: string;
}

interface MotivationalMicrocopyProps {
  kpiData: KPIData;
  isLoading: boolean;
}

export const MotivationalMicrocopy = ({ kpiData, isLoading }: MotivationalMicrocopyProps) => {
  const { t } = useTranslation();
  
  const motivationalMessage = useMemo(() => {
    if (isLoading) return { message: t('motivation.loadingProgress'), tone: "neutral" };

    const { goalsCompletedPercentage, longestStreak, strongestLifeArea } = kpiData;
    
    // Determine progress level
    const progressLevel = goalsCompletedPercentage >= 70 ? "high" : 
                         goalsCompletedPercentage >= 40 ? "medium" : "low";

    const messages = {
      high: [
        t('motivation.high.amazingWork').replace('{percentage}', goalsCompletedPercentage.toString()),
        t('motivation.high.consistency').replace('{days}', longestStreak.toString()),
        t('motivation.high.excelling').replace('{area}', strongestLifeArea),
        t('motivation.high.outstanding')
      ],
      medium: [
        t('motivation.medium.steadyProgress').replace('{percentage}', goalsCompletedPercentage.toString()),
        t('motivation.medium.momentum').replace('{days}', longestStreak.toString()),
        t('motivation.medium.strength').replace('{area}', strongestLifeArea),
        t('motivation.medium.solidProgress')
      ],
      low: [
        t('motivation.low.journey'),
        t('motivation.low.effort').replace('{days}', longestStreak.toString()),
        t('motivation.low.superpower').replace('{area}', strongestLifeArea),
        t('motivation.low.linear'),
        t('motivation.low.meaningful')
      ]
    };

    const messageArray = messages[progressLevel];
    const randomMessage = messageArray[Math.floor(Math.random() * messageArray.length)];
    
    return { 
      message: randomMessage, 
      tone: progressLevel 
    };
  }, [kpiData, isLoading, t]);

  if (isLoading) {
    return (
      <Card className="glass-card shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Heart className="text-primary animate-pulse" size={20} />
            <div className="h-4 bg-muted/50 rounded animate-pulse flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = () => {
    switch (motivationalMessage.tone) {
      case "high":
        return <Sparkles className="text-warning" size={20} />;
      case "medium":
        return <Heart className="text-primary" size={20} />;
      default:
        return <Heart className="text-muted-foreground" size={20} />;
    }
  };

  const getTextColor = () => {
    switch (motivationalMessage.tone) {
      case "high":
        return "text-foreground font-medium";
      case "medium":
        return "text-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className="glass-card shadow-card border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getIcon()}</div>
          <p className={`text-sm leading-relaxed ${getTextColor()}`}>
            {motivationalMessage.message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
/**
 * Year Progress Card - Compact Fixed Header
 * Shows year completion with task and objectives progress in one line
 */

import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Target, Calendar, PieChart, MessageCircle, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface YearProgressData {
  tasksCompleted: number;
  totalTasks: number;
  goalsCompleted: number;
  totalGoals: number;
  yearProgress: number;
  lifeWheelCurrentAvg: number;
  lifeWheelDesiredAvg: number;
  focusAreasCount: number;
  todayTasksCount: number;
}

interface YearProgressCardProps {
  data: YearProgressData;
  isLoading: boolean;
  isGuest: boolean;
}

export const YearProgressCard = ({ data, isLoading, isGuest }: YearProgressCardProps) => {
  const { t } = useTranslation();

  const scrollToReflection = () => {
    const reflectionElement = document.getElementById('daily-reflection');
    if (reflectionElement) {
      // Scroll to the element
      reflectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Open the reflection card if it's collapsed
      setTimeout(() => {
        const card = reflectionElement.querySelector('[data-state]');
        if (card) {
          const state = card.getAttribute('data-state');
          if (state === 'closed') {
            const trigger = reflectionElement.querySelector('button[data-state]');
            if (trigger) {
              (trigger as HTMLElement).click();
            }
          }
        }
      }, 600);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  }

  // Calculate days remaining in the year
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const daysRemaining = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-card border border-border rounded-lg p-3 sticky top-0 z-10 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Days Remaining */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {daysRemaining} {t('dashboard.daysRemaining')}
          </span>
        </div>

        {/* Today's Tasks */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Zap className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            Today tasks {data.todayTasksCount}
          </span>
        </div>

        {/* Goals Progress */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Target className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            Goals {data.goalsCompleted}/{data.totalGoals}
          </span>
        </div>

        {/* Life Wheel Scores */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <PieChart className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            Life Wheel {data.lifeWheelCurrentAvg.toFixed(1)} → {data.lifeWheelDesiredAvg.toFixed(1)}
          </span>
        </div>

        {/* Focus Areas Count */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            <span className="text-primary">
              {data.focusAreasCount} {t('dashboard.focusAreas')}
            </span>
          </span>
        </div>

        {/* Daily Reflection Button */}
        <Button
          onClick={scrollToReflection}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {t('dashboard.dailyReflection')}
        </Button>
      </div>
    </div>
  );
};

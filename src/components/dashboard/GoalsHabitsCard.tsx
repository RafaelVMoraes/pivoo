/**
 * Goals + Habits Consolidated Card
 * Merges goals overview with habits consistency
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Trophy, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface GoalsHabitsData {
  activeGoals: number;
  completedGoals: number;
  goldGoals: number;
  silverGoals: number;
  bronzeGoals: number;
  weeklyProgress: number; // percentage
  monthlyProgress: number; // percentage
  hasData: boolean;
}

interface GoalsHabitsCardProps {
  data: GoalsHabitsData;
  isLoading: boolean;
  isGuest: boolean;
}

export const GoalsHabitsCard = ({ data, isLoading, isGuest }: GoalsHabitsCardProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  // Show CTA if no goals
  if (!data.hasData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-6">
          <div className="flex flex-col items-center text-center gap-3">
            <Target className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('dashboard.noActiveGoals')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('dashboard.startWithGoals')}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/goals')}
            >
              {t('dashboard.createFirstGoal')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card border-border overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  {t('dashboard.goalsAndHabits')}
                </CardTitle>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-5">
            {/* Goals Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-accent/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{data.activeGoals}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.activeGoals')}</p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.completedGoals}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.completedGoals')}</p>
              </div>
            </div>

            {/* Goals by Priority */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t('dashboard.goalsByPriority')}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-foreground">{data.goldGoals} {t('dashboard.gold')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-sm text-foreground">{data.silverGoals} {t('dashboard.silver')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-orange-600" />
                  <span className="text-sm text-foreground">{data.bronzeGoals} {t('dashboard.bronze')}</span>
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {t('dashboard.weeklyProgress')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {data.weeklyProgress}%
                  </span>
                </div>
                <Progress value={data.weeklyProgress} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-foreground">
                      {t('dashboard.monthlyProgress')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {data.monthlyProgress}%
                  </span>
                </div>
                <Progress value={data.monthlyProgress} className="h-2 [&>div]:bg-accent" />
              </div>
            </div>

            {/* View All Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/goals')}
            >
              {t('dashboard.viewAllGoals')}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface KPIData {
  goalsCompletedPercentage: number;
  longestStreak: number;
  strongestLifeArea: string;
  weakestLifeArea: string;
}

interface KPICardsProps {
  data: KPIData;
  isLoading: boolean;
}

export const KPICards = ({ data, isLoading }: KPICardsProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="glass-card shadow-card">
            <CardContent className="p-4">
              <div className="h-16 bg-muted/50 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiCards = [
    {
      title: t('kpi.goalsCompleted'),
      value: `${data.goalsCompletedPercentage}%`,
      description: t('kpi.ofAllGoals'),
      icon: Target,
      color: "text-primary",
      badge: data.goalsCompletedPercentage >= 70 ? t('kpi.excellent') : data.goalsCompletedPercentage >= 40 ? t('kpi.good') : t('kpi.needsFocus'),
      badgeVariant: data.goalsCompletedPercentage >= 70 ? "default" : data.goalsCompletedPercentage >= 40 ? "secondary" : "destructive"
    },
    {
      title: t('kpi.longestStreak'),
      value: `${data.longestStreak}`,
      description: t('kpi.consecutiveDays'),
      icon: Flame,
      color: "text-secondary",
      badge: data.longestStreak >= 7 ? t('kpi.onFire') : data.longestStreak >= 3 ? t('kpi.building') : t('kpi.startStrong'),
      badgeVariant: data.longestStreak >= 7 ? "default" : "secondary"
    },
    {
      title: t('kpi.strongestArea'),
      value: data.strongestLifeArea,
      description: t('kpi.highestLifeScore'),
      icon: TrendingUp,
      color: "text-success",
      badge: t('kpi.strong'),
      badgeVariant: "default"
    },
    {
      title: t('kpi.focusArea'),
      value: data.weakestLifeArea,
      description: t('kpi.needsAttention'),
      icon: TrendingDown,
      color: "text-warning",
      badge: t('kpi.opportunity'),
      badgeVariant: "secondary"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((kpi, index) => (
        <Card key={index} className="glass-card shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <kpi.icon size={20} className={kpi.color} />
              <Badge variant={kpi.badgeVariant as any} className="text-xs">
                {kpi.badge}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">{kpi.value}</CardTitle>
              <CardDescription className="text-xs">{kpi.description}</CardDescription>
              <p className="text-sm font-medium text-foreground">{kpi.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
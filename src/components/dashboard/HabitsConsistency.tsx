import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  BarChart3
} from 'lucide-react';
import { HabitsData } from '@/hooks/useDashboardStats';

interface HabitsConsistencyProps {
  data: HabitsData;
  isLoading: boolean;
  isGuest: boolean;
}

export const HabitsConsistency = ({ data, isLoading, isGuest }: HabitsConsistencyProps) => {
  if (isLoading) {
    return (
      <Card className="glass-card shadow-card">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted/50 rounded animate-pulse w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGuest) {
    return (
      <Card className="glass-card shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-secondary" />
            Habits & Consistency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Track your habit consistency by adding activities to your goals.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (data.consistencyTrend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendLabel = () => {
    switch (data.consistencyTrend) {
      case 'improving': return 'Improving';
      case 'declining': return 'Needs attention';
      default: return 'Stable';
    }
  };

  const getTrendBadgeVariant = () => {
    switch (data.consistencyTrend) {
      case 'improving': return 'default';
      case 'declining': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className="glass-card shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-secondary" />
            Habits & Consistency
          </CardTitle>
          <Badge variant={getTrendBadgeVariant()} className="flex items-center gap-1">
            {getTrendIcon()}
            {getTrendLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak highlight */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/5 border border-secondary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-secondary/10">
              <Flame className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.currentStreak}</p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{data.longestStreak}</p>
            <p className="text-xs text-muted-foreground">best streak</p>
          </div>
        </div>

        {/* Completion rates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <p className="text-xl font-bold mb-1">{data.weeklyCompletionRate}%</p>
            <Progress value={data.weeklyCompletionRate} className="h-1.5" />
          </div>
          <div className="p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Last 30 days</span>
            </div>
            <p className="text-xl font-bold mb-1">{data.monthlyCompletionRate}%</p>
            <Progress value={data.monthlyCompletionRate} className="h-1.5" />
          </div>
        </div>

        {/* Weekday vs Weekend */}
        <div className="p-3 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-3">Weekday vs Weekend</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">Weekdays</span>
                <span className="text-xs font-medium">{data.weekdayAverage}%</span>
              </div>
              <Progress value={data.weekdayAverage} className="h-1.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">Weekends</span>
                <span className="text-xs font-medium">{data.weekendAverage}%</span>
              </div>
              <Progress value={data.weekendAverage} className="h-1.5" />
            </div>
          </div>
        </div>

        {/* Insight text */}
        <div className="p-3 rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.insightText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

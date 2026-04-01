import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap, Target, Flame } from 'lucide-react';
import { LifeSnapshotData } from '@/hooks/useDashboardStats';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

interface LifeSnapshotProps {
  data: LifeSnapshotData;
  isLoading: boolean;
  isGuest: boolean;
}

export const LifeSnapshot = ({ data, isLoading, isGuest }: LifeSnapshotProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="glass-card shadow-card overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-8 bg-muted/50 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted/50 rounded animate-pulse w-full" />
            <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGuest) {
    return (
      <Card className="glass-card shadow-card overflow-hidden border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome, Explorer</h2>
              <p className="text-muted-foreground text-sm">
                Create an account to see your personalized life snapshot and track your growth journey.
              </p>
            </div>
            <button 
              onClick={() => navigate('/auth')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressLabel = (score: number) => {
    if (score >= 70) return 'Thriving';
    if (score >= 50) return 'Growing';
    if (score >= 30) return 'Building';
    return 'Starting';
  };

  return (
    <Card className="glass-card shadow-card overflow-hidden">
      <CardContent className="p-0">
        {/* Header with overall score */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">Your Life Snapshot</h2>
                <Badge variant="outline" className={getProgressColor(data.overallProgressScore)}>
                  {getProgressLabel(data.overallProgressScore)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.insightText}
              </p>
            </div>
            
            {/* Circular progress indicator */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6"
                  strokeDasharray={`${(data.overallProgressScore / 100) * 226} 226`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{data.overallProgressScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
          {/* Dominant Area */}
          <div className="p-3 rounded-lg bg-success/5 border border-success/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Strongest</span>
            </div>
            <p className="font-medium text-sm truncate">{data.dominantArea.name}</p>
            <Progress value={data.dominantArea.score * 10} className="h-1.5 mt-2" />
          </div>

          {/* Weakest Area */}
          <div className="p-3 rounded-lg bg-warning/5 border border-warning/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Focus</span>
            </div>
            <p className="font-medium text-sm truncate">{data.weakestArea.name}</p>
            <Progress value={data.weakestArea.score * 10} className="h-1.5 mt-2" />
          </div>

          {/* Active Goals */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Active Goals</span>
            </div>
            <p className="font-bold text-xl">{data.activeGoalsCount}</p>
            <p className="text-xs text-muted-foreground">{data.completedGoalsCount} completed</p>
          </div>

          {/* Current Streak */}
          <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/10">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Streak</span>
            </div>
            <p className="font-bold text-xl">{data.currentStreak}</p>
            <p className="text-xs text-muted-foreground">consecutive days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

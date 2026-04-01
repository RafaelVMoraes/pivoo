import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { GoalWithProgress } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';

interface GoalsOverviewProps {
  goals: GoalWithProgress[];
  isLoading: boolean;
  isGuest: boolean;
}

export const GoalsOverview = ({ goals, isLoading, isGuest }: GoalsOverviewProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="glass-card shadow-card">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted/50 rounded animate-pulse w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter(g => g.status !== 'completed');
  const overdueGoals = activeGoals.filter(g => g.isOverdue);
  const stalledGoals = activeGoals.filter(g => g.isStalled && !g.isOverdue);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'gold': return 'bg-amber-500';
      case 'silver': return 'bg-slate-400';
      default: return 'bg-orange-700';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'gold': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'silver': return 'bg-slate-400/10 text-slate-500 border-slate-400/20';
      default: return 'bg-orange-700/10 text-orange-700 border-orange-700/20';
    }
  };

  // Empty state
  if (activeGoals.length === 0 && !isGuest) {
    return (
      <Card className="glass-card shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Goals Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <Plus className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-medium">No active goals yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Set your first goal to start tracking your progress.
              </p>
            </div>
            <Button onClick={() => navigate('/goals')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
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
            <Target className="w-5 h-5 text-primary" />
            Goals Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in to track your goals and see progress.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show max 5 goals in overview
  const displayGoals = activeGoals.slice(0, 5);

  return (
    <Card className="glass-card shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Goals Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            {overdueGoals.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueGoals.length} overdue
              </Badge>
            )}
            {stalledGoals.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {stalledGoals.length} stalled
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayGoals.map((goal) => (
          <div 
            key={goal.id}
            className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/30 ${
              goal.isOverdue 
                ? 'border-destructive/30 bg-destructive/5' 
                : goal.isStalled 
                  ? 'border-warning/30 bg-warning/5'
                  : 'border-border'
            }`}
            onClick={() => navigate('/goals')}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getPriorityColor(goal.priority)}`} />
                <p className="font-medium text-sm truncate">{goal.title}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {goal.isOverdue && (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
                {goal.isStalled && !goal.isOverdue && (
                  <Clock className="w-4 h-4 text-warning" />
                )}
                {goal.status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Progress value={goal.progress} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground font-medium w-10 text-right">
                {goal.progress}%
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                {goal.completedActivities}/{goal.activityCount} activities
              </span>
              {goal.target_date && (
                <span className="text-xs text-muted-foreground">
                  · Due {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        ))}

        {activeGoals.length > 5 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-muted-foreground"
            onClick={() => navigate('/goals')}
          >
            View all {activeGoals.length} goals
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {activeGoals.length <= 5 && activeGoals.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/goals')}
          >
            Manage Goals
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

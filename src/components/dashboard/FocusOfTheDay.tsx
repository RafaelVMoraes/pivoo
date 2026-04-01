import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Target
} from 'lucide-react';
import { TodaysFocusData } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface FocusOfTheDayProps {
  data: TodaysFocusData;
  isLoading: boolean;
  isGuest: boolean;
  onCompleteTask: (activityId: string, goalId: string) => Promise<void>;
}

export const FocusOfTheDay = ({ data, isLoading, isGuest, onCompleteTask }: FocusOfTheDayProps) => {
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleComplete = async () => {
    if (!data.task || completing) return;
    
    setCompleting(true);
    try {
      await onCompleteTask(data.task.id, data.task.goal_id);
      setCompleted(true);
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card shadow-card">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted/50 rounded animate-pulse w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-10 bg-muted/50 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'gold': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'silver': return 'bg-slate-400/10 text-slate-500 border-slate-400/20';
      default: return 'bg-orange-700/10 text-orange-700 border-orange-700/20';
    }
  };

  // Empty state - no tasks for today
  if (!data.task && !isGuest) {
    return (
      <Card className="glass-card shadow-card border-secondary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <div>
              <p className="font-medium">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">
                No pending tasks for today. Great job staying on track!
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/goals')}
            >
              View All Goals
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Guest state
  if (isGuest) {
    return (
      <Card className="glass-card shadow-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Create goals and activities to see your daily focus here.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/goals')}
            >
              <Target className="w-4 h-4 mr-2" />
              Set Your First Goal
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card shadow-card ${completed ? 'border-success/30' : 'border-primary/20'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className={`w-5 h-5 ${completed ? 'text-success' : 'text-primary'}`} />
            Today's Focus
          </CardTitle>
          {data.overdueCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {data.overdueCount} overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main focus task */}
        <div className={`p-4 rounded-lg border transition-all ${
          completed 
            ? 'bg-success/5 border-success/20' 
            : 'bg-primary/5 border-primary/10'
        }`}>
          <div className="flex items-start gap-3">
            <Checkbox 
              checked={completed}
              disabled={completing || completed}
              onCheckedChange={() => handleComplete()}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className={`font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
                  {data.task?.description}
                </p>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(data.task?.goal.priority || 'bronze')}`}
                >
                  {data.task?.goal.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                From: {data.task?.goal.title}
              </p>
              {data.relatedValue && (
                <p className="text-xs text-primary/80 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Aligned with your value: <span className="font-medium">{data.relatedValue}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!completed && (
            <Button 
              size="sm" 
              onClick={handleComplete}
              disabled={completing}
              className="flex-1 sm:flex-none"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {completing ? 'Saving...' : 'Mark Done'}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/goals')}
            className="flex-1 sm:flex-none"
          >
            View All Tasks
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

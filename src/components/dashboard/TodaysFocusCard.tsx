/**
 * Today's Focus Card
 * Shows overdue and today's tasks with priority badges and completion action
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertTriangle, Zap, Target, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';


interface TaskItem {
  id: string;
  activityId: string;
  name: string;
  priority: 'gold' | 'silver' | 'bronze';
  goalTitle: string;
  goalId: string;
  isOverdue: boolean;
}

interface TodaysFocusData {
  tasks: TaskItem[];
  overdueCount: number;
  totalTodayCount: number;
}

interface TodaysFocusCardProps {
  data: TodaysFocusData;
  isLoading: boolean;
  isGuest: boolean;
  onRefresh?: () => void;
}

const priorityConfig = {
  gold: { 
    label: 'Gold', 
    className: 'bg-amber-500/20 text-amber-600 border-amber-500/30' 
  },
  silver: { 
    label: 'Silver', 
    className: 'bg-slate-400/20 text-slate-500 border-slate-400/30' 
  },
  bronze: { 
    label: 'Bronze', 
    className: 'bg-orange-600/20 text-orange-600 border-orange-600/30' 
  },
};

export const TodaysFocusCard = ({ data, isLoading, isGuest, onRefresh }: TodaysFocusCardProps) => {
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  

  // Filter out completed tasks (must be after useState declarations)
  const activeTasks = data.tasks.filter(task => !completedTasks.has(task.activityId));
  const hasNoTasks = activeTasks.length === 0;

  const [isOpen, setIsOpen] = useState(activeTasks.length > 0);

  const handleCompleteTask = async (task: TaskItem) => {
    if (isGuest || !user || completingTasks.has(task.activityId)) return;

    setCompletingTasks(prev => new Set(prev).add(task.activityId));

    try {
      // Store date as start-of-day to ensure consistent date matching
      const todayDate = new Date();
      todayDate.setHours(12, 0, 0, 0); // Noon to avoid timezone edge cases
      const { error } = await supabase
        .from('check_ins')
        .insert({
          activity_id: task.activityId,
          goal_id: task.goalId,
          user_id: user.id,
          progress_value: 'done',
          input_type: 'checkbox',
          date: todayDate.toISOString(),
        });

      if (error) throw error;
      
      setCompletedTasks(prev => new Set(prev).add(task.activityId));
      toast.success(t('dashboard.taskCompleted'));
      
      // Refetch activities data to update all dashboard components
      onRefresh?.();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error(t('dashboard.taskCompletionError'));
    } finally {
      setCompletingTasks(prev => {
        const next = new Set(prev);
        next.delete(task.activityId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
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
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  {t('dashboard.todaysFocus')}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {activeTasks.length} {t('dashboard.tasks')}
                </span>
                {data.overdueCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {data.overdueCount} {t('dashboard.overdue')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <ChevronDown 
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {hasNoTasks ? (
              <div className="flex flex-col items-center text-center py-6 gap-2">
                <Target className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.noTasksToday')}
                </p>
              </div>
            ) : (
              <>
                {/* Task List - Show up to 5 */}
                {activeTasks.slice(0, 5).map((task) => {
                  const isCompleting = completingTasks.has(task.activityId);
                  
                  return (
                    <div 
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        task.isOverdue 
                          ? 'bg-destructive/10 border-destructive/30' 
                          : 'bg-accent/30 border-border'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="flex-shrink-0">
                        {isCompleting ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Checkbox
                            checked={false}
                            disabled={isGuest || isCompleting}
                            onCheckedChange={() => handleCompleteTask(task)}
                            className="h-5 w-5"
                          />
                        )}
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {task.isOverdue && (
                            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-foreground truncate">
                            {task.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {task.goalTitle}
                        </p>
                      </div>

                      {/* Priority Badge */}
                      <Badge 
                        variant="outline" 
                        className={priorityConfig[task.priority].className}
                      >
                        {priorityConfig[task.priority].label}
                      </Badge>
                    </div>
                  );
                })}

                {/* View All Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/goals?view=tasks')}
                >
                  {t('dashboard.viewAllTasks')}
                </Button>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

import { useState, useMemo } from 'react';
import { useAllActivities } from '@/hooks/useAllActivities';
import { transformActivitiesToExecutionTasks } from '@/lib/executionTasks';
import { TaskSection, TaskData } from './TaskSection';
import { Card } from '@/components/ui/card';
import { CheckSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface TasksViewProps {
  goals: any[];
  isLoading: boolean;
}

export const TasksView = ({ goals, isLoading: goalsLoading }: TasksViewProps) => {
  const { t } = useTranslation();
  const { activities, checkIns, isLoading: activitiesLoading, createCheckIn, markCheckInAsNotDone, deleteCheckIn } =
    useAllActivities();
  const { toast } = useToast();

  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set());

  const isLoading = goalsLoading || activitiesLoading;

  const { late, today, thisWeek, thisMonth } = useMemo(() => {
    if (activities.length === 0) {
      return { late: [], today: [], thisWeek: [], thisMonth: [] };
    }
    return transformActivitiesToExecutionTasks(activities, checkIns, new Date());
  }, [activities, checkIns]);

  const handleToggleTask = async (task: TaskData) => {
    // If task is completed or was marked as not done, clear explicit state for this day
    if ((task.isCompleted || task.isNotDone) && !pendingTasks.has(task.id)) {
      setPendingTasks((prev) => new Set(prev).add(task.id));
      
      try {
        await deleteCheckIn(
          task.activityId,
          task.executionDate || new Date().toISOString()
        );

        toast({
          title: t('tasks.toast.undone.title'),
          description: t('tasks.toast.undone.description'),
        });
      } catch (error) {
        toast({
          title: t('tasks.toast.error.title'),
          description: t('tasks.toast.error.description'),
          variant: 'destructive',
        });
      } finally {
        setPendingTasks((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }
      return;
    }

    // If task is pending, mark as done
    if (!task.isCompleted && !task.isNotDone && !pendingTasks.has(task.id)) {
      setPendingTasks((prev) => new Set(prev).add(task.id));

      try {
        await createCheckIn(
          task.activityId,
          task.goalId,
          task.executionDate || new Date().toISOString()
        );

        toast({
          title: t('tasks.toast.completed.title'),
          description: t('tasks.toast.completed.description'),
        });
      } catch (error) {
        toast({
          title: t('tasks.toast.error.title'),
          description: t('tasks.toast.error.description'),
          variant: 'destructive',
        });
      } finally {
        setPendingTasks((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }
    }
  };

  const applyLocalCompletions = (tasks: TaskData[]): TaskData[] =>
    tasks.map((task) => task);

  const handleClearLateTasks = async () => {
    const lateTasks = applyLocalCompletions(late);
    const incompleteTasks = lateTasks.filter(task => !task.isCompleted);

    if (incompleteTasks.length === 0) return;

    try {
      // Mark all incomplete late tasks as not done (kept for KPI)
      await Promise.all(
        incompleteTasks.map(task =>
          markCheckInAsNotDone(
            task.activityId,
            task.goalId,
            task.executionDate || new Date().toISOString()
          )
        )
      );

      toast({
        title: t('tasks.toast.cleared.title'),
        description: t('tasks.toast.cleared.description', { count: incompleteTasks.length }),
      });

    } catch (error) {
      toast({
        title: t('tasks.toast.error.title'),
        description: t('tasks.toast.error.description'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  const hasNoTasks =
    late.length === 0 &&
    today.length === 0 &&
    thisWeek.length === 0 &&
    thisMonth.length === 0;

  if (hasNoTasks) {
    return (
      <div className="text-center py-12">
        <Card className="p-8 bg-accent/20">
          <CheckSquare size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t('tasks.empty.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('tasks.empty.description')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaskSection
        title={t('tasks.sections.late')}
        tasks={applyLocalCompletions(late)}
        onToggleTask={handleToggleTask}
        onClearAll={handleClearLateTasks}
      />
      <TaskSection
        title={t('tasks.sections.today')}
        tasks={applyLocalCompletions(today)}
        onToggleTask={handleToggleTask}
      />
      <TaskSection
        title={t('tasks.sections.thisWeek')}
        tasks={applyLocalCompletions(thisWeek)}
        onToggleTask={handleToggleTask}
        collapsible
      />
      <TaskSection
        title={t('tasks.sections.thisMonth')}
        tasks={applyLocalCompletions(thisMonth)}
        onToggleTask={handleToggleTask}
        collapsible
      />
    </div>
  );
};

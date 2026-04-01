import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskItem } from './TaskItem';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export interface TaskData {
  id: string;
  activityId: string;
  goalId: string;
  activityTitle: string;        // Primary display: activity title
  activityDescription?: string; // Secondary: description (for info modal)
  goalTitle: string;            // Parent goal title (for info modal)
  priority: 'gold' | 'silver' | 'bronze';
  frequencyType?: string | null;
  timeOfDay?: 'morning' | 'afternoon' | 'night' | 'whole_day' | null;
  daysOfWeek?: string[] | null;
  dayOfMonth?: number | null;
  executionDate?: string; // ISO date-time for this execution instance
  isCompleted: boolean;
  isNotDone?: boolean;
  isLate: boolean;
  sortOrder: number;
}

interface TaskSectionProps {
  title: string;
  tasks: TaskData[];
  onToggleTask: (task: TaskData) => void;
  onClearAll?: () => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const getDayContext = (task: TaskData): string | undefined => {
  if (task.frequencyType === 'weekly' && task.daysOfWeek?.length) {
    return task.daysOfWeek.join(', ');
  }
  if (task.frequencyType === 'monthly' && task.dayOfMonth) {
    return `Day ${task.dayOfMonth}`;
  }
  return undefined;
};

export const TaskSection = ({ 
  title, 
  tasks, 
  onToggleTask,
  onClearAll,
  collapsible = false,
  defaultCollapsed = false 
}: TaskSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { t } = useTranslation();

  if (tasks.length === 0) return null;

  const handleHeaderClick = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleHeaderClick}
          disabled={!collapsible}
          className={cn(
            'flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide text-left',
            collapsible && 'cursor-pointer hover:text-foreground transition-colors'
          )}
        >
          {collapsible && (
            isCollapsed 
              ? <ChevronRight size={16} className="shrink-0" /> 
              : <ChevronDown size={16} className="shrink-0" />
          )}
          <span>{title}</span>
          {collapsible && isCollapsed && (
            <span className="text-xs font-normal normal-case">({tasks.length})</span>
          )}
        </button>
        {onClearAll && tasks.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearAll}
            className="h-7 px-2 text-xs"
          >
            <X size={12} className="mr-1" />
            {t('tasks.clear')}
          </Button>
        )}
      </div>
      
{!isCollapsed && (
        <Card className="overflow-hidden">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              activityTitle={task.activityTitle}
              activityDescription={task.activityDescription}
              goalTitle={task.goalTitle}
              priority={task.priority}
              timeOfDay={task.timeOfDay}
              dayContext={getDayContext(task)}
              isCompleted={task.isCompleted}
              isLate={task.isLate}
              isNotDone={task.isNotDone}
              onToggle={() => onToggleTask(task)}
            />
          ))}
        </Card>
      )}
    </div>
  );
};
